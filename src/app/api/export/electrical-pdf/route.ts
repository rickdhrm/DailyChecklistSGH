import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateElectricalLogsheetPdf } from '@/lib/pdfElectricalLogsheet';
import { ELECTRICAL_TEMPLATE_ID, ELECTRICAL_CHECKLIST_CODE } from '@/lib/electricalConstants';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const submissionId = searchParams.get('id') || searchParams.get('submission_id');
  const periodParam = searchParams.get('period'); // e.g., '2026-10'

  try {
    let subData: Record<string, any> = {};
    let metadata: {
      technicianName?: string;
      supervisorName?: string;
      buildingManagerName?: string;
      submittedAt?: string | Date;
      period?: string;
    } = {
      technicianName: currentUser.full_name || currentUser.username,
      submittedAt: new Date(),
      period: periodParam || undefined,
    };

    if (submissionId) {
      const res = await query(
        `SELECT s.*, u.full_name as technician_name, u.username as technician_username, l.name as location_name 
         FROM form_submissions s 
         JOIN users u ON s.technician_id = u.id 
         JOIN locations l ON s.location_id = l.id 
         WHERE s.id = $1`,
        [submissionId]
      );

      if (res.rowCount && res.rowCount > 0) {
        const row = res.rows[0];
        subData = row.submission_data || {};
        metadata = {
          technicianName: row.technician_name || row.technician_username || subData.teknisi_nama,
          supervisorName: subData.spv_nama,
          buildingManagerName: subData.bm_nama,
          submittedAt: row.submitted_at,
          period: subData.period || periodParam || undefined,
        };
      }
    } else if (periodParam) {
      // Find latest submission for this period and template
      const res = await query(
        `SELECT s.*, u.full_name as technician_name, u.username as technician_username 
         FROM form_submissions s 
         JOIN users u ON s.technician_id = u.id 
         WHERE (s.template_id = $1 OR s.template_id IN (SELECT id FROM form_templates WHERE code = $2))
           AND s.submission_data->>'period' = $3
         ORDER BY s.submitted_at DESC 
         LIMIT 1`,
        [ELECTRICAL_TEMPLATE_ID, ELECTRICAL_CHECKLIST_CODE, periodParam]
      );

      if (res.rowCount && res.rowCount > 0) {
        const row = res.rows[0];
        subData = row.submission_data || {};
        metadata = {
          technicianName: row.technician_name || row.technician_username || subData.teknisi_nama,
          supervisorName: subData.spv_nama,
          buildingManagerName: subData.bm_nama,
          submittedAt: row.submitted_at,
          period: periodParam,
        };
      } else {
        metadata.period = periodParam;
      }
    }

    const pdfBuffer = generateElectricalLogsheetPdf(subData, metadata);

    const safePeriod = (metadata.period || 'current').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = submissionId
      ? `SGH_Logsheet_Electrical_${safePeriod}_${submissionId.slice(0, 8)}.pdf`
      : `SGH_Logsheet_Electrical_${safePeriod}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error('Error generating Electrical Logsheet PDF:', err);
    return NextResponse.json(
      { error: 'Failed to generate Electrical Logsheet PDF' },
      { status: 500 }
    );
  }
}
