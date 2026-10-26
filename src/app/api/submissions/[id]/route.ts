import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const res = await query(
      `SELECT s.id, s.template_id, s.template_version, s.technician_id, s.location_id,
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
       WHERE s.id = $1`,
      [id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const submission = res.rows[0];

    // RBAC: technician can only view their own unless Admin/SPV
    if (currentUser.role === 'TECHNICIAN' && submission.technician_id !== currentUser.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(submission);
  } catch (error: any) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { submission_data, technician_notes, has_abnormal_reading, change_reason } = body;

    // Get current record to verify ownership and record audit
    const existingRes = await query(`SELECT * FROM form_submissions WHERE id = $1`, [id]);
    if (existingRes.rowCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }
    const existing = existingRes.rows[0];

    if (currentUser.role === 'TECHNICIAN' && existing.technician_id !== currentUser.id) {
      return NextResponse.json({ error: 'You can only edit your own submissions' }, { status: 403 });
    }

    // 1. Insert audit log
    await query(
      `INSERT INTO form_submission_audits (
        submission_id, modified_by, previous_data, new_data, change_reason
      ) VALUES ($1, $2, $3, $4, $5)`,
      [
        id,
        currentUser.id,
        JSON.stringify(existing.submission_data),
        JSON.stringify(submission_data || existing.submission_data),
        change_reason || 'Updated by user'
      ]
    );

    // 2. Update submission
    const res = await query(
      `UPDATE form_submissions
       SET submission_data = COALESCE($1, submission_data),
           technician_notes = COALESCE($2, technician_notes),
           has_abnormal_reading = COALESCE($3, has_abnormal_reading),
           status = 'REVISED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, status, updated_at`,
      [
        submission_data ? JSON.stringify(submission_data) : null,
        technician_notes,
        has_abnormal_reading,
        id
      ]
    );

    return NextResponse.json({ success: true, updated: res.rows[0] });
  } catch (error: any) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only Admin and Supervisor can remove submissions
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV') {
    return NextResponse.json(
      { error: 'Forbidden. Only supervisors and administrators can remove submissions.' },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    // Fetch submission with technician department info
    const subRes = await query(
      `SELECT s.id, s.technician_id, s.template_id, u.department_id, t.title as template_title
       FROM form_submissions s
       JOIN users u ON s.technician_id = u.id
       JOIN form_templates t ON s.template_id = t.id
       WHERE s.id = $1`,
      [id]
    );

    if (subRes.rowCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    const sub = subRes.rows[0];

    // RBAC: SPV can only remove submissions in their department
    if (currentUser.role === 'SPV') {
      const isSameDept = currentUser.department_id && sub.department_id === currentUser.department_id;
      const isSelf = sub.technician_id === currentUser.id;
      
      // Also check if the template belongs to SPV's department
      const deptFormCheck = currentUser.department_id
        ? await query(
            `SELECT 1 FROM department_forms WHERE department_id = $1 AND template_id = $2`,
            [currentUser.department_id, sub.template_id]
          )
        : { rowCount: 0 };

      const isDeptForm = deptFormCheck.rowCount && deptFormCheck.rowCount > 0;

      if (!isSameDept && !isSelf && !isDeptForm) {
        return NextResponse.json(
          { error: 'Supervisors can only remove submissions within their own department.' },
          { status: 403 }
        );
      }
    }

    // Atomic deletion
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM form_submission_audits WHERE submission_id = $1`, [id]);
      const delRes = await client.query(
        `DELETE FROM form_submissions WHERE id = $1 RETURNING id, template_id, technician_id`,
        [id]
      );
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Submission for "${sub.template_title}" was successfully removed.`,
        deletedSubmission: delRes.rows[0],
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error removing submission:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove submission' }, { status: 500 });
  }
}
