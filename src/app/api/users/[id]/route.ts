import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Fetch target user
    const targetRes = await query<{
      id: string;
      role: string;
      department_id: string | null;
      full_name: string;
      username: string;
    }>(
      `SELECT id, role, department_id, full_name, username FROM users WHERE id = $1`,
      [id]
    );

    if (targetRes.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetRes.rows[0];

    // 2. Strict RBAC validation
    if (currentUser.role === 'SPV') {
      // SPV can ONLY update or reset password for TECHNICIAN users in their department
      if (targetUser.role !== 'TECHNICIAN') {
        return NextResponse.json(
          { error: 'Supervisors can only manage technician accounts' },
          { status: 403 }
        );
      }
      if (!currentUser.department_id || targetUser.department_id !== currentUser.department_id) {
        return NextResponse.json(
          { error: 'Supervisors can only manage technicians within their own department' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { password, full_name, employee_code, is_active, department_id, role } = body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Reset or update password
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      const hashedPassword = await hashPassword(password);
      updates.push(`password_hash = $${paramIndex++}`);
      values.push(hashedPassword);
    }

    // Full name
    if (typeof full_name === 'string' && full_name.trim().length > 0) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(full_name.trim());
    }

    // Employee code
    if (employee_code !== undefined) {
      updates.push(`employee_code = $${paramIndex++}`);
      values.push(employee_code ? employee_code.trim() : null);
    }

    // is_active status
    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    // Admin-only updates: department_id & role
    if (currentUser.role === 'ADMIN') {
      if (department_id !== undefined) {
        updates.push(`department_id = $${paramIndex++}`);
        values.push(department_id || null);
      }
      if (role && (role === 'ADMIN' || role === 'SPV' || role === 'TECHNICIAN')) {
        updates.push(`role = $${paramIndex++}`);
        values.push(role);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No changes provided' });
    }

    values.push(id);
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, employee_code, role, is_active, department_id
    `;

    const result = await query(updateQuery, values);
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SPV')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    // 1. Fetch target user
    const targetRes = await query<{
      id: string;
      role: string;
      department_id: string | null;
      full_name: string;
      username: string;
    }>(
      `SELECT id, role, department_id, full_name, username FROM users WHERE id = $1`,
      [id]
    );

    if (targetRes.rowCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetRes.rows[0];

    // 2. Prevent removing own active account
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own active account' },
        { status: 400 }
      );
    }

    // 3. Prevent removing primary system admin
    if (targetUser.username === 'admin') {
      return NextResponse.json(
        { error: 'The primary system admin account cannot be removed' },
        { status: 400 }
      );
    }

    // 4. RBAC for Supervisor
    if (currentUser.role === 'SPV') {
      if (targetUser.role !== 'TECHNICIAN') {
        return NextResponse.json(
          { error: 'Supervisors can only remove technician accounts' },
          { status: 403 }
        );
      }
      if (!currentUser.department_id || targetUser.department_id !== currentUser.department_id) {
        return NextResponse.json(
          { error: 'Supervisors can only remove technicians within their own department' },
          { status: 403 }
        );
      }
    }

    // 5. Connect dedicated client for atomic transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Clean up restricting foreign keys:
      // Delete audits modified by this user
      await client.query(`DELETE FROM form_submission_audits WHERE modified_by = $1`, [id]);
      // Delete submissions submitted by this user
      await client.query(`DELETE FROM form_submissions WHERE technician_id = $1`, [id]);

      // Nullify references in templates, departments, housekeeping
      await client.query(`UPDATE form_templates SET created_by = NULL WHERE created_by = $1`, [id]);
      await client.query(`UPDATE departments SET created_by = NULL WHERE created_by = $1`, [id]);
      await client.query(`UPDATE housekeeping_logs SET executed_by = NULL WHERE executed_by = $1`, [id]);

      // Delete user
      const delRes = await client.query(
        `DELETE FROM users WHERE id = $1 RETURNING id, username, full_name, role`,
        [id]
      );

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Account "${targetUser.username}" (${targetUser.full_name}) has been removed successfully`,
        deletedUser: delRes.rows[0],
      });
    } catch (txErr: any) {
      await client.query('ROLLBACK');
      throw txErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error removing user account:', error);
    return NextResponse.json({ error: error.message || 'Failed to remove user account' }, { status: 500 });
  }
}
