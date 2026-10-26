'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { User, UserRole, Department } from '@/types';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Wrench, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Loader2,
  KeyRound,
  Eye,
  EyeOff,
  Building2,
  Lock,
  Check,
  Trash2
} from 'lucide-react';

export default function UsersAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New user modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('TECHNICIAN');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Delete User Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        // Allow both ADMIN and SPV
        if (meData.user.role !== 'ADMIN' && meData.user.role !== 'SPV') {
          router.push('/');
          return;
        }
        setCurrentUser(meData.user);

        // Fetch users & departments
        await Promise.all([fetchUsersList(), fetchDepartmentsList()]);
      } catch (err) {
        console.error('Error initializing users page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const fetchUsersList = async () => {
    const usersRes = await fetch('/api/users');
    if (usersRes.ok) {
      const userList = await usersRes.json();
      setUsers(userList);
    }
  };

  const fetchDepartmentsList = async () => {
    const res = await fetch('/api/departments');
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
    }
  };

  // Open Register User Modal
  const openRegisterModal = () => {
    setUsername('');
    setPassword('');
    setShowPassword(false);
    setFullName('');
    setEmployeeCode('');
    setEmail('');
    setModalError(null);

    if (currentUser?.role === 'SPV') {
      // SPV locked to TECHNICIAN role and their own department
      setRole('TECHNICIAN');
      setDepartmentId(currentUser.department_id || '');
    } else {
      setRole('TECHNICIAN');
      setDepartmentId('');
    }

    setIsModalOpen(true);
  };

  const handleRegisterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const payload: any = {
        username,
        password,
        full_name: fullName,
        employee_code: employeeCode,
        email,
        role: currentUser?.role === 'SPV' ? 'TECHNICIAN' : role,
      };

      if (currentUser?.role === 'ADMIN') {
        payload.department_id = departmentId || null;
      } else if (currentUser?.role === 'SPV') {
        payload.department_id = currentUser.department_id;
      }

      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');

      setFeedback(`User account for "${fullName}" (${username}) successfully registered.`);
      setIsModalOpen(false);

      // Refresh list
      await fetchUsersList();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (user: User) => {
    setTargetUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowResetPassword(false);
    setResetError(null);
    setResetModalOpen(true);
  };

  // Submit Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetSubmitting(true);
    setResetError(null);

    try {
      const res = await fetch(`/api/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setFeedback(`Password for "${targetUser.full_name}" (${targetUser.username}) has been successfully updated.`);
      setResetModalOpen(false);
    } catch (err: any) {
      setResetError(err.message);
    } finally {
      setResetSubmitting(false);
    }
  };

  // Permission check for resetting password
  const canResetPassword = (user: User): boolean => {
    if (!currentUser) return false;
    // Admin can reset password of all users
    if (currentUser.role === 'ADMIN') return true;
    // SPV can only reset password for TECHNICIAN in their department
    if (currentUser.role === 'SPV') {
      return (
        user.role === 'TECHNICIAN' &&
        !!currentUser.department_id &&
        user.department_id === currentUser.department_id
      );
    }
    return false;
  };

  // Permission check for removing account
  const canDeleteUser = (user: User): boolean => {
    if (!currentUser) return false;
    // Cannot delete active self session
    if (user.id === currentUser.id) return false;
    // Cannot delete primary system admin
    if (user.username === 'admin') return false;
    // Admin can delete any user
    if (currentUser.role === 'ADMIN') return true;
    // SPV can only delete technicians in their department
    if (currentUser.role === 'SPV') {
      return (
        user.role === 'TECHNICIAN' &&
        !!currentUser.department_id &&
        user.department_id === currentUser.department_id
      );
    }
    return false;
  };

  const openDeleteModal = (user: User) => {
    setUserToDelete(user);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleteSubmitting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove user account');
      }

      setFeedback(`Account "${userToDelete.username}" (${userToDelete.full_name}) has been permanently removed.`);
      setDeleteModalOpen(false);
      setUserToDelete(null);
      await fetchUsersList();
    } catch (err: any) {
      setDeleteError(err.message || 'Error occurred while removing user account');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.employee_code?.toLowerCase().includes(q) ||
      u.department_name?.toLowerCase().includes(q)
    );

    if (currentUser?.role === 'SPV') {
      return matchesSearch;
    }

    if (deptFilter === 'ALL') return matchesSearch;
    if (deptFilter === 'UNASSIGNED') return matchesSearch && !u.department_id;
    return matchesSearch && u.department_id === deptFilter;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
              <Users className="h-6 w-6 text-amber-600" />
              Staff & User Provisioning
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser?.role === 'ADMIN'
                ? 'Enterprise Administration: Provision supervisors, technicians, assign departments, and manage security credentials.'
                : `Supervisor Portal: Provision technicians and manage credentials for your department (${currentUser?.department_name || 'Assigned Division'}).`}
            </p>
          </div>

          <button
            onClick={openRegisterModal}
            className="px-4 py-2.5 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            {currentUser?.role === 'ADMIN' ? 'Register New User' : 'Register Technician'}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-emerald-600" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-rose-600" />
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="facility-card overflow-hidden bg-white border border-slate-200 shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-3">
              <span>
                {currentUser?.role === 'SPV' ? 'Department Personnel:' : 'Total Accounts:'}{' '}
                <strong className="text-slate-900">{filtered.length}</strong>
              </span>
              {currentUser?.role === 'SPV' && (
                <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md text-[11px] font-semibold border border-amber-200 flex items-center gap-1.5">
                  <Building2 className="h-3 w-3 text-amber-600" />
                  <span>Division: {currentUser.department_name || 'Assigned Department'}</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2">
              {/* Department Filter (Admin only) */}
              {currentUser?.role === 'ADMIN' && (
                <div className="relative w-full sm:w-48">
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:bg-white"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="UNASSIGNED">Unassigned</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={currentUser?.role === 'SPV' ? 'Search department staff...' : 'Search name, code, dept...'}
                  className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span>Loading staff directory...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Username & Code</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((u) => {
                    const permittedToReset = canResetPassword(u);

                    return (
                      <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {u.full_name}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                          <div>{u.username}</div>
                          <span className="text-slate-400">{u.employee_code || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          {u.department_name ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50/70 text-amber-900 border border-amber-200/80 font-medium text-[11px]">
                              <Building2 className="h-3 w-3 text-amber-600" />
                              <span>{u.department_name}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : u.role === 'SPV'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {u.role === 'ADMIN' ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : u.role === 'SPV' ? (
                              <UserCheck className="h-3 w-3" />
                            ) : (
                              <Wrench className="h-3 w-3" />
                            )}
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {permittedToReset && (
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50/50 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Reset Password"
                              >
                                <KeyRound className="h-3 w-3 text-amber-600" />
                                <span className="hidden sm:inline">Reset Password</span>
                              </button>
                            )}
                            {canDeleteUser(u) && (
                              <button
                                onClick={() => openDeleteModal(u)}
                                className="px-2.5 py-1 rounded-md border border-rose-200 text-rose-600 hover:text-rose-800 hover:border-rose-400 hover:bg-rose-50 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                                title="Remove User Account"
                              >
                                <Trash2 className="h-3 w-3 text-rose-500" />
                                <span>Remove</span>
                              </button>
                            )}
                            {!permittedToReset && !canDeleteUser(u) && (
                              <span
                                title={
                                  u.id === currentUser?.id
                                    ? 'Current active user session'
                                    : u.username === 'admin'
                                    ? 'Primary system administrator account'
                                    : 'Protected account'
                                }
                                className="inline-flex items-center gap-1 text-[11px] text-slate-400 px-2 py-1 rounded bg-slate-100/60 cursor-not-allowed"
                              >
                                <Lock className="h-3 w-3 text-slate-400" />
                                {u.id === currentUser?.id ? 'Current User' : 'Protected'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        <Users className="h-7 w-7 mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-semibold text-slate-700">
                          {currentUser?.role === 'SPV'
                            ? `No personnel found in ${currentUser.department_name || 'your department'}`
                            : 'No personnel found matching the criteria'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {currentUser?.role === 'SPV'
                            ? 'Click "Register Technician" to add technicians to your department.'
                            : 'Try adjusting your search or department filter.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Register User Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="facility-card w-full max-w-lg p-6 shadow-2xl relative bg-white border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    {currentUser?.role === 'ADMIN' ? 'Register New Staff / User' : 'Register Department Technician'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentUser?.role === 'ADMIN'
                      ? 'Create credentials and assign department & role.'
                      : `Provision a technician account bound to ${currentUser?.department_name || 'your department'}.`}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleRegisterUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ahmad Fauzi"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. tech_ahmad"
                      required
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Employee Code
                    </label>
                    <input
                      type="text"
                      value={employeeCode}
                      onChange={(e) => setEmployeeCode(e.target.value)}
                      placeholder="e.g. TCH-105"
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmad@sgh.local"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                  />
                </div>

                {/* Password with View Toggle */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Role and Department */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Assigned Role
                    </label>
                    {currentUser?.role === 'ADMIN' ? (
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                      >
                        <option value="TECHNICIAN">Technician (Field Inspections)</option>
                        <option value="SPV">Supervisor (SPV)</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        value="Technician"
                        readOnly
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold cursor-not-allowed"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Department
                    </label>
                    {currentUser?.role === 'ADMIN' ? (
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.code} - {d.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={currentUser?.department_name || 'My Department'}
                        readOnly
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Create Account
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetModalOpen && targetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="facility-card w-full max-w-md p-6 shadow-2xl relative bg-white border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-amber-600" />
                    Reset Password
                  </h3>
                  <p className="text-xs text-slate-500">
                    Set a new security password for {targetUser.full_name}.
                  </p>
                </div>
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User details badge */}
              <div className="mb-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target User:</span>
                  <span className="font-bold text-slate-900">{targetUser.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono text-slate-700">{targetUser.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="text-amber-800 font-medium">
                    {targetUser.department_name || 'Unassigned'}
                  </span>
                </div>
              </div>

              {resetError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {resetError}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showResetPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      minLength={6}
                      className="w-full pl-3 pr-10 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="px-4 py-2 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {resetSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-3.5 w-3.5" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-rose-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-serif">Remove Account</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confirm permanent removal of staff credentials
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {deleteError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Full Name:</span>
                    <span className="font-bold text-slate-900">{userToDelete.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Username:</span>
                    <span className="font-mono font-semibold text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {userToDelete.username}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-semibold text-slate-800">{userToDelete.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Department:</span>
                    <span className="font-semibold text-slate-800">
                      {userToDelete.department_name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                {userToDelete.submission_count !== undefined && userToDelete.submission_count > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Notice regarding checklist records:</span>
                      <p className="mt-0.5 text-amber-800 leading-relaxed">
                        This user has submitted <strong>{userToDelete.submission_count} form(s)</strong>. Removing this account will also remove associated inspection records from the system.
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-900">@{userToDelete.username}</strong>? This user will no longer be able to log in, and all assigned credentials will be wiped immediately.
                </p>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deleteSubmitting}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    disabled={deleteSubmitting}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
                  >
                    {deleteSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Removing Account...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
