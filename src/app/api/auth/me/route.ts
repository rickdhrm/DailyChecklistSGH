import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
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
}
