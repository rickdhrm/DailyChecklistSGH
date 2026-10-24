import { cookies } from 'next/headers';
import { query } from './db';
import { User, UserRole } from '@/types';
import bcrypt from 'bcryptjs';

const COOKIE_NAME = 'sgh_session';

export interface SessionData {
  userId: string;
  username: string;
  role: UserRole;
  fullName: string;
}

export function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

export function decodeSession(token: string): SessionData | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;

  const session = decodeSession(sessionToken);
  if (!session) return null;

  const res = await query<User>(
    `SELECT u.id, u.username, u.email, u.full_name, u.employee_code, u.role, u.is_active, u.created_by, u.created_at,
            u.department_id, d.name AS department_name, d.code AS department_code
     FROM users u
     LEFT JOIN departments d ON u.department_id = d.id
     WHERE u.id = $1 AND u.is_active = true`,
    [session.userId]
  );

  return res.rows[0] || null;
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export { COOKIE_NAME };
