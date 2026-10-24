'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { FormSubmission, Location, FormTemplate, User } from '@/types';
import SubmissionDetailModal from '@/components/submissions/SubmissionDetailModal';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  RotateCcw, 
  Search, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  X, 
  Loader2,
  FileText
} from 'lucide-react';

export default function SubmissionsAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Submission Modal
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [exporting, setExporting] = useState<'EXCEL' | 'PDF' | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        if (meData.user.role !== 'ADMIN' && meData.user.role !== 'SPV') {
          router.push('/');
          return;
        }
        setUser(meData.user);

        const [locsRes, tmplsRes] = await Promise.all([
          fetch('/api/locations'),
          fetch('/api/forms'),
        ]);

        if (locsRes.ok) setLocations(await locsRes.json());
        if (tmplsRes.ok) setTemplates(await tmplsRes.json());

        await fetchFilteredSubmissions();
      } catch (err) {
        console.error('Error initializing admin submissions:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const fetchFilteredSubmissions = async (loc?: string, tmpl?: string, from?: string, to?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (loc || selectedLocation) params.append('location_id', loc || selectedLocation);
      if (tmpl || selectedTemplate) params.append('template_id', tmpl || selectedTemplate);
      if (from || dateFrom) {
        params.append('date_from', from || dateFrom);
        params.append('from', from || dateFrom);
      }
      if (to || dateTo) {
        params.append('date_to', to || dateTo);
        params.append('to', to || dateTo);
      }

      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredSubmissions();
  };

  const handleResetFilter = () => {
    setSelectedLocation('');
    setSelectedTemplate('');
    setDateFrom('');
    setDateTo('');
    fetchFilteredSubmissions('', '', '', '');
  };

  const handleExport = async (type: 'EXCEL' | 'PDF') => {
    setExporting(type);
    try {
      const params = new URLSearchParams();
      if (selectedLocation) params.append('location_id', selectedLocation);
      if (selectedTemplate) params.append('template_id', selectedTemplate);
      if (dateFrom) {
        params.append('date_from', dateFrom);
        params.append('from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
        params.append('to', dateTo);
      }

      const endpoint = type === 'EXCEL' ? '/api/export/excel' : '/api/export/pdf';
      const res = await fetch(`${endpoint}?${params.toString()}`);

      if (!res.ok) throw new Error(`Export ${type} failed`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SGH_Compliance_Report_${Date.now()}.${type === 'EXCEL' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Export error:', err);
      alert(`Error generating export. Please try again.`);
    } finally {
      setExporting(null);
    }
  };

  const filtered = submissions.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.template_title?.toLowerCase().includes(q) ||
      s.technician_name?.toLowerCase().includes(q) ||
      s.location_name?.toLowerCase().includes(q) ||
      s.employee_code?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header & Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
              <FileSpreadsheet className="h-6 w-6 text-amber-600" />
              Facility Inspection Data Hub
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Admin & SPV monitoring console. Filter submitted logs by location, timestamp, and export compliance reports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('EXCEL')}
              disabled={exporting !== null}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {exporting === 'EXCEL' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5 text-emerald-600" />
              )}
              Export to Excel (.xlsx)
            </button>

            <button
              onClick={() => handleExport('PDF')}
              disabled={exporting !== null}
              className="px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              {exporting === 'PDF' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileText className="h-3.5 w-3.5 text-rose-600" />
              )}
              Download PDF Report
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="facility-card p-4 sm:p-5 mb-6 bg-white border border-slate-200 shadow-xs">
          <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Location Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Filter by Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Checklist Form Filter */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Checklist Type
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              >
                <option value="">All Checklists</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Date / Time (From)
              </label>
              <input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Date / Time (To)
              </label>
              <input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              />
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-lg btn-gold font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" />
                Apply Filter
              </button>
              <button
                type="button"
                onClick={handleResetFilter}
                title="Reset Filters"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Submissions Data Table */}
        <div className="facility-card overflow-hidden bg-white border border-slate-200 shadow-xs">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> recorded inspection audits
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search technician, checklist..."
                className="w-full pl-8 pr-3 py-1.5 rounded-md bg-slate-50 border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span>Fetching submissions from NeonDB...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No matching checklist records found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Checklist & Code</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4">Technician</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div>{sub.template_title}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {sub.template_code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <div>{sub.location_name}</div>
                        <span className="text-[10px] text-slate-400">{sub.location_building}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div>{sub.technician_name}</div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {sub.employee_code || '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sub.has_abnormal_reading
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {sub.has_abnormal_reading ? 'ABNORMAL' : 'NORMAL'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {new Date(sub.submitted_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium border border-slate-200">
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSubmission(sub)}
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                          title="View Readings"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Reading Inspection Modal */}
        {selectedSubmission && (
          <SubmissionDetailModal
            submission={selectedSubmission}
            onClose={() => setSelectedSubmission(null)}
          />
        )}
      </main>
    </div>
  );
}
