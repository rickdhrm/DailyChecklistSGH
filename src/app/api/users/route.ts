import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    let sql = `
      SELECT u.id, u.username, u.email, u.full_name, u.employee_code, u.role, u.is_active, u.created_at,
             u.department_id, d.name AS department_name, d.code AS department_code,
             creator.full_name AS registered_by_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users creator ON u.created_by = creator.id
    `;
    const params: any[] = [];

    // Supervisors can only see users from their own department
    if (currentUser.role === 'SPV') {
      if (!currentUser.department_id) {
        return NextResponse.json([]);
      }
      sql += ` WHERE u.department_id = $1`;
      params.push(currentUser.department_id);
    }

    sql += ` ORDER BY u.created_at DESC`;

    const res = await query(sql, params);
    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized. Only Admin and SPV can register users.' }, { status: 403 });
  }

  try {
    const { username, email, password, full_name, employee_code, role, department_id } = await request.json();

    if (!username || !email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let assignedRole: 'SPV' | 'TECHNICIAN' = 'TECHNICIAN';
    let targetDepartmentId: string | null = null;

    if (currentUser.role === 'ADMIN') {
      if (role === 'SPV') assignedRole = 'SPV';
      else assignedRole = 'TECHNICIAN';
      targetDepartmentId = department_id || null;
    } else if (currentUser.role === 'SPV') {
      // SPV can only create TECHNICIAN in their own department
      assignedRole = 'TECHNICIAN';
      targetDepartmentId = currentUser.department_id || null;
      if (!targetDepartmentId) {
        return NextResponse.json(
          { error: 'Supervisor is not assigned to a department yet. Cannot register technician.' },
          { status: 400 }
        );
      }
    }

    const hashedPassword = await hashPassword(password);

    const res = await query(
      `INSERT INTO users (username, email, password_hash, full_name, employee_code, role, is_active, created_by, department_id)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
       RETURNING id, username, email, full_name, employee_code, role, is_active, department_id, created_at`,
      [
        username.trim(),
        email.trim().toLowerCase(),
        hashedPassword,
        full_name.trim(),
        employee_code?.trim() || null,
        assignedRole,
        currentUser.id,
        targetDepartmentId,
      ]
    );

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}

