'use client';

import React, { useState, useEffect } from 'react';
import { MCFA_SECTIONS, MCFA_STATUS_OPTIONS } from '@/lib/mcfaConstants';
import {
  Flame,
  AlertTriangle,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Building2,
  Radio,
  FileSpreadsheet,
  RotateCcw
} from 'lucide-react';

interface McfaChecklistTableProps {
  formData: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export default function McfaChecklistTable({
  formData,
  onChange,
  readOnly = false,
}: McfaChecklistTableProps) {
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('CARDS');
    }
  }, []);

  const handleChange = (fieldId: string, val: any) => {
    if (!readOnly && onChange) {
      onChange(fieldId, val);
    }
  };

  const handleSetNormal = () => {
    if (readOnly || !onChange) return;

    // Set Fire Row 1 to NIL / Normal
    onChange('mcfa_fire_1_lantai', '-');
    onChange('mcfa_fire_1_zone', '-');
    onChange('mcfa_fire_1_penyebab', 'NIL / Tidak ada riwayat alarm fire');
    onChange('mcfa_fire_1_penanganan', 'Standby & Monitoring panel MCFA');
    onChange('mcfa_fire_1_status', 'NORMAL');

    // Set Fault Row 1 to NIL / Normal
    onChange('mcfa_fault_1_lantai', '-');
    onChange('mcfa_fault_1_zone', '-');
    onChange('mcfa_fault_1_penyebab', 'NIL / Tidak ada riwayat fault/trouble');
    onChange('mcfa_fault_1_penanganan', 'Standby & Monitoring panel MCFA');
    onChange('mcfa_fault_1_status', 'NORMAL');

    // Clear remaining rows
    for (let r = 2; r <= 6; r++) {
      ['fire', 'fault'].forEach((sec) => {
        onChange(`mcfa_${sec}_${r}_lantai`, '');
        onChange(`mcfa_${sec}_${r}_zone`, '');
        onChange(`mcfa_${sec}_${r}_penyebab`, '');
        onChange(`mcfa_${sec}_${r}_penanganan`, '');
        onChange(`mcfa_${sec}_${r}_status`, '');
      });
    }
  };

  const renderStatusBadge = (status: string) => {
    const s = String(status).toUpperCase().trim();
    if (s === 'NORMAL' || s === 'STANDBY' || s === 'RESOLVED') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          {s}
        </span>
      );
    }
    if (s === 'TROUBLE' || s === 'FAULT' || s === 'ALARM') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-300">
          {s}
        </span>
      );
    }
    if (s === 'MONITORING') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {s || '-'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="facility-card p-4 sm:p-5 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 font-mono">
              FIRE & LIFE SAFETY
            </span>
            <span className="text-xs font-semibold text-slate-500">
              DAILY LOGSHEET ENGINEERING DEPARTMENT
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif mt-1">
            CHEKLIST OPERASIONAL MCFA & ANNUNCIATOR
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logbook pencatatan harian history alarm fire, fault/gangguan pada Master Control Fire Alarm (MCFA) dan panel annunciator.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && (
            <button
              type="button"
              onClick={handleSetNormal}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Set All Normal (No Alarms)
            </button>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CARDS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Card View</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. TABLE VIEW */}
      {viewMode === 'TABLE' ? (
        <div className="facility-card overflow-x-auto bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-slate-300 w-44 uppercase font-serif">
                  MCFA
                </th>
                <th className="py-1.5 px-3 text-center border-r border-slate-300 w-32 uppercase font-serif">
                  LANTAI
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-left border-r border-slate-300 uppercase font-serif">
                  PENYEBAB TROUBLE/FIRE
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-left border-r border-slate-300 uppercase font-serif w-80">
                  PENANGANAN
                </th>
                <th rowSpan={2} className="py-2.5 px-3 text-center uppercase font-serif w-32">
                  STATUS
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-1.5 px-3 text-center border-r border-slate-300 text-[11px] uppercase font-serif">
                  ZONE
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {MCFA_SECTIONS.map((section) => {
                const isFireSec = section.id === 'fire';

                return Array.from({ length: section.rowCount }).map((_, i) => {
                  const rowNum = i + 1;
                  const keyPrefix = `mcfa_${section.id}_${rowNum}`;

                  const lantaiVal = formData[`${keyPrefix}_lantai`] || '';
                  const zoneVal = formData[`${keyPrefix}_zone`] || '';
                  const penyebabVal = formData[`${keyPrefix}_penyebab`] || '';
                  const penangananVal = formData[`${keyPrefix}_penanganan`] || '';
                  const statusVal = formData[`${keyPrefix}_status`] || '';

                  return (
                    <tr
                      key={keyPrefix}
                      className={`hover:bg-amber-50/20 transition-colors ${
                        statusVal === 'TROUBLE' || statusVal === 'FAULT' || statusVal === 'ALARM'
                          ? 'bg-rose-50/25'
                          : ''
                      }`}
                    >
                      {/* Merged MCFA Section Column */}
                      {i === 0 && (
                        <td
                          rowSpan={section.rowCount}
                          className={`py-3 px-3 text-center font-bold border-r border-slate-300 align-middle font-serif ${
                            isFireSec
                              ? 'bg-rose-50/60 text-rose-950'
                              : 'bg-amber-50/60 text-amber-950'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            {isFireSec ? (
                              <Flame className="h-5 w-5 text-rose-600" />
                            ) : (
                              <AlertTriangle className="h-5 w-5 text-amber-600" />
                            )}
                            <span className="text-sm font-bold tracking-tight">
                              {section.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              (Baris 1 - {section.rowCount})
                            </span>
                          </div>
                        </td>
                      )}

                      {/* LANTAI & ZONE Column */}
                      <td className="py-1.5 px-2.5 border-r border-slate-200">
                        {readOnly ? (
                          <div className="text-center font-mono space-y-0.5">
                            <span className="block font-bold text-slate-900">{lantaiVal || '-'}</span>
                            <span className="block text-[10px] text-slate-500">{zoneVal || '-'}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={lantaiVal}
                              onChange={(e) => handleChange(`${keyPrefix}_lantai`, e.target.value)}
                              placeholder="Lantai (e.g. Lt. 5)"
                              className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-center text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                            <input
                              type="text"
                              value={zoneVal}
                              onChange={(e) => handleChange(`${keyPrefix}_zone`, e.target.value)}
                              placeholder="Zone (e.g. Zone 12)"
                              className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-center text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </td>

                      {/* PENYEBAB TROUBLE/FIRE Column */}
                      <td className="py-1.5 px-3 border-r border-slate-200">
                        {readOnly ? (
                          <span className="text-slate-800 font-medium">
                            {penyebabVal || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={penyebabVal}
                            onChange={(e) => handleChange(`${keyPrefix}_penyebab`, e.target.value)}
                            placeholder={i === 0 ? "Penyebab alarm / gangguan (e.g. NIL / Tidak ada alarm)" : "Penyebab..."}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        )}
                      </td>

                      {/* PENANGANAN Column */}
                      <td className="py-1.5 px-3 border-r border-slate-200">
                        {readOnly ? (
                          <span className="text-slate-800 font-medium">
                            {penangananVal || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={penangananVal}
                            onChange={(e) => handleChange(`${keyPrefix}_penanganan`, e.target.value)}
                            placeholder={i === 0 ? "Tindakan penanganan (e.g. Standby & Monitoring)" : "Penanganan..."}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        )}
                      </td>

                      {/* STATUS Column */}
                      <td className="py-1.5 px-2.5 text-center">
                        {readOnly ? (
                          renderStatusBadge(statusVal)
                        ) : (
                          <select
                            value={statusVal}
                            onChange={(e) => handleChange(`${keyPrefix}_status`, e.target.value)}
                            className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="">- Status -</option>
                            {MCFA_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* MOBILE CARD VIEW */
        <div className="space-y-4">
          {MCFA_SECTIONS.map((section) => (
            <div key={section.id} className="facility-card p-4 bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-base font-serif flex items-center gap-2">
                  {section.id === 'fire' ? (
                    <Flame className="h-4 w-4 text-rose-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span>{section.title}</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {section.rowCount} entries
                </span>
              </div>

              <div className="space-y-3">
                {Array.from({ length: section.rowCount }).map((_, i) => {
                  const rowNum = i + 1;
                  const keyPrefix = `mcfa_${section.id}_${rowNum}`;

                  const lantaiVal = formData[`${keyPrefix}_lantai`] || '';
                  const zoneVal = formData[`${keyPrefix}_zone`] || '';
                  const penyebabVal = formData[`${keyPrefix}_penyebab`] || '';
                  const penangananVal = formData[`${keyPrefix}_penanganan`] || '';
                  const statusVal = formData[`${keyPrefix}_status`] || '';

                  return (
                    <div
                      key={keyPrefix}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-slate-700 text-xs">
                          Entry #{rowNum}
                        </span>
                        {readOnly ? (
                          renderStatusBadge(statusVal)
                        ) : (
                          <select
                            value={statusVal}
                            onChange={(e) => handleChange(`${keyPrefix}_status`, e.target.value)}
                            className="px-2 py-1 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-800"
                          >
                            <option value="">- Status -</option>
                            {MCFA_STATUS_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Lantai
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            value={lantaiVal}
                            onChange={(e) => handleChange(`${keyPrefix}_lantai`, e.target.value)}
                            placeholder="Lt. 5"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Zone
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            value={zoneVal}
                            onChange={(e) => handleChange(`${keyPrefix}_zone`, e.target.value)}
                            placeholder="Zone 12"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Penyebab Trouble / Fire
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          value={penyebabVal}
                          onChange={(e) => handleChange(`${keyPrefix}_penyebab`, e.target.value)}
                          placeholder="Deskripsi penyebab..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Penanganan
                        </label>
                        <input
                          type="text"
                          disabled={readOnly}
                          value={penangananVal}
                          onChange={(e) => handleChange(`${keyPrefix}_penanganan`, e.target.value)}
                          placeholder="Tindakan penanganan..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. SIGNATURE & VERIFICATION PERSONNEL INPUTS */}
      <div className="facility-card p-5 bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 font-serif flex items-center justify-between">
          <span>Verifikasi & Tanda Tangan Logsheet</span>
          <span className="text-[11px] font-normal text-slate-500 lowercase font-sans">
            (tertera otomatis pada lembar pdf cetak)
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Teknisi */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
              <span>Dibuat Oleh</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                Teknisi
              </span>
            </div>
            <input
              type="text"
              disabled={readOnly}
              value={formData.teknisi_nama || ''}
              onChange={(e) => handleChange('teknisi_nama', e.target.value)}
              placeholder="Nama Teknisi Pelaksana"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Supervisor */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
              <span>Diperiksa Oleh</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px]">
                Supervisor
              </span>
            </div>
            <input
              type="text"
              disabled={readOnly}
              value={formData.spv_nama || ''}
              onChange={(e) => handleChange('spv_nama', e.target.value)}
              placeholder="Nama Supervisor Engineering"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Building Manager */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase">
              <span>Disetujui Oleh</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px]">
                Building Manager
              </span>
            </div>
            <input
              type="text"
              disabled={readOnly}
              value={formData.bm_nama || ''}
              onChange={(e) => handleChange('bm_nama', e.target.value)}
              placeholder="Nama Building Manager"
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
