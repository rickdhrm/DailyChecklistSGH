import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const res = await query(
      `SELECT 
        d.id, 
        d.code, 
        d.name, 
        d.description, 
        d.is_active, 
        d.created_at, 
        d.updated_at,
        COUNT(DISTINCT u.id)::int AS assigned_user_count,
        COUNT(DISTINCT df.template_id)::int AS assigned_form_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', u.id, 'full_name', u.full_name, 'username', u.username, 'role', u.role)
          ) FILTER (WHERE u.id IS NOT NULL), '[]'
        ) AS assigned_users,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', ft.id, 'code', ft.code, 'title', ft.title, 'category', ft.category)
          ) FILTER (WHERE ft.id IS NOT NULL), '[]'
        ) AS assigned_forms
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       LEFT JOIN department_forms df ON df.department_id = d.id
       LEFT JOIN form_templates ft ON df.template_id = ft.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Only Administrators can update departments.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, name, description, is_active, assigned_user_ids, assigned_form_ids } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (code !== undefined && code.trim().length > 0) {
      updates.push(`code = $${paramIndex++}`);
      values.push(code.trim().toUpperCase());
    }

    if (name !== undefined && name.trim().length > 0) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description ? description.trim() : null);
    }

    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(id);
      await query(
        `UPDATE departments SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Update assigned forms if array was supplied
    if (Array.isArray(assigned_form_ids)) {
      // Clear old assignments
      await query(`DELETE FROM department_forms WHERE department_id = $1`, [id]);
      // Insert new assignments
      for (const templateId of assigned_form_ids) {
        await query(
          `INSERT INTO department_forms (department_id, template_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, templateId]
        );
      }
    }

    // Update assigned users if array was supplied
    if (Array.isArray(assigned_user_ids)) {
      // Unassign users who were in this department but are not in the new array
      if (assigned_user_ids.length > 0) {
        await query(
          `UPDATE users SET department_id = NULL WHERE department_id = $1 AND NOT (id = ANY($2))`,
          [id, assigned_user_ids]
        );
        // Assign selected users to this department
        await query(
          `UPDATE users SET department_id = $1 WHERE id = ANY($2)`,
          [id, assigned_user_ids]
        );
      } else {
        // Unassign all users from this department
        await query(`UPDATE users SET department_id = NULL WHERE department_id = $1`, [id]);
      }
    }

    // Return updated record
    const updatedRes = await query(
      `SELECT 
        d.id, 
        d.code, 
        d.name, 
        d.description, 
        d.is_active, 
        d.created_at, 
        d.updated_at,
        COUNT(DISTINCT u.id)::int AS assigned_user_count,
        COUNT(DISTINCT df.template_id)::int AS assigned_form_count
       FROM departments d
       LEFT JOIN users u ON u.department_id = d.id
       LEFT JOIN department_forms df ON df.department_id = d.id
       WHERE d.id = $1
       GROUP BY d.id`,
      [id]
    );

    return NextResponse.json(updatedRes.rows[0]);
  } catch (error: any) {
    console.error('Error updating department:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A department with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}
