import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const locationId = searchParams.get('location_id');
  const dateFrom = searchParams.get('date_from') || searchParams.get('from');
  const dateTo = searchParams.get('date_to') || searchParams.get('to');
  const templateId = searchParams.get('template_id');
  const status = searchParams.get('status');
  const technicianId = searchParams.get('technician_id');

  try {
    let sql = `
      SELECT s.id, s.template_id, s.template_version, s.technician_id, s.location_id,
             s.status, s.has_abnormal_reading, s.technician_notes, s.submission_data,
             s.submitted_at, s.updated_at, s.is_archived,
             t.title AS template_title, t.code AS template_code, t.category AS template_category,
             t.form_type AS template_form_type, t.schema_definition,
             u.full_name AS technician_name, u.employee_code,
             COALESCE(d.id, (SELECT df.department_id FROM department_forms df WHERE df.template_id = s.template_id LIMIT 1)) AS department_id,
             COALESCE(d.name, (SELECT d2.name FROM department_forms df JOIN departments d2 ON df.department_id = d2.id WHERE df.template_id = s.template_id LIMIT 1)) AS department_name,
             COALESCE(d.code, (SELECT d2.code FROM department_forms df JOIN departments d2 ON df.department_id = d2.id WHERE df.template_id = s.template_id LIMIT 1)) AS department_code,
             l.name AS location_name, l.floor AS location_floor, l.building AS location_building
      FROM form_submissions s
      JOIN form_templates t ON s.template_id = t.id
      JOIN users u ON s.technician_id = u.id
      LEFT JOIN departments d ON u.department_id = d.id
      JOIN locations l ON s.location_id = l.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let pIdx = 1;

    // Technicians only see their own submissions
    if (currentUser.role === 'TECHNICIAN') {
      sql += ` AND s.technician_id = $${pIdx++}`;
      params.push(currentUser.id);
    } else if (currentUser.role === 'SPV') {
      // Supervisors see:
      // 1. Submissions by technicians in their department
      // 2. Submissions made by the SPV themselves
      // 3. Submissions for checklist forms designated to their department
      if (currentUser.department_id) {
        sql += ` AND (
          u.department_id = $${pIdx}
          OR s.technician_id = $${pIdx + 1}
          OR s.template_id IN (SELECT template_id FROM department_forms WHERE department_id = $${pIdx})
        )`;
        params.push(currentUser.department_id, currentUser.id);
        pIdx += 2;
      } else {
        // Fallback if SPV has no department assigned yet
        sql += ` AND s.technician_id = $${pIdx++}`;
        params.push(currentUser.id);
      }

      if (technicianId) {
        sql += ` AND s.technician_id = $${pIdx++}`;
        params.push(technicianId);
      }
    } else if (technicianId) {
      sql += ` AND s.technician_id = $${pIdx++}`;
      params.push(technicianId);
    }

    if (locationId) {
      sql += ` AND s.location_id = $${pIdx++}`;
      params.push(locationId);
    }

    if (templateId) {
      sql += ` AND s.template_id = $${pIdx++}`;
      params.push(templateId);
    }

    if (status) {
      sql += ` AND s.status = $${pIdx++}`;
      params.push(status);
    }

    if (dateFrom) {
      sql += ` AND s.submitted_at >= $${pIdx++}::timestamptz`;
      params.push(dateFrom);
    }

    if (dateTo) {
      const formattedDateTo = dateTo.length === 10 ? `${dateTo}T23:59:59.999Z` : dateTo;
      sql += ` AND s.submitted_at <= $${pIdx++}::timestamptz`;
      params.push(formattedDateTo);
    }

    sql += ` ORDER BY s.submitted_at DESC LIMIT 200`;

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error querying submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { template_id, location_id, submission_data, technician_notes, has_abnormal_reading } = body;

    if (!template_id || !location_id || !submission_data) {
      return NextResponse.json({ error: 'Missing required submission fields' }, { status: 400 });
    }

    // Fetch active template version
    const tmplRes = await query(`SELECT version FROM form_templates WHERE id = $1`, [template_id]);
    if (tmplRes.rowCount === 0) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 });
    }
    const templateVersion = tmplRes.rows[0].version;

    // For non-admin, verify the form is designated for their department
    if (currentUser.role !== 'ADMIN') {
      if (!currentUser.department_id) {
        return NextResponse.json({ error: 'You are not assigned to any department' }, { status: 403 });
      }
      const deptFormCheck = await query(
        `SELECT 1 FROM department_forms WHERE department_id = $1 AND template_id = $2`,
        [currentUser.department_id, template_id]
      );
      if (deptFormCheck.rowCount === 0) {
        return NextResponse.json(
          { error: 'You are not authorized to submit checklist forms outside your designated department' },
          { status: 403 }
        );
      }
    }

    const status = has_abnormal_reading ? 'FLAGGED_ABNORMAL' : 'SUBMITTED';

    const res = await query(
      `INSERT INTO form_submissions (
        template_id, template_version, technician_id, location_id, status, has_abnormal_reading, technician_notes, submission_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, template_id, template_version, technician_id, location_id, status, has_abnormal_reading, submitted_at`,
      [
        template_id,
        templateVersion,
        currentUser.id,
        location_id,
        status,
        !!has_abnormal_reading,
        technician_notes || '',
        JSON.stringify(submission_data)
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
  }
}
