'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { HousekeepingLog, User } from '@/types';
import { 
  Archive, 
  Database, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  FileSpreadsheet, 
  Loader2 
} from 'lucide-react';

export default function HousekeepingAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<HousekeepingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Default target: previous month
  const now = new Date();
  const defaultMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const defaultYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);

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
        setCurrentUser(meData.user);

        const logsRes = await fetch('/api/housekeeping');
        if (logsRes.ok) {
          const logData = await logsRes.json();
          setLogs(logData);
        }
      } catch (err) {
        console.error('Error initializing housekeeping:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleRunHousekeeping = async () => {
    if (!confirm(`Are you sure you want to run the End-of-Month Housekeeping Routine for ${monthNames[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    setExecuting(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await fetch('/api/housekeeping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Housekeeping execution failed');

      setFeedback(data.message || `Archival complete: ${data.total_archived} records safely archived.`);

      // Refresh logs
      const refRes = await fetch('/api/housekeeping');
      if (refRes.ok) setLogs(await refRes.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setExecuting(false);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={currentUser} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
            <Archive className="h-6 w-6 text-amber-600" />
            End-of-Month Data Housekeeping Routine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Automated and manual month-end data archival for high-volume checklist entries to keep active queries lean.
          </p>
        </div>

        {feedback && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Housekeeping Action Panel */}
        <div className="facility-card p-6 mb-8 border border-amber-300 bg-gradient-to-r from-white via-amber-50/30 to-slate-50 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 font-serif">
                <Database className="h-5 w-5 text-amber-600" />
                Trigger Archival Routine
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl">
                Free up the primary active submission partition in NeonDB by bundling completed inspection forms into the cold storage archive and marking active records as archived.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Target Month
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50"
                >
                  {monthNames.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-600 mb-1">
                  Target Year
                </label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="w-24 px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 text-xs font-mono focus:ring-1 focus:ring-amber-500/50"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunHousekeeping}
                  disabled={executing || currentUser?.role !== 'ADMIN'}
                  className="mt-4 px-4 py-2 rounded-lg btn-gold font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {executing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Running Archival...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-slate-950" />
                      Execute Housekeeping
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Archival History Log */}
        <div className="facility-card overflow-hidden bg-white border border-slate-200 shadow-xs">
          <div className="p-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-serif">Monthly Housekeeping Archive Registry</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              <span>Loading housekeeping records...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No historical housekeeping executions recorded yet. Run a routine above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Records Archived</th>
                    <th className="py-3 px-4">Export Bundle</th>
                    <th className="py-3 px-4">Executed By</th>
                    <th className="py-3 px-4">Execution Timestamp</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {monthNames[log.period_month - 1]} {log.period_year}
                      </td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                        {log.total_records} records
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {log.export_format}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {(log as any).executed_by_name || 'System'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(log.executed_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
