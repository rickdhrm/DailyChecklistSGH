'use client';

import React, { useState, useEffect } from 'react';
import { LIFT_GROUPS, COMPUTER_LIFT_ITEMS } from '@/lib/liftChecklistConstants';
import {
  Check,
  AlertTriangle,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface LiftChecklistTableProps {
  formData: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export default function LiftChecklistTable({
  formData,
  onChange,
  readOnly = false,
}: LiftChecklistTableProps) {
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('TABLE');

  // Detect screen size: on desktop default to TABLE, on mobile default to CARDS
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

  const handleSetAllOk = () => {
    if (readOnly || !onChange) return;
    LIFT_GROUPS.forEach((group) => {
      group.items.forEach((item) => {
        onChange(`${item.id}_status`, 'OK');
      });
    });
    COMPUTER_LIFT_ITEMS.forEach((comp) => {
      onChange(`${comp.id}_status`, 'OK');
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Controls */}
      <div className="facility-card p-4 sm:p-5 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
              SGH TOWER
            </span>
            <span className="text-xs font-semibold text-slate-500">
              DAILY LOGSHEET ENGINEERING DEPARTMENT
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 font-serif mt-1">
            CHEKLIST OPERASIONAL LIFT
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemeriksaan harian operasional Lift penumpang (P1, P2), Home Lift RPS, Escalator, Service Lift, dan Komputer Lift.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!readOnly && (
            <button
              type="button"
              onClick={handleSetAllOk}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              Set All Status OK
            </button>
          )}

          {/* View Mode Toggle (Mobile / Desktop view) */}
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

      {/* 1. TABLE 1: LIFT, CEKLIST, STATUS, TEST HOMING, BATTERY ARD */}
      {viewMode === 'TABLE' ? (
        <div className="facility-card overflow-x-auto bg-white border border-slate-200 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th rowSpan={2} className="py-2.5 px-3 text-center border-r border-slate-300 w-28 uppercase font-serif">
                  LIFT
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-left border-r border-slate-300 uppercase font-serif">
                  CEKLIST
                </th>
                <th colSpan={2} className="py-1.5 px-2 text-center border-r border-slate-300 uppercase font-serif">
                  STATUS
                </th>
                <th rowSpan={1} className="py-1.5 px-3 text-center border-r border-slate-300 uppercase font-serif">
                  TEST
                </th>
                <th rowSpan={2} className="py-2.5 px-4 text-center uppercase font-serif w-44">
                  BATTERY ARD (HARI SABTU) / VOLT
                </th>
              </tr>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-16 text-[11px] text-emerald-800 bg-emerald-50/60">
                  OK
                </th>
                <th className="py-1.5 px-2 text-center border-r border-slate-300 w-16 text-[11px] text-rose-800 bg-rose-50/60">
                  TDK
                </th>
                <th className="py-1.5 px-3 text-center border-r border-slate-300 text-[11px] w-40">
                  HOMING (SABTU)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {LIFT_GROUPS.map((group) => {
                return group.items.map((item, idx) => {
                  const statusVal = formData[`${item.id}_status`] !== undefined ? String(formData[`${item.id}_status`]).toUpperCase() : 'OK';
                  const homingVal = formData[`${item.id}_homing`] ?? formData[`${group.id}_homing`] ?? '';
                  const batteryVal = formData[`${item.id}_battery_ard`] ?? formData[`${group.id}_battery_ard`] ?? '';

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-amber-50/30 transition-colors ${
                        statusVal === 'TDK' ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Merged LIFT Header Column */}
                      {idx === 0 && (
                        <td
                          rowSpan={group.items.length}
                          className="py-3 px-3 text-center font-bold text-slate-900 border-r border-slate-200 bg-slate-50/70 align-middle font-serif text-sm"
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span>{group.label}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">
                              ({group.items.length} items)
                            </span>
                          </div>
                        </td>
                      )}

                      {/* CEKLIST Item Name */}
                      <td className="py-2.5 px-4 font-semibold text-slate-800 border-r border-slate-200">
                        {item.name}
                      </td>

                      {/* STATUS: OK Checkbox/Toggle */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        {readOnly ? (
                          statusVal === 'OK' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                              ✓
                            </span>
                          ) : null
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChange(`${item.id}_status`, 'OK')}
                            className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                              statusVal === 'OK'
                                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Mark as OK"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </td>

                      {/* STATUS: TDK Checkbox/Toggle */}
                      <td className="py-1.5 px-2 text-center border-r border-slate-200">
                        {readOnly ? (
                          statusVal === 'TDK' ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-rose-100 text-rose-800 font-bold">
                              ✓
                            </span>
                          ) : null
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChange(`${item.id}_status`, 'TDK')}
                            className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-all cursor-pointer ${
                              statusVal === 'TDK'
                                ? 'bg-rose-600 text-white shadow-xs font-bold'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                            title="Mark as TDK (Tidak Normal)"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>

                      {/* TEST HOMING (SABTU) */}
                      <td className="py-1 px-3 border-r border-slate-200">
                        {readOnly ? (
                          <span className="font-mono text-slate-700 text-center block">
                            {homingVal || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={homingVal}
                            onChange={(e) => handleChange(`${item.id}_homing`, e.target.value)}
                            placeholder="OK / Status..."
                            className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-center text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        )}
                      </td>

                      {/* BATTERY ARD (HARI SABTU) / VOLT */}
                      <td className="py-1 px-3">
                        {readOnly ? (
                          <span className="font-mono text-slate-700 text-center block font-semibold">
                            {batteryVal ? `${batteryVal} V` : '-'}
                          </span>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={batteryVal}
                              onChange={(e) => handleChange(`${item.id}_battery_ard`, e.target.value)}
                              placeholder="e.g. 52.4"
                              className="w-full px-2 py-1 pr-6 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-center text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="absolute right-2 top-1.5 text-[10px] text-slate-400 font-mono">
                              V
                            </span>
                          </div>
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
          {LIFT_GROUPS.map((group) => (
            <div key={group.id} className="facility-card p-4 bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-900 text-base font-serif flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                    {group.label}
                  </span>
                  <span>Unit Inspeksi</span>
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {group.items.length} items
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => {
                  const statusVal = formData[`${item.id}_status`] !== undefined ? String(formData[`${item.id}_status`]).toUpperCase() : 'OK';
                  const homingVal = formData[`${item.id}_homing`] ?? formData[`${group.id}_homing`] ?? '';
                  const batteryVal = formData[`${item.id}_battery_ard`] ?? formData[`${group.id}_battery_ard`] ?? '';

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all space-y-2.5 ${
                        statusVal === 'TDK'
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-xs">
                          {item.name}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleChange(`${item.id}_status`, 'OK')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              statusVal === 'OK'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            OK
                          </button>
                          <button
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleChange(`${item.id}_status`, 'TDK')}
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                              statusVal === 'TDK'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            }`}
                          >
                            TDK
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/80">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Homing (Sabtu)
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            value={homingVal}
                            onChange={(e) => handleChange(`${item.id}_homing`, e.target.value)}
                            placeholder="OK / Status"
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Battery ARD (Volt)
                          </label>
                          <input
                            type="text"
                            disabled={readOnly}
                            value={batteryVal}
                            onChange={(e) => handleChange(`${item.id}_battery_ard`, e.target.value)}
                            placeholder="e.g. 52.4"
                            className="w-full px-2 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. TABLE 2: KOMPUTER LIFT - CEK POSISI / KOMUNIKASI LIFT */}
      <div className="facility-card bg-white border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif">
              Komputer Lift — Cek Posisi / Komunikasi Lift
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {COMPUTER_LIFT_ITEMS.length} channels
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                <th className="py-2.5 px-4 text-left uppercase font-serif w-72">
                  Komunikasi / Channel
                </th>
                <th className="py-2.5 px-3 text-center uppercase font-serif w-32">
                  STATUS
                </th>
                <th className="py-2.5 px-4 text-left uppercase font-serif">
                  KETERANGAN
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {COMPUTER_LIFT_ITEMS.map((comp) => {
                const statusVal = formData[`${comp.id}_status`] !== undefined ? String(formData[`${comp.id}_status`]).toUpperCase() : 'OK';
                const ketVal = formData[`${comp.id}_keterangan`] || '';

                return (
                  <tr
                    key={comp.id}
                    className={`hover:bg-amber-50/30 transition-colors ${
                      statusVal === 'TDK' ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {comp.name}
                    </td>

                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => handleChange(`${comp.id}_status`, 'OK')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            statusVal === 'OK'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          disabled={readOnly}
                          onClick={() => handleChange(`${comp.id}_status`, 'TDK')}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                            statusVal === 'TDK'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          TDK
                        </button>
                      </div>
                    </td>

                    <td className="py-2 px-4">
                      {readOnly ? (
                        <span className="text-slate-700 font-medium">
                          {ketVal || '-'}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={ketVal}
                          onChange={(e) => handleChange(`${comp.id}_keterangan`, e.target.value)}
                          placeholder="Catatan komunikasi lift..."
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
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

      {/* 3. SIGNATURE & VERIFICATION PERSONNEL INPUTS */}
      <div className="facility-card p-5 bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 font-serif flex items-center justify-between">
          <span>Verifikasi & Tanda Tangan Logsheet</span>
          <span className="text-[11px] font-normal text-slate-500 lowercase font-sans">
            (otomatis tertera pada file pdf cetak)
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
