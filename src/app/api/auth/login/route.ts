import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, encodeSession, COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const res = await query(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.employee_code, u.role, u.is_active,
              u.department_id, d.name AS department_name, d.code AS department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE (u.username = $1 OR u.email = $1) AND u.is_active = true`,
      [username.trim()]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = res.rows[0];
    const isMatch = await verifyPassword(password, user.password_hash);

    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.full_name,
    };

    const token = encodeSession(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        employeeCode: user.employee_code,
        department_id: user.department_id,
        department_name: user.department_name,
        department_code: user.department_code,
        departmentId: user.department_id,
        departmentName: user.department_name,
      },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
