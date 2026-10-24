import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
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

    let sql = `
      SELECT ft.id, ft.code, ft.title, ft.description, ft.category, ft.form_type, ft.version, ft.is_active, ft.schema_definition, ft.created_at, ft.updated_at
      FROM form_templates ft
    `;
    const queryParams: any[] = [id];

    if (currentUser.role !== 'ADMIN') {
      if (!currentUser.department_id) {
        return NextResponse.json(
          { error: 'You are not assigned to any department. Contact your administrator.' },
          { status: 403 }
        );
      }
      sql += `
        INNER JOIN department_forms df ON df.template_id = ft.id
        WHERE ft.id = $1 AND df.department_id = $2
      `;
      queryParams.push(currentUser.department_id);
    } else {
      sql += ` WHERE ft.id = $1`;
    }

    const res = await query(sql, queryParams);

    if (res.rowCount === 0) {
      if (currentUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'This checklist form is not designated for your department' },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error fetching form template:', error);
    return NextResponse.json({ error: 'Failed to fetch form template' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized to update forms' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, category, form_type, schema_definition, is_active } = body;

    const res = await query(
      `UPDATE form_templates
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           category = COALESCE($3, category),
           form_type = COALESCE($4, form_type),
           schema_definition = COALESCE($5, schema_definition),
           is_active = COALESCE($6, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, code, title, description, category, form_type, version, is_active, schema_definition, updated_at`,
      [title, description, category, form_type, schema_definition ? JSON.stringify(schema_definition) : null, is_active, id]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Form template not found' }, { status: 404 });
    }

    return NextResponse.json(res.rows[0]);
  } catch (error: any) {
    console.error('Error updating form template:', error);
    return NextResponse.json({ error: 'Failed to update form template' }, { status: 500 });
  }
}
