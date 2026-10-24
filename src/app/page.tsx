'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import SubmissionDetailModal from '@/components/submissions/SubmissionDetailModal';
import { FormTemplate, FormSubmission, User, Department } from '@/types';
import { 
  ClipboardCheck, 
  ClipboardList,
  Building2,
  Search, 
  ArrowRight, 
  Wrench, 
  Activity, 
  Zap, 
  Flame, 
  ShieldCheck, 
  Radio, 
  Server, 
  Wind, 
  Sliders, 
  FileSpreadsheet, 
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Calendar,
  Clock,
  User as UserIcon,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [submissionScope, setSubmissionScope] = useState<'TODAY' | 'ALL'>('TODAY');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'SUBMISSIONS' | 'FORMS'>('SUBMISSIONS');

  // Modal State
  const [inspectSubmission, setInspectSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        // Fetch forms
        const formRes = await fetch('/api/forms');
        if (formRes.ok) {
          const forms = await formRes.json();
          setTemplates(forms);
        }

        // Fetch submissions (for Admin, SPV, and Technician recent checks)
        const subRes = await fetch('/api/submissions');
        if (subRes.ok) {
          const subs = await subRes.json();
          setSubmissions(subs);
          // If no submissions recorded today but historical submissions exist, switch to ALL so user sees data
          const hasToday = subs.some((s: FormSubmission) => isDateToday(s.submitted_at));
          if (!hasToday && subs.length > 0) {
            setSubmissionScope('ALL');
          }
        }

        // If Admin, also load departments for filtering
        if (meData.user?.role === 'ADMIN') {
          const deptRes = await fetch('/api/departments');
          if (deptRes.ok) {
            const depts = await deptRes.json();
            setDepartments(depts);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // Helper to check if a date string is today
  const isDateToday = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Submissions filtered by scope, department, status, and search
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Scope filter (Today vs All)
      if (submissionScope === 'TODAY' && !isDateToday(sub.submitted_at)) {
        return false;
      }

      // 2. Department filter (Admin only)
      if (user?.role === 'ADMIN' && selectedDeptFilter !== 'ALL') {
        if (sub.department_id !== selectedDeptFilter && sub.department_name !== selectedDeptFilter) {
          return false;
        }
      }

      // 3. Status filter
      if (selectedStatusFilter === 'ABNORMAL' && !sub.has_abnormal_reading) {
        return false;
      }
      if (selectedStatusFilter === 'NORMAL' && sub.has_abnormal_reading) {
        return false;
      }

      // 4. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = sub.template_title?.toLowerCase().includes(q);
        const matchCode = sub.template_code?.toLowerCase().includes(q);
        const matchTech = sub.technician_name?.toLowerCase().includes(q);
        const matchLoc = sub.location_name?.toLowerCase().includes(q);
        const matchDept = sub.department_name?.toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchTech && !matchLoc && !matchDept) {
          return false;
        }
      }

      return true;
    });
  }, [submissions, submissionScope, selectedDeptFilter, selectedStatusFilter, searchTerm, user]);

  // KPI Calculations
  const todaySubmissions = useMemo(() => submissions.filter((s) => isDateToday(s.submitted_at)), [submissions]);
  const todayAbnormalCount = useMemo(() => todaySubmissions.filter((s) => s.has_abnormal_reading).length, [todaySubmissions]);
  const todayActiveDeptCount = useMemo(() => {
    const depts = new Set(todaySubmissions.map((s) => s.department_id).filter(Boolean));
    return depts.size;
  }, [todaySubmissions]);

  // Form Icon helper
  const getFormIcon = (code: string) => {
    switch (code) {
      case 'CHK-POMPA':
        return <Activity className="h-5 w-5 text-blue-600" />;
      case 'CHK-LIFT':
        return <Wrench className="h-5 w-5 text-indigo-600" />;
      case 'CHK-MCFA':
        return <ShieldCheck className="h-5 w-5 text-rose-600" />;
      case 'CHK-ACCESS':
        return <Server className="h-5 w-5 text-emerald-600" />;
      case 'CHK-PAGING':
        return <Radio className="h-5 w-5 text-purple-600" />;
      case 'CHK-ITM-DAIKIN':
        return <Wind className="h-5 w-5 text-cyan-600" />;
      case 'CHK-GAS':
        return <Flame className="h-5 w-5 text-amber-600" />;
      case 'CHK-PLN':
        return <Zap className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClipboardCheck className="h-5 w-5 text-amber-600" />;
    }
  };

  // Filtered Templates for Technicians (or Admin/SPV launcher)
  const categories = ['ALL', ...Array.from(new Set(templates.map((t) => t.category)))];

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [templates, selectedCategory, searchTerm]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-2" />
        <span>Loading SGH operations dashboard...</span>
      </div>
    );
  }

  const role = user?.role;
  const isSuperAdmin = role === 'ADMIN';
  const isSpv = role === 'SPV';
  const isTechnician = role === 'TECHNICIAN';

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================================= */}
        {/* TOP WELCOME BANNER & ROLE BADGE                                          */}
        {/* ========================================================================= */}
        <div className="facility-card p-5 sm:p-6 bg-gradient-to-r from-white via-amber-50/25 to-slate-50 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-bold text-amber-800 font-mono">
                  SGH Tower • Operations Command
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                {user?.department_name && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      <Building2 className="h-3 w-3 text-amber-600" />
                      {user.department_name}
                    </span>
                  </>
                )}
              </div>

              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-serif">
                {isSuperAdmin && 'Facility Executive Command Dashboard'}
                {isSpv && `${user?.department_name || 'Department'} Supervisor Portal`}
                {isTechnician && `Daily Checklist Fast Launchpad`}
              </h1>

              <p className="text-xs text-slate-600 mt-1">
                {isSuperAdmin && 'Real-time daily inspection feed and submissions across all building departments.'}
                {isSpv && `Review today's submitted checklist forms and monitor equipment status in your division.`}
                {isTechnician && `Select any assigned checklist below for fast one-tap inspection logging.`}
              </p>
            </div>

            {/* Quick Action Links */}
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {isSuperAdmin && (
                <>
                  <Link
                    href="/admin/departments"
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Building2 className="h-3.5 w-3.5 text-amber-600" />
                    Departments
                  </Link>
                  <Link
                    href="/admin/submissions"
                    className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-700" />
                    Submissions Hub
                  </Link>
                </>
              )}

              {isSpv && (
                <>
                  <Link
                    href="/admin/submissions"
                    className="px-3.5 py-2 rounded-lg bg-amber-50 hover:bg-amber-100/80 text-amber-800 border border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-amber-700" />
                    Monitor Data
                  </Link>
                  <Link
                    href="/admin/users"
                    className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-amber-600" />
                    Department Staff
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. SUPER ADMIN & 2. SPV DASHBOARD: DAILY SUBMITTED FORMS                  */}
        {/* ========================================================================= */}
        {(isSuperAdmin || isSpv) && (
          <div className="space-y-6">
            {/* KPI Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Today's Submissions
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-serif">
                    {todaySubmissions.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Recorded today</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
              </div>

              <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Abnormal Readings
                  </div>
                  <div className="text-2xl font-black text-rose-600 mt-1 font-serif">
                    {todayAbnormalCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Require review</div>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>

              <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    {isSuperAdmin ? 'Reporting Divisions' : 'Technicians Active'}
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-serif">
                    {isSuperAdmin ? todayActiveDeptCount : new Set(todaySubmissions.map(s => s.technician_id)).size}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {isSuperAdmin ? `of ${departments.length} total` : 'in your division'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>

              <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                    Active Forms
                  </div>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-serif">
                    {templates.length}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ready for inspection</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Navigation Tabs between Submissions and Form Quick Launch */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('SUBMISSIONS')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'SUBMISSIONS'
                      ? 'bg-amber-100/70 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-700" />
                  {isSuperAdmin ? 'Daily Submissions (All Departments)' : `Daily Submissions (${user?.department_name || 'My Department'})`}
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-200/80 text-[10px] font-mono">
                    {todaySubmissions.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('FORMS')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeTab === 'FORMS'
                      ? 'bg-amber-100/70 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <ClipboardList className="h-4 w-4 text-amber-700" />
                  Checklist Launcher
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-[10px] font-mono">
                    {templates.length}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 hidden sm:block">
                Click any submission to view full checkpoint data
              </div>
            </div>

            {/* TAB CONTENT: SUBMISSIONS STREAM */}
            {activeTab === 'SUBMISSIONS' && (
              <div className="space-y-4">
                {/* Filter Controls Bar */}
                <div className="facility-card p-4 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Scope Selector: Today vs All */}
                    <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => setSubmissionScope('TODAY')}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                          submissionScope === 'TODAY'
                            ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Today ({todaySubmissions.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionScope('ALL')}
                        className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                          submissionScope === 'ALL'
                            ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All History ({submissions.length})
                      </button>
                    </div>

                    {/* Department Dropdown Filter (Super Admin only) */}
                    {isSuperAdmin && (
                      <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:bg-white"
                      >
                        <option value="ALL">All Departments</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Status Filter */}
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-800 focus:bg-white"
                    >
                      <option value="ALL">All Status</option>
                      <option value="NORMAL">Normal Only</option>
                      <option value="ABNORMAL">Abnormal Warnings Only</option>
                    </select>

                    {(selectedDeptFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || searchTerm) && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeptFilter('ALL');
                          setSelectedStatusFilter('ALL');
                          setSearchTerm('');
                        }}
                        className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs flex items-center gap-1 cursor-pointer"
                        title="Reset Filters"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search form, technician, location..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Submissions Grid or Empty State */}
                {filteredSubmissions.length === 0 ? (
                  <div className="facility-card p-12 text-center bg-white border border-slate-200 shadow-xs rounded-xl space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 w-fit mx-auto">
                      <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 font-serif">
                      {submissionScope === 'TODAY'
                        ? isSuperAdmin
                          ? 'No daily submissions recorded today yet across departments.'
                          : `No submissions recorded today in ${user?.department_name || 'your department'}.`
                        : 'No submissions matching your filter criteria.'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      {submissionScope === 'TODAY'
                        ? 'Inspection records will stream in live as technicians execute daily rounds. You can also view historical records.'
                        : 'Try resetting the filters to view all recorded checklists.'}
                    </p>

                    {submissionScope === 'TODAY' && submissions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSubmissionScope('ALL')}
                        className="px-4 py-2 rounded-lg btn-gold font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                      >
                        <Clock className="h-3.5 w-3.5" />
                        View Recent Submissions ({submissions.length})
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubmissions.map((sub) => {
                      const isTodaySub = isDateToday(sub.submitted_at);

                      return (
                        <div
                          key={sub.id}
                          onClick={() => setInspectSubmission(sub)}
                          className="facility-card p-5 bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header: Dept & Condition */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                <Building2 className="h-3 w-3 text-amber-600" />
                                {sub.department_name || 'General Operations'}
                              </span>

                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  sub.has_abnormal_reading
                                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                                }`}
                              >
                                {sub.has_abnormal_reading ? (
                                  <>
                                    <AlertTriangle className="h-3 w-3 text-rose-600" />
                                    ABNORMAL
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    NORMAL
                                  </>
                                )}
                              </span>
                            </div>

                            {/* Form Title & Code */}
                            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors mb-1 font-serif line-clamp-1">
                              {sub.template_title}
                            </h3>
                            <div className="text-[10px] font-mono text-slate-400 mb-3">
                              {sub.template_code} • v{sub.template_version}
                            </div>

                            {/* Meta items: Location & Technician */}
                            <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5 mb-3">
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="font-semibold text-slate-800">{sub.technician_name}</span>
                                {sub.employee_code && (
                                  <span className="text-[10px] font-mono text-slate-400">({sub.employee_code})</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPinIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{sub.location_name} {sub.location_building ? `• ${sub.location_building}` : ''}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>
                                  {isTodaySub ? 'Today at ' : ''}
                                  {new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                                  {!isTodaySub && ` • ${new Date(sub.submitted_at).toLocaleDateString('id-ID')}`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-400">
                              {Object.keys(sub.submission_data || {}).length} checkpoints
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform">
                              <Eye className="h-3.5 w-3.5" />
                              View Data
                              <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: FORMS LAUNCHER */}
            {activeTab === 'FORMS' && renderFormsLauncher()}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. TECHNICIAN DASHBOARD: QUICK OPTION FOR THE FORMS                       */}
        {/* ========================================================================= */}
        {isTechnician && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-serif flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-600" />
                  Quick Inspection Forms
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Checklists designated for {user?.department_name || 'your department'}. Tap any card to begin.
                </p>
              </div>

              <div className="text-xs font-mono text-slate-400">
                {filteredTemplates.length} available
              </div>
            </div>

            {/* Render High-Speed Quick Form Cards */}
            {renderFormsLauncher()}

            {/* Technician's Personal Today Activity */}
            {submissions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-serif flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-amber-600" />
                    My Recorded Inspections Today
                  </h3>
                  <Link
                    href="/history"
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                  >
                    View Full History <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {submissions.slice(0, 6).map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => setInspectSubmission(sub)}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate font-serif">
                          {sub.template_title}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{sub.location_name}</span>
                          <span>•</span>
                          <span>{new Date(sub.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          sub.has_abnormal_reading
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {sub.has_abnormal_reading ? 'ABNORMAL' : 'NORMAL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* DETAILED SUBMISSION INSPECTION MODAL (ALL ROLES)                          */}
      {/* ========================================================================= */}
      {inspectSubmission && (
        <SubmissionDetailModal
          submission={inspectSubmission}
          onClose={() => setInspectSubmission(null)}
        />
      )}
    </div>
  );

  // Helper renderer for Form Launcher Cards
  function renderFormsLauncher() {
    return (
      <div className="space-y-4">
        {/* Search & Categories Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'btn-gold font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-2xs'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search checklist or equipment..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 shadow-2xs"
            />
          </div>
        </div>

        {/* Form Cards Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="facility-card p-12 text-center bg-white border border-slate-200 shadow-xs rounded-xl space-y-2">
            <ClipboardList className="h-10 w-10 mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800 font-serif">
              {templates.length === 0
                ? isSuperAdmin
                  ? 'No active forms registered in the system.'
                  : `No checklists designated for ${user?.department_name || 'your department'}.`
                : 'No checklists matching your search criteria.'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {templates.length === 0
                ? isSuperAdmin
                  ? 'Create forms in the Form Builder and assign them to departments.'
                  : 'Please contact a Facility Administrator to allocate inspection checklists to your department.'
                : 'Try clearing your search term or selecting another category filter.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => router.push(`/checklist/${tmpl.id}`)}
                className="facility-card p-5 cursor-pointer hover:border-amber-400 hover:shadow-lg transition-all group flex flex-col justify-between bg-white border border-slate-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 group-hover:scale-105 group-hover:border-amber-400 transition-all">
                      {getFormIcon(tmpl.code)}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono border border-slate-200">
                      {tmpl.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-800 transition-colors mb-1.5 font-serif line-clamp-1">
                    {tmpl.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {tmpl.description || 'Routine equipment inspection checklist.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {tmpl.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold group-hover:translate-x-1 transition-transform text-xs">
                    Start Inspection
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}

// Small inline MapPin helper icon
function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
