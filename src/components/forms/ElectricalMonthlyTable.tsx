'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Zap,
  Gauge,
  Droplets,
  Activity,
  CheckCircle2,
  Download,
  Table as TableIcon,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  Building,
  User,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  MONTH_NAMES_ID,
  MONTH_NAMES_EN,
  calculateTotalKwh,
  getDaysInMonth,
  ATS_OPTIONS,
  OLI_TRAFO_OPTIONS,
  ElectricalDayEntry
} from '@/lib/electricalConstants';

interface ElectricalMonthlyTableProps {
  formData?: Record<string, any>;
  onChange?: (field: string, value: any) => void;
  readOnly?: boolean;
  currentUser?: {
    full_name?: string;
    username?: string;
    role?: string;
  };
  submissionId?: string;
}

export default function ElectricalMonthlyTable({
  formData = {},
  onChange,
  readOnly = false,
  currentUser,
  submissionId
}: ElectricalMonthlyTableProps) {
  // Determine initial period (Month & Year)
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentDay = today.getDate(); // 1-31

  const initialPeriod = formData.period || `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriod);
  const [viewMode, setViewMode] = useState<'CARD' | 'TABLE'>(readOnly ? 'TABLE' : 'CARD');
  const [activeDay, setActiveDay] = useState<number>(currentDay);
  const [isSavingDay, setIsSavingDay] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // Extract year and month from selectedPeriod
  const [selYear, selMonth] = useMemo(() => {
    const parts = selectedPeriod.split('-');
    if (parts.length === 2) {
      return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
    }
    return [currentYear, currentMonth];
  }, [selectedPeriod, currentYear, currentMonth]);

  const daysInSelectedMonth = useMemo(() => {
    return getDaysInMonth(selYear, selMonth - 1);
  }, [selYear, selMonth]);

  // Daily records map: key is day number (1..31)
  const [daysData, setDaysData] = useState<Record<string, ElectricalDayEntry>>(() => {
    const map: Record<string, ElectricalDayEntry> = {};
    const existing = formData.days || {};
    for (let d = 1; d <= 31; d++) {
      if (existing[d] || existing[String(d)]) {
        map[String(d)] = existing[d] || existing[String(d)];
      } else {
        // Check flattened keys: day_{d}_{field}
        if (formData[`day_${d}_jam`] || formData[`day_${d}_power_faktor`]) {
          map[String(d)] = {
            tgl: d,
            jam: formData[`day_${d}_jam`] || '',
            power_faktor: formData[`day_${d}_power_faktor`] || '',
            kv: formData[`day_${d}_kv`] || '',
            kwh_wbp: formData[`day_${d}_kwh_wbp`] || '',
            kwh_lwbp_1: formData[`day_${d}_kwh_lwbp_1`] || '',
            total_kwh: formData[`day_${d}_total_kwh`] || '',
            total_kvarh: formData[`day_${d}_total_kvarh`] || '',
            kwh_genset: formData[`day_${d}_kwh_genset`] || '',
            pdam: formData[`day_${d}_pdam`] || '',
            ats_status: formData[`day_${d}_ats_status`] || '',
            step_cap_bank: formData[`day_${d}_step_cap_bank`] || '',
            cos_pi_cap_bank: formData[`day_${d}_cos_pi_cap_bank`] || '',
            step_trafo: formData[`day_${d}_step_trafo`] || '',
            level_oli_trafo: formData[`day_${d}_level_oli_trafo`] || '',
            dicek_oleh: formData[`day_${d}_dicek_oleh`] || '',
          };
        }
      }
    }
    return map;
  });

  // When formData changes from parent, sync if needed
  useEffect(() => {
    if (formData.days) {
      setDaysData((prev) => ({ ...prev, ...formData.days }));
    }
    if (formData.period && formData.period !== selectedPeriod) {
      setSelectedPeriod(formData.period);
    }
  }, [formData.days, formData.period]);

  // Current entry being edited in CARD mode
  const currentEntry = daysData[String(activeDay)] || {
    tgl: activeDay,
    jam: `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`,
    power_faktor: '',
    kv: '20',
    kwh_wbp: '',
    kwh_lwbp_1: '',
    total_kwh: '',
    total_kvarh: '',
    kwh_genset: '',
    pdam: '',
    ats_status: 'AUTO',
    step_cap_bank: '1',
    cos_pi_cap_bank: '0.98',
    step_trafo: '2',
    level_oli_trafo: 'M',
    dicek_oleh: currentUser?.full_name || currentUser?.username || 'Teknisi',
  };

  const handleFieldChange = (field: keyof ElectricalDayEntry, value: any) => {
    const updated = { ...currentEntry, [field]: value };

    // Auto-calculate Total KWH if WBP or LWBP changed
    if (field === 'kwh_wbp' || field === 'kwh_lwbp_1') {
      const wbpVal = field === 'kwh_wbp' ? value : currentEntry.kwh_wbp;
      const lwbpVal = field === 'kwh_lwbp_1' ? value : currentEntry.kwh_lwbp_1;
      updated.total_kwh = calculateTotalKwh(wbpVal, lwbpVal);
    }

    const nextDays = { ...daysData, [String(activeDay)]: updated };
    setDaysData(nextDays);

    if (onChange) {
      onChange('days', nextDays);
      onChange('period', selectedPeriod);
      onChange(`day_${activeDay}_${field}`, value);
      if (updated.total_kwh !== undefined) {
        onChange(`day_${activeDay}_total_kwh`, updated.total_kwh);
      }
    }
  };

  const handleCellChange = (dayNum: number, field: keyof ElectricalDayEntry, value: any) => {
    const prev = daysData[String(dayNum)] || { tgl: dayNum };
    const updated = { ...prev, [field]: value, tgl: dayNum };

    if (field === 'kwh_wbp' || field === 'kwh_lwbp_1') {
      const wbpVal = field === 'kwh_wbp' ? value : prev.kwh_wbp;
      const lwbpVal = field === 'kwh_lwbp_1' ? value : prev.kwh_lwbp_1;
      updated.total_kwh = calculateTotalKwh(wbpVal, lwbpVal);
    }

    if (!updated.dicek_oleh && (currentUser?.full_name || currentUser?.username)) {
      updated.dicek_oleh = currentUser?.full_name || currentUser?.username;
    }

    const nextDays = { ...daysData, [String(dayNum)]: updated };
    setDaysData(nextDays);

    if (onChange) {
      onChange('days', nextDays);
      onChange('period', selectedPeriod);
      onChange(`day_${dayNum}_${field}`, value);
      if (updated.total_kwh !== undefined) {
        onChange(`day_${dayNum}_total_kwh`, updated.total_kwh);
      }
    }
  };

  // Save current active day to backend via dedicated endpoint
  const handleSaveActiveDay = async () => {
    setIsSavingDay(true);
    setSaveSuccessMsg('');
    try {
      const res = await fetch('/api/forms/electrical-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          day: activeDay,
          entry: currentEntry,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg(`Day ${activeDay} recorded successfully!`);
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      } else {
        alert(data.error || 'Failed to save entry');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      alert('Network error while saving');
    } finally {
      setIsSavingDay(false);
    }
  };

  // Count filled days
  const filledDaysCount = useMemo(() => {
    return Object.values(daysData).filter((d) => d && (d.jam || d.kwh_wbp || d.kwh_genset || d.pdam)).length;
  }, [daysData]);

  const percentComplete = Math.round((filledDaysCount / 31) * 100);

  // PDF Export link
  const pdfDownloadUrl = useMemo(() => {
    if (submissionId) {
      return `/api/export/electrical-pdf?id=${submissionId}`;
    }
    return `/api/export/electrical-pdf?period=${selectedPeriod}`;
  }, [submissionId, selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & PERIOD SELECTOR */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-4 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                <Zap className="h-3 w-3 text-amber-700" />
                Monthly Logsheet
              </span>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                SGH-ELEC-001
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              SGH TOWER PROKLAMASI — LOG SHEET ELECTRICAL
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily inspection sheet for PLN garden electricity meter, Genset, PDAM, Capacitor Bank, and Transformer.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 text-xs font-bold shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('CARD')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'CARD'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-blue-600" />
                Daily Entry
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5 text-emerald-600" />
                Monthly 31-Day Table
              </button>
            </div>

            {/* Download PDF Button */}
            <a
              href={pdfDownloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm hover:shadow"
              title="Download 1-Page A4 Landscape PDF"
            >
              <Download className="h-3.5 w-3.5 text-amber-400" />
              Download Monthly PDF
            </a>
          </div>
        </div>

        {/* Period Selector & Progress Stats */}
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Periode :
            </span>

            {/* Month Dropdown */}
            <select
              value={selMonth}
              disabled={readOnly}
              onChange={(e) => {
                const newMonth = e.target.value.padStart(2, '0');
                const newPeriod = `${selYear}-${newMonth}`;
                setSelectedPeriod(newPeriod);
                if (onChange) onChange('period', newPeriod);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {MONTH_NAMES_ID.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name} ({MONTH_NAMES_EN[idx]})
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={selYear}
              disabled={readOnly}
              onChange={(e) => {
                const newPeriod = `${e.target.value}-${String(selMonth).padStart(2, '0')}`;
                setSelectedPeriod(newPeriod);
                if (onChange) onChange('period', newPeriod);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {[2025, 2026, 2027, 2028].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <span className="text-xs text-slate-500 font-mono hidden md:inline">
              Gedung: <strong>SGH TOWER</strong>
            </span>
          </div>

          {/* Progress Pill */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 font-mono">
              {filledDaysCount}/31 Days ({percentComplete}%)
            </span>
          </div>
        </div>
      </div>

      {/* 2. MODE A: QUICK DAILY ENTRY CARD (MOBILE & DAILY USER FRIENDLY) */}
      {viewMode === 'CARD' && !readOnly && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Day Navigation Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg shadow-sm">
                {activeDay}
              </div>
              <div>
                <h3 className="font-bold text-base text-white tracking-wide">
                  Input Data Hari Ke-{activeDay}
                </h3>
                <p className="text-xs text-slate-300">
                  {activeDay} {MONTH_NAMES_ID[selMonth - 1]} {selYear}
                  {activeDay === currentDay && selMonth === currentMonth && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                      HARI INI
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Prev / Next day buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveDay((prev) => Math.max(1, prev - 1))}
                disabled={activeDay <= 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white border border-slate-700 transition cursor-pointer"
                title="Hari Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <select
                value={activeDay}
                onChange={(e) => setActiveDay(parseInt(e.target.value, 10))}
                className="bg-slate-800 text-white text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-700 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tgl {d} {daysData[String(d)]?.jam ? '✓' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setActiveDay((prev) => Math.min(31, prev + 1))}
                disabled={activeDay >= 31}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white border border-slate-700 transition cursor-pointer"
                title="Hari Selanjutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-5 sm:p-6 space-y-6">
            {/* Row 1: Jam & Dicek Oleh */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-600" />
                  Jam Pemeriksaan
                </label>
                <input
                  type="time"
                  value={currentEntry.jam || ''}
                  onChange={(e) => handleFieldChange('jam', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  Dicek Oleh (Nama Teknisi)
                </label>
                <input
                  type="text"
                  value={currentEntry.dicek_oleh || ''}
                  onChange={(e) => handleFieldChange('dicek_oleh', e.target.value)}
                  placeholder="Nama teknisi..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 2: Meter Listrik Depan Gardu PLN (6 fields) */}
            <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                <Zap className="h-4 w-4 text-amber-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-950">
                  Meter Listrik Depan Gardu PLN
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Power Faktor (Cos φ)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 0.95"
                    value={currentEntry.power_faktor ?? ''}
                    onChange={(e) => handleFieldChange('power_faktor', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tegangan (KV)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 20"
                    value={currentEntry.kv ?? ''}
                    onChange={(e) => handleFieldChange('kv', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kwh WBP (Beban Puncak)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={currentEntry.kwh_wbp ?? ''}
                    onChange={(e) => handleFieldChange('kwh_wbp', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kwh LWBP 1 (Luar Beban Puncak)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={currentEntry.kwh_lwbp_1 ?? ''}
                    onChange={(e) => handleFieldChange('kwh_lwbp_1', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Total KWH - Auto Calculated */}
                <div>
                  <label className="block text-xs font-bold text-emerald-800 mb-1 flex items-center justify-between">
                    <span>Total KWH (WBP + LWBP)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">
                      Auto Sum
                    </span>
                  </label>
                  <input
                    type="text"
                    value={currentEntry.total_kwh ?? ''}
                    onChange={(e) => handleFieldChange('total_kwh', e.target.value)}
                    placeholder="Otomatis terhitung..."
                    className="w-full px-3 py-2 rounded-lg border border-emerald-400 bg-emerald-50 text-sm font-mono font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total KVArh
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={currentEntry.total_kvarh ?? ''}
                    onChange={(e) => handleFieldChange('total_kvarh', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Genset & PDAM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-rose-600" />
                  KWH (GENSET)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={currentEntry.kwh_genset ?? ''}
                  onChange={(e) => handleFieldChange('kwh_genset', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="border border-slate-200 bg-slate-50 p-4 rounded-xl">
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-cyan-600" />
                  PDAM (M3)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.0"
                  value={currentEntry.pdam ?? ''}
                  onChange={(e) => handleFieldChange('pdam', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Row 4: ATS, Cap Bank, and Transformer */}
            <div className="border border-slate-200 bg-slate-50 p-4 sm:p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Gauge className="h-4 w-4 text-purple-700" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Status Peralatan: ATS, Cap Bank & Trafo
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* ATS Manual / Auto Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    ATS Status
                  </label>
                  <div className="inline-flex w-full rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
                    {ATS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleFieldChange('ats_status', opt)}
                        className={`flex-1 py-1.5 text-xs font-extrabold rounded-md transition cursor-pointer ${
                          currentEntry.ats_status === opt
                            ? opt === 'AUTO'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-amber-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Cap Bank */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Step Cap.Bank
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1"
                    value={currentEntry.step_cap_bank ?? ''}
                    onChange={(e) => handleFieldChange('step_cap_bank', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono text-center focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Cos Pi Cap Bank */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cos Pi Cap.Bank
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.98"
                    value={currentEntry.cos_pi_cap_bank ?? ''}
                    onChange={(e) => handleFieldChange('cos_pi_cap_bank', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono text-center focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Step Trafo */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Step Trafo
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2"
                    value={currentEntry.step_trafo ?? ''}
                    onChange={(e) => handleFieldChange('step_trafo', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono text-center focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Level Oli Trafo H/M/L */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Level Oli Trafo
                  </label>
                  <div className="inline-flex w-full rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
                    {OLI_TRAFO_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleFieldChange('level_oli_trafo', opt)}
                        className={`flex-1 py-1.5 text-xs font-black rounded-md transition cursor-pointer ${
                          currentEntry.level_oli_trafo === opt
                            ? opt === 'H'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : opt === 'M'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-rose-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button for Current Day */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Pencatatan untuk Tgl {activeDay} {MONTH_NAMES_ID[selMonth - 1]} {selYear}
              </span>

              <div className="flex items-center gap-3">
                {saveSuccessMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    {saveSuccessMsg}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveActiveDay}
                  disabled={isSavingDay}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  {isSavingDay ? 'Menyimpan...' : `Simpan Catatan Tgl ${activeDay}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODE B: FULL MONTHLY 31-DAY SPREADSHEET TABLE */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide">
                Rekap Bulanan — Periode {MONTH_NAMES_ID[selMonth - 1]} {selYear} (Tgl 1 s/d 31)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Klik pada sel untuk langsung mengubah nilai, atau beralih ke Daily Entry untuk input cepat.
              </p>
            </div>
            {!readOnly && (
              <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                Row hari ini ditandai warna hijau
              </span>
            )}
          </div>

          <div className="overflow-x-auto max-h-[720px]">
            <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-slate-100 z-10 shadow-xs">
                {/* Header Row 1 */}
                <tr className="border-b border-slate-300 text-center font-bold text-[11px] text-slate-800">
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-12 text-center">
                    TGL
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-16 text-center">
                    Jam
                  </th>
                  <th
                    colSpan={6}
                    className="p-2 border-r border-slate-300 text-center uppercase bg-amber-50 text-amber-950 font-black tracking-wider"
                  >
                    METER LISTRIK DEPAN GARDU PLN
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-24 text-center">
                    KWH (GENSET)
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-20 text-center">
                    PDAM (M3)
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-24 text-center">
                    ATS MANUAL /AUTO
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-20 text-center">
                    STEP CAP.BANK
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-20 text-center">
                    COS PI CAP.BANK
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-20 text-center">
                    STEP TRAFO
                  </th>
                  <th rowSpan={2} className="p-2 border-r border-slate-300 w-24 text-center">
                    LEVEL OLI TRAFO H/M/L
                  </th>
                  <th rowSpan={2} className="p-2 w-32 text-center">
                    DICEK OLEH
                  </th>
                </tr>

                {/* Header Row 2 */}
                <tr className="border-b border-slate-300 text-center font-bold text-[10px] text-slate-700 bg-amber-50/80">
                  <th className="p-1.5 border-r border-slate-300 w-20">Power faktor (Cos φ)</th>
                  <th className="p-1.5 border-r border-slate-300 w-16">KV</th>
                  <th className="p-1.5 border-r border-slate-300 w-24">Kwh WBP</th>
                  <th className="p-1.5 border-r border-slate-300 w-24">KWH LWBP 1</th>
                  <th className="p-1.5 border-r border-slate-300 w-28 bg-amber-100/90 text-amber-950 font-black">
                    Total KWH (WBP+LWBP)
                  </th>
                  <th className="p-1.5 border-r border-slate-300 w-24">Total KVArh</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {Array.from({ length: 31 }, (_, idx) => {
                  const dayNum = idx + 1;
                  const rowData = daysData[String(dayNum)] || { tgl: dayNum };
                  const isTodayRow = dayNum === currentDay && selMonth === currentMonth && selYear === currentYear;
                  const isDayPast = dayNum > daysInSelectedMonth;

                  return (
                    <tr
                      key={dayNum}
                      className={`transition-colors ${
                        isDayPast
                          ? 'bg-slate-100/40 opacity-40'
                          : isTodayRow
                          ? 'bg-emerald-50/70 hover:bg-emerald-50 font-medium'
                          : idx % 2 === 0
                          ? 'bg-white hover:bg-slate-50'
                          : 'bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. TGL */}
                      <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-900 font-mono">
                        <div className="flex items-center justify-center gap-1">
                          {dayNum}
                          {isTodayRow && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                          )}
                        </div>
                      </td>

                      {/* 2. Jam */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.jam || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.jam || ''}
                            placeholder="--:--"
                            onChange={(e) => handleCellChange(dayNum, 'jam', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 3. Power faktor */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.power_faktor || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.power_faktor ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'power_faktor', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 4. KV */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.kv || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.kv ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'kv', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 5. Kwh WBP */}
                      <td className="p-1 border-r border-slate-200 text-right font-mono">
                        {readOnly ? (
                          <span>{rowData.kwh_wbp || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.kwh_wbp ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'kwh_wbp', e.target.value)}
                            className="w-full text-right py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs font-bold"
                          />
                        )}
                      </td>

                      {/* 6. KWH LWBP 1 */}
                      <td className="p-1 border-r border-slate-200 text-right font-mono">
                        {readOnly ? (
                          <span>{rowData.kwh_lwbp_1 || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.kwh_lwbp_1 ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'kwh_lwbp_1', e.target.value)}
                            className="w-full text-right py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs font-bold"
                          />
                        )}
                      </td>

                      {/* 7. Total KWH (WBP+LWBP) */}
                      <td className="p-1.5 border-r border-slate-200 text-right font-mono font-black text-emerald-900 bg-amber-50/50">
                        {rowData.total_kwh || calculateTotalKwh(rowData.kwh_wbp, rowData.kwh_lwbp_1) || '-'}
                      </td>

                      {/* 8. Total KVArh */}
                      <td className="p-1 border-r border-slate-200 text-right font-mono">
                        {readOnly ? (
                          <span>{rowData.total_kvarh || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.total_kvarh ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'total_kvarh', e.target.value)}
                            className="w-full text-right py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 9. KWH (GENSET) */}
                      <td className="p-1 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        {readOnly ? (
                          <span>{rowData.kwh_genset || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.kwh_genset ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'kwh_genset', e.target.value)}
                            className="w-full text-right py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs font-bold"
                          />
                        )}
                      </td>

                      {/* 10. PDAM (M3) */}
                      <td className="p-1 border-r border-slate-200 text-right font-mono font-bold text-slate-800">
                        {readOnly ? (
                          <span>{rowData.pdam || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.pdam ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'pdam', e.target.value)}
                            className="w-full text-right py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs font-bold"
                          />
                        )}
                      </td>

                      {/* 11. ATS MANUAL / AUTO */}
                      <td className="p-1 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              rowData.ats_status === 'AUTO'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rowData.ats_status === 'MANUAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {rowData.ats_status || '-'}
                          </span>
                        ) : (
                          <select
                            value={rowData.ats_status || ''}
                            onChange={(e) => handleCellChange(dayNum, 'ats_status', e.target.value)}
                            className="w-full text-center py-1 rounded bg-transparent text-[11px] font-bold cursor-pointer"
                          >
                            <option value="">-</option>
                            <option value="AUTO">AUTO</option>
                            <option value="MANUAL">MANUAL</option>
                          </select>
                        )}
                      </td>

                      {/* 12. STEP CAP.BANK */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.step_cap_bank || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.step_cap_bank ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'step_cap_bank', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 13. COS PI CAP.BANK */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.cos_pi_cap_bank || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.cos_pi_cap_bank ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'cos_pi_cap_bank', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 14. STEP TRAFO */}
                      <td className="p-1 border-r border-slate-200 text-center font-mono">
                        {readOnly ? (
                          <span>{rowData.step_trafo || '-'}</span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.step_trafo ?? ''}
                            onChange={(e) => handleCellChange(dayNum, 'step_trafo', e.target.value)}
                            className="w-full text-center py-1 px-0.5 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* 15. LEVEL OLI TRAFO H/M/L */}
                      <td className="p-1 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                              rowData.level_oli_trafo === 'H'
                                ? 'bg-blue-100 text-blue-800'
                                : rowData.level_oli_trafo === 'M'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rowData.level_oli_trafo === 'L'
                                ? 'bg-rose-100 text-rose-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {rowData.level_oli_trafo || '-'}
                          </span>
                        ) : (
                          <select
                            value={rowData.level_oli_trafo || ''}
                            onChange={(e) => handleCellChange(dayNum, 'level_oli_trafo', e.target.value)}
                            className="w-full text-center py-1 rounded bg-transparent text-[11px] font-bold cursor-pointer"
                          >
                            <option value="">-</option>
                            <option value="H">H</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                          </select>
                        )}
                      </td>

                      {/* 16. DICEK OLEH */}
                      <td className="p-1 text-center font-sans text-xs">
                        {readOnly ? (
                          <span className="truncate block max-w-[120px] mx-auto text-slate-700">
                            {rowData.dicek_oleh || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={rowData.dicek_oleh || ''}
                            placeholder="Nama..."
                            onChange={(e) => handleCellChange(dayNum, 'dicek_oleh', e.target.value)}
                            className="w-full text-center py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 bg-transparent text-xs"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. SIGNATURE SECTION - 3 COLUMNS */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm p-5 sm:p-6">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-4 flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Kolom Tanda Tangan & Verifikasi Bulanan
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: Teknisi */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col justify-between h-40">
            <div>
              <div className="font-extrabold text-xs text-slate-900">Dibuat Oleh :</div>
              <div className="text-[11px] font-semibold text-slate-500">(Teknisi)</div>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <div className="text-xs font-bold text-slate-900 truncate">
                Nama: {formData.teknisi_nama || currentUser?.full_name || currentUser?.username || 'Admin Engineering'}
              </div>
              <div className="text-[11px] text-slate-500">
                Periode: {MONTH_NAMES_ID[selMonth - 1]} {selYear}
              </div>
            </div>
          </div>

          {/* Box 2: Supervisor */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col justify-between h-40">
            <div>
              <div className="font-extrabold text-xs text-slate-900">Diperiksa Oleh :</div>
              <div className="text-[11px] font-semibold text-slate-500">(Supervisor)</div>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <div className="text-xs font-bold text-slate-900 truncate">
                Nama: {formData.spv_nama || 'Supervisor Engineering'}
              </div>
              <div className="text-[11px] text-slate-500">
                Periode: {MONTH_NAMES_ID[selMonth - 1]} {selYear}
              </div>
            </div>
          </div>

          {/* Box 3: Building Manager */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 flex flex-col justify-between h-40">
            <div>
              <div className="font-extrabold text-xs text-slate-900">Disetujui Oleh :</div>
              <div className="text-[11px] font-semibold text-slate-500">(Building Manager)</div>
            </div>
            <div className="border-t border-slate-300 pt-2">
              <div className="text-xs font-bold text-slate-900 truncate">
                Nama: {formData.bm_nama || 'Building Manager'}
              </div>
              <div className="text-[11px] text-slate-500">
                Periode: {MONTH_NAMES_ID[selMonth - 1]} {selYear}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
