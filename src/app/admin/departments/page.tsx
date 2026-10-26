'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { User, Department, FormTemplate } from '@/types';
import { 
  Building2, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Save, 
  Loader2,
  Users,
  ClipboardList,
  Edit,
  Power,
  ShieldCheck,
  Check,
  ChevronRight,
  Layers,
  Trash2
} from 'lucide-react';

export default function DepartmentsAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allForms, setAllForms] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // Form Fields
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'USERS' | 'FORMS'>('GENERAL');
  
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [formSearchTerm, setFormSearchTerm] = useState('');

  // Delete Department Modal State
  const [deleteDeptModalOpen, setDeleteDeptModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);
  const [deleteDeptSubmitting, setDeleteDeptSubmitting] = useState(false);
  const [deleteDeptError, setDeleteDeptError] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.user.role !== 'ADMIN') {
          router.push('/');
          return;
        }
        setCurrentUser(meData.user);

        await Promise.all([
          fetchDepartments(),
          fetchUsers(),
          fetchForms()
        ]);
      } catch (err) {
        console.error('Error loading departments page:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const fetchDepartments = async () => {
    const res = await fetch('/api/departments');
    if (res.ok) {
      const data = await res.json();
      setDepartments(data);
    }
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) {
      const data = await res.json();
      setAllUsers(data);
    }
  };

  const fetchForms = async () => {
    const res = await fetch('/api/forms');
    if (res.ok) {
      const data = await res.json();
      setAllForms(data);
    }
  };

  // Toggle active status directly
  const handleToggleActive = async (dept: Department) => {
    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !dept.is_active }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update department status');
      }

      setFeedback(`Department "${dept.name}" is now ${!dept.is_active ? 'Active' : 'Disabled'}.`);
      await fetchDepartments();
    } catch (err: any) {
      setErrorFeedback(err.message);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingDeptId(null);
    setCode('');
    setName('');
    setDescription('');
    setIsActive(true);
    setSelectedUserIds([]);
    setSelectedFormIds([]);
    setActiveTab('GENERAL');
    setModalError(null);
    setUserSearchTerm('');
    setFormSearchTerm('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (dept: Department) => {
    setModalMode('EDIT');
    setEditingDeptId(dept.id);
    setCode(dept.code);
    setName(dept.name);
    setDescription(dept.description || '');
    setIsActive(dept.is_active);

    // Existing assigned users
    const currentUsers = (dept.assigned_users as any[]) || [];
    setSelectedUserIds(currentUsers.map((u) => u.id));

    // Existing assigned forms
    const currentForms = (dept.assigned_forms as any[]) || [];
    setSelectedFormIds(currentForms.map((f) => f.id));

    setActiveTab('GENERAL');
    setModalError(null);
    setUserSearchTerm('');
    setFormSearchTerm('');
    setIsModalOpen(true);
  };

  // Toggle User selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Toggle Form selection
  const toggleFormSelection = (formId: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    );
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        code,
        name,
        description,
        is_active: isActive,
        assigned_user_ids: selectedUserIds,
        assigned_form_ids: selectedFormIds,
      };

      let res;
      if (modalMode === 'CREATE') {
        res = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/departments/${editingDeptId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save department');

      setFeedback(
        modalMode === 'CREATE'
          ? `Department "${name}" created successfully with ${selectedUserIds.length} user(s) and ${selectedFormIds.length} form(s).`
          : `Department "${name}" updated successfully.`
      );

      setIsModalOpen(false);
      await Promise.all([fetchDepartments(), fetchUsers()]);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDeptModal = (dept: Department) => {
    setDeptToDelete(dept);
    setDeleteDeptError(null);
    setDeleteDeptModalOpen(true);
  };

  const handleDeleteDept = async () => {
    if (!deptToDelete) return;
    setDeleteDeptSubmitting(true);
    setDeleteDeptError(null);

    try {
      const res = await fetch(`/api/departments/${deptToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to remove department');
      }

      setFeedback(`Department "${deptToDelete.code} - ${deptToDelete.name}" was successfully removed.`);
      setDeleteDeptModalOpen(false);
      setDeptToDelete(null);
      await Promise.all([fetchDepartments(), fetchUsers(), fetchForms()]);
    } catch (err: any) {
      setDeleteDeptError(err.message || 'Error removing department');
    } finally {
      setDeleteDeptSubmitting(false);
    }
  };

  const filteredDepartments = departments.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
    );
  });

  const filteredUsersForAssign = allUsers.filter((u) => {
    const q = userSearchTerm.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.employee_code?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const filteredFormsForAssign = allForms.filter((f) => {
    const q = formSearchTerm.toLowerCase();
    return (
      f.title?.toLowerCase().includes(q) ||
      f.code?.toLowerCase().includes(q) ||
      f.category?.toLowerCase().includes(q)
    );
  });

  const totalActive = departments.filter((d) => d.is_active).length;
  const totalAssignedStaff = departments.reduce((acc, d) => acc + (Number(d.assigned_user_count) || 0), 0);

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
              <Building2 className="h-6 w-6 text-amber-600" />
              Department Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Organize building divisions, assign operational personnel, and allocate inspection forms. (Admin Only)
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create Department
          </button>
        </div>

        {/* Feedback alerts */}
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

        {errorFeedback && (
          <div className="mb-6 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>{errorFeedback}</span>
            </div>
            <button onClick={() => setErrorFeedback(null)} className="cursor-pointer">
              <X className="h-4 w-4 text-rose-600" />
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Departments</div>
              <div className="text-xl font-bold text-slate-900 font-serif">
                {departments.length}{' '}
                <span className="text-xs font-normal text-emerald-700">({totalActive} Active)</span>
              </div>
            </div>
          </div>

          <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Allocated Personnel</div>
              <div className="text-xl font-bold text-slate-900 font-serif">{totalAssignedStaff} Staff</div>
            </div>
          </div>

          <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Form Templates</div>
              <div className="text-xl font-bold text-slate-900 font-serif">{allForms.length} Operational Forms</div>
            </div>
          </div>
        </div>

        {/* Departments Grid */}
        <div className="facility-card bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Registered Divisions: <span className="font-bold text-slate-900">{filteredDepartments.length}</span>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search departments..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span>Loading department directories...</span>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Building2 className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No departments found</p>
              <p className="text-xs text-slate-400 mt-1">Click "Create Department" above to add your first division.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredDepartments.map((dept) => {
                const assignedUsersList = (dept.assigned_users as any[]) || [];
                const assignedFormsList = (dept.assigned_forms as any[]) || [];

                return (
                  <div
                    key={dept.id}
                    className={`rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                      dept.is_active
                        ? 'bg-white border-slate-200 hover:border-amber-500/40 hover:shadow-md'
                        : 'bg-slate-50/70 border-slate-200 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            {dept.code}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              dept.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {dept.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </div>

                        {/* Direct Enable/Disable Toggle */}
                        <button
                          onClick={() => handleToggleActive(dept)}
                          title={dept.is_active ? 'Disable department' : 'Enable department'}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            dept.is_active
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200'
                              : 'text-slate-400 bg-slate-100 border-slate-200 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm font-serif">{dept.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {dept.description || 'No division description provided.'}
                      </p>

                      {/* Division Stats / Badges */}
                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                            <Users className="h-3 w-3 text-amber-600" />
                            <span>Assigned Staff</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {dept.assigned_user_count || 0} Members
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-1.5 text-slate-500 text-[10px] uppercase font-semibold">
                            <ClipboardList className="h-3 w-3 text-amber-600" />
                            <span>Linked Forms</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-0.5">
                            {dept.assigned_form_count || 0} Forms
                          </div>
                        </div>
                      </div>

                      {/* Preview Chips */}
                      <div className="mt-3 space-y-2">
                        {assignedUsersList.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-slate-400 mr-1">Staff:</span>
                            {assignedUsersList.slice(0, 3).map((u: any) => (
                              <span
                                key={u.id}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200"
                              >
                                {u.full_name}
                              </span>
                            ))}
                            {assignedUsersList.length > 3 && (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                +{assignedUsersList.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        {assignedFormsList.length > 0 && (
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-slate-400 mr-1">Forms:</span>
                            {assignedFormsList.slice(0, 2).map((f: any) => (
                              <span
                                key={f.id}
                                className="text-[10px] bg-amber-50/60 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 font-mono"
                              >
                                {f.code}
                              </span>
                            ))}
                            {assignedFormsList.length > 2 && (
                              <span className="text-[10px] text-amber-700 font-semibold">
                                +{assignedFormsList.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 hover:text-amber-800 hover:border-amber-400 hover:bg-amber-50/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Manage & Assign</span>
                      </button>
                      <button
                        onClick={() => openDeleteDeptModal(dept)}
                        className="py-2 px-2.5 rounded-lg border border-rose-200 text-rose-600 hover:text-rose-800 hover:border-rose-400 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        title={`Remove ${dept.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        <span className="hidden sm:inline">Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create / Edit Department Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="facility-card w-full max-w-2xl p-6 shadow-2xl relative bg-white border border-slate-200 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-600" />
                    {modalMode === 'CREATE' ? 'Create New Department' : `Edit Department: ${name}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure department identity and assign user personnel and checklist forms.
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
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs shrink-0">
                  {modalError}
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4 shrink-0 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('GENERAL')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeTab === 'GENERAL'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  1. General Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('USERS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'USERS'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  2. Assign Users ({selectedUserIds.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FORMS')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    activeTab === 'FORMS'
                      ? 'bg-amber-50 text-amber-800 border border-amber-300'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  3. Assign Forms ({selectedFormIds.length})
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 flex-1 space-y-4">
                {activeTab === 'GENERAL' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Department Code *
                        </label>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value.toUpperCase())}
                          placeholder="e.g. MECH, ELEC, HVAC"
                          required
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs font-mono font-bold focus:bg-white"
                        />
                        <span className="text-[10px] text-slate-400">Short unique code used across checklists</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                          Department Name *
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Mechanical & Plumbing"
                          required
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                        Description / Scope
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed operational purview, areas of equipment managed, etc."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                      />
                    </div>

                    {/* Enable / Disable Switch */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">Department Status</div>
                        <div className="text-[11px] text-slate-500">
                          {isActive ? 'Department is active and visible in operations' : 'Department is disabled'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 flex items-center justify-between">
                      <span>Ready to assign staff and forms? Use the tabs above or click proceed.</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('USERS')}
                        className="text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Next: Users <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'USERS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Select team members to assign to <strong>{name || 'this department'}</strong>:
                      </div>
                      <div className="relative w-48">
                        <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          value={userSearchTerm}
                          onChange={(e) => setUserSearchTerm(e.target.value)}
                          placeholder="Filter users..."
                          className="w-full pl-7 pr-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                      {filteredUsersForAssign.map((user) => {
                        const isSelected = selectedUserIds.includes(user.id);
                        return (
                          <div
                            key={user.id}
                            onClick={() => toggleUserSelection(user.id)}
                            className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{user.full_name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {user.username} {user.employee_code ? `• ${user.employee_code}` : ''}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  user.role === 'ADMIN'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : user.role === 'SPV'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              >
                                {user.role}
                              </span>
                              {user.department_name && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {user.department_name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{selectedUserIds.length} user(s) selected</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('FORMS')}
                        className="text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        Next: Forms <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'FORMS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-slate-600">
                        Assign operational checklist forms to <strong>{name || 'this department'}</strong>:
                      </div>
                      <div className="relative w-48">
                        <Search className="absolute left-2.5 top-2 h-3 w-3 text-slate-400" />
                        <input
                          type="text"
                          value={formSearchTerm}
                          onChange={(e) => setFormSearchTerm(e.target.value)}
                          placeholder="Filter forms..."
                          className="w-full pl-7 pr-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2 bg-slate-50/50">
                      {filteredFormsForAssign.map((form) => {
                        const isSelected = selectedFormIds.includes(form.id);
                        return (
                          <div
                            key={form.id}
                            onClick={() => toggleFormSelection(form.id)}
                            className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-amber-50/80 border-amber-400 text-amber-950 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{form.title}</div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                  <span className="font-mono text-amber-700">{form.code}</span>
                                  <span>•</span>
                                  <span>{form.category}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              v{form.version}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-xs text-slate-500">
                      <span>{selectedFormIds.length} form template(s) assigned</span>
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4 shrink-0">
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
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        {modalMode === 'CREATE' ? 'Create Department' : 'Save Changes'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Delete Department Confirmation Modal */}
        {deleteDeptModalOpen && deptToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-rose-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-rose-100 text-rose-600 border border-rose-200 shrink-0">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base font-serif">Remove Department</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Confirm permanent removal of division
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteDeptModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {deleteDeptError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{deleteDeptError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Department Name:</span>
                    <span className="font-bold text-slate-900">{deptToDelete.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Code:</span>
                    <span className="font-mono font-semibold text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded">
                      {deptToDelete.code}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Assigned Staff:</span>
                    <span className="font-semibold text-slate-800">{deptToDelete.assigned_user_count || 0} Members</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Linked Checklists:</span>
                    <span className="font-semibold text-slate-800">{deptToDelete.assigned_form_count || 0} Forms</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Reassignment Notice:</span>
                    <p className="mt-0.5 text-amber-800 leading-relaxed">
                      Staff currently allocated to this department will become unassigned, and linked checklist forms will be unlinked.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to remove <strong className="text-slate-900">{deptToDelete.code} - {deptToDelete.name}</strong>? This action is permanent and cannot be undone.
                </p>

                <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setDeleteDeptModalOpen(false)}
                    disabled={deleteDeptSubmitting}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteDept}
                    disabled={deleteDeptSubmitting}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
                  >
                    {deleteDeptSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Removing Department...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Remove Department</span>
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
