import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let sql = `
      SELECT DISTINCT ft.id, ft.code, ft.title, ft.description, ft.category, ft.form_type, ft.version, ft.is_active, ft.schema_definition, ft.created_at, ft.updated_at
      FROM form_templates ft
    `;
    const params: any[] = [];

    // Admins see all active forms
    if (currentUser.role === 'ADMIN') {
      sql += ` WHERE ft.is_active = true`;
    } else {
      // Technicians and SPVs only see forms designated for their department
      if (!currentUser.department_id) {
        return NextResponse.json([]);
      }
      sql += `
        INNER JOIN department_forms df ON df.template_id = ft.id
        WHERE ft.is_active = true AND df.department_id = $1
      `;
      params.push(currentUser.department_id);
    }

    sql += ` ORDER BY ft.category, ft.title ASC`;

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching forms:', error);
    return NextResponse.json({ error: 'Failed to fetch form templates' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized to create forms' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { code, title, description, category, form_type, schema_definition } = body;

    if (!title || !schema_definition) {
      return NextResponse.json({ error: 'Form title and schema definition are required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const cleanCode = code?.trim()
      ? code.trim().toUpperCase()
      : `CHK-${cleanTitle.toUpperCase().replace(/[^A-Z0-9]+/g, '-').slice(0, 20)}-${Date.now().toString().slice(-4)}`;
    const cleanCategory = category?.trim() || 'General';

    const res = await query(
      `INSERT INTO form_templates (code, title, description, category, form_type, version, is_active, schema_definition, created_by)
       VALUES ($1, $2, $3, $4, $5, 1, true, $6, $7)
       RETURNING id, code, title, description, category, form_type, version, is_active, schema_definition, created_at`,
      [cleanCode, cleanTitle, description || '', cleanCategory, form_type || 'CUSTOM', JSON.stringify(schema_definition), currentUser.id]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating form template:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Form template code already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create form template' }, { status: 500 });
  }
}
