import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  ELECTRICAL_TEMPLATE_ID,
  ELECTRICAL_CHECKLIST_CODE,
  calculateTotalKwh,
} from '@/lib/electricalConstants';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const period = searchParams.get('period') || defaultPeriod;

  try {
    // Find active submission for this period
    const res = await query(
      `SELECT s.id, s.template_id, s.technician_id, s.submission_data, s.status, s.submitted_at, s.updated_at,
              u.full_name as technician_name, u.username as technician_username
       FROM form_submissions s
       JOIN users u ON s.technician_id = u.id
       WHERE (s.template_id = $1 OR s.template_id IN (SELECT id FROM form_templates WHERE code = $2))
         AND s.submission_data->>'period' = $3
       ORDER BY s.submitted_at DESC
       LIMIT 1`,
      [ELECTRICAL_TEMPLATE_ID, ELECTRICAL_CHECKLIST_CODE, period]
    );

    let submission = null;
    let days: Record<string, any> = {};

    if (res.rowCount && res.rowCount > 0) {
      submission = res.rows[0];
      days = submission.submission_data?.days || {};
    }

    return NextResponse.json({
      period,
      submissionId: submission ? submission.id : null,
      status: submission ? submission.status : 'NEW',
      submissionData: submission ? submission.submission_data : null,
      days,
    });
  } catch (err: any) {
    console.error('Error fetching monthly electrical data:', err);
    return NextResponse.json(
      { error: 'Failed to fetch electrical logsheet data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { period, day, entry, days: fullDays, technician_notes } = body;

    const now = new Date();
    const targetPeriod = period || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get default location
    const locRes = await query(`SELECT id FROM locations LIMIT 1`);
    const locationId = locRes.rows[0]?.id;
    if (!locationId) {
      return NextResponse.json({ error: 'No location configured' }, { status: 400 });
    }

    // Verify template ID
    const tmplRes = await query(
      `SELECT id, version FROM form_templates WHERE id = $1 OR code = $2 LIMIT 1`,
      [ELECTRICAL_TEMPLATE_ID, ELECTRICAL_CHECKLIST_CODE]
    );
    if (tmplRes.rowCount === 0) {
      return NextResponse.json({ error: 'Electrical form template not found' }, { status: 404 });
    }
    const templateId = tmplRes.rows[0].id;
    const templateVersion = tmplRes.rows[0].version || 1;

    // Check if a monthly record already exists for this period
    const existingRes = await query(
      `SELECT id, submission_data FROM form_submissions 
       WHERE template_id = $1 AND submission_data->>'period' = $2 
       LIMIT 1`,
      [templateId, targetPeriod]
    );

    let mergedDays: Record<string, any> = {};
    let existingData: Record<string, any> = {};
    let submissionId: string | null = null;

    if (existingRes.rowCount && existingRes.rowCount > 0) {
      submissionId = existingRes.rows[0].id;
      existingData = existingRes.rows[0].submission_data || {};
      mergedDays = { ...(existingData.days || {}) };
    }

    if (fullDays && typeof fullDays === 'object') {
      mergedDays = { ...mergedDays, ...fullDays };
    }

    // If a single day entry was submitted
    if (day !== undefined && day !== null && entry) {
      const dayNum = parseInt(String(day), 10);
      if (dayNum >= 1 && dayNum <= 31) {
        // Calculate Total KWH if WBP and LWBP are provided
        const wbp = entry.kwh_wbp;
        const lwbp = entry.kwh_lwbp_1;
        let totalKwh = entry.total_kwh;
        if ((!totalKwh || totalKwh === '') && (wbp || lwbp)) {
          totalKwh = calculateTotalKwh(wbp, lwbp);
        }

        mergedDays[String(dayNum)] = {
          ...entry,
          tgl: dayNum,
          total_kwh: totalKwh || '',
          dicek_oleh: entry.dicek_oleh || currentUser.full_name || currentUser.username,
          updated_at: new Date().toISOString(),
        };
      }
    }

    const updatedSubmissionData = {
      ...existingData,
      period: targetPeriod,
      teknisi_nama: currentUser.full_name || currentUser.username,
      days: mergedDays,
    };

    if (submissionId) {
      // Update existing submission
      await query(
        `UPDATE form_submissions 
         SET submission_data = $1, 
             technician_notes = COALESCE($2, technician_notes),
             updated_at = NOW() 
         WHERE id = $3`,
        [JSON.stringify(updatedSubmissionData), technician_notes || null, submissionId]
      );
    } else {
      // Insert new submission
      const insertRes = await query(
        `INSERT INTO form_submissions (
          template_id, template_version, technician_id, location_id,
          status, has_abnormal_reading, technician_notes, submission_data
        ) VALUES ($1, $2, $3, $4, 'SUBMITTED', false, $5, $6)
        RETURNING id`,
        [
          templateId,
          templateVersion,
          currentUser.id,
          locationId,
          technician_notes || 'Monthly Electrical Logsheet',
          JSON.stringify(updatedSubmissionData),
        ]
      );
      submissionId = insertRes.rows[0].id;
    }

    return NextResponse.json({
      success: true,
      submissionId,
      period: targetPeriod,
      daysCount: Object.keys(mergedDays).length,
      days: mergedDays,
    });
  } catch (err: any) {
    console.error('Error saving monthly electrical logsheet:', err);
    return NextResponse.json(
      { error: 'Failed to save electrical logsheet' },
      { status: 500 }
    );
  }
}
