import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
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
       GROUP BY d.id
       ORDER BY d.name ASC`
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden. Only Administrators can create departments.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, name, description, is_active = true, assigned_user_ids = [], assigned_form_ids = [] } = body;

    if (!code || !name) {
      return NextResponse.json({ error: 'Department code and name are required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim();

    // 1. Insert department
    const deptRes = await query(
      `INSERT INTO departments (code, name, description, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, code, name, description, is_active, created_at, updated_at`,
      [cleanCode, cleanName, description?.trim() || null, is_active, currentUser.id]
    );

    const newDept = deptRes.rows[0];

    // 2. Assign forms if provided
    if (Array.isArray(assigned_form_ids) && assigned_form_ids.length > 0) {
      for (const templateId of assigned_form_ids) {
        await query(
          `INSERT INTO department_forms (department_id, template_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [newDept.id, templateId]
        );
      }
    }

    // 3. Assign users if provided
    if (Array.isArray(assigned_user_ids) && assigned_user_ids.length > 0) {
      await query(
        `UPDATE users 
         SET department_id = $1 
         WHERE id = ANY($2)`,
        [newDept.id, assigned_user_ids]
      );
    }

    return NextResponse.json(newDept, { status: 201 });
  } catch (error: any) {
    console.error('Error creating department:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'A department with this code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
