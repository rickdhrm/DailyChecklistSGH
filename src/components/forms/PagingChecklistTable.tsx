'use client';

import React, { useState, useEffect } from 'react';
import {
  PAGING_EQUIPMENT_ITEMS,
  PAGING_STATUS_ON_OFF_OPTIONS,
  PAGING_TEST_SOUND_OPTIONS,
  PagingEquipmentItem,
} from '@/lib/pagingConstants';
import {
  Radio,
  Volume2,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  ShieldCheck,
} from 'lucide-react';

interface PagingChecklistTableProps {
  formData: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export default function PagingChecklistTable({
  formData,
  onChange,
  readOnly = false,
}: PagingChecklistTableProps) {
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

  const handleSetAllNormal = () => {
    if (readOnly || !onChange) return;

    PAGING_EQUIPMENT_ITEMS.forEach((item) => {
      onChange(`${item.id}_status_on_off`, item.defaultStatus);
      onChange(`${item.id}_test_sound_1`, item.defaultTestSound1);
      onChange(`${item.id}_posisi`, item.defaultPosisi);
      onChange(`${item.id}_test_sound_2`, item.defaultTestSound2);
    });

    if (!formData.spv_nama) {
      onChange('spv_nama', 'Supervisor Engineering');
    }
    if (!formData.bm_nama) {
      onChange('bm_nama', 'Building Manager');
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION HEADER CARD */}
      <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 shrink-0">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                  SAFETY AUDIO & EVACUATION
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  DAILY LOGSHEET ENGINEERING DEPARTMENT
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-slate-900">
                OPERASIONAL PANEL PAGING EVAKUASI
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemeriksaan rutin status power ON/OFF, uji suara (test sound), posisi selector, dan kesiapan speaker evakuasi gedung.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {!readOnly && (
              <button
                type="button"
                onClick={handleSetAllNormal}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Populate all items with default ON & OK"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Set All Normal (ON / OK)
              </button>
            )}

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                Table View
              </button>
              <button
                type="button"
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                  viewMode === 'CARDS'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Card View
              </button>
            </div>
          </div>
        </div>

        {/* Info stats pill */}
        <div className="pt-3 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2 font-mono">
          <span>Total Peralatan: <strong>11 Unit / Pengujian</strong></span>
          <span className="text-slate-500">Gedung: SGH TOWER • Lokasi: Panel Paging Rack</span>
        </div>
      </div>

      {/* TABLE VIEW (DESKTOP / WIDE) */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 text-center font-serif font-bold text-[11px] tracking-wide">
                  <th
                    rowSpan={2}
                    className="p-3 border-r border-slate-300 text-center uppercase min-w-[200px]"
                  >
                    NAMA PERALATAN
                  </th>
                  <th
                    className="p-2 border-r border-slate-300 text-center uppercase min-w-[120px]"
                  >
                    STATUS
                  </th>
                  <th
                    rowSpan={2}
                    className="p-3 border-r border-slate-300 text-center uppercase min-w-[120px]"
                  >
                    TEST SOUND
                  </th>
                  <th
                    rowSpan={2}
                    className="p-3 border-r border-slate-300 text-center uppercase min-w-[140px]"
                  >
                    POSISI
                  </th>
                  <th
                    rowSpan={2}
                    className="p-3 text-center uppercase min-w-[120px]"
                  >
                    TEST SOUND
                  </th>
                </tr>
                <tr className="bg-slate-100/90 text-slate-800 border-b border-slate-300 text-center font-serif font-bold text-[10px] tracking-wide">
                  <th className="p-1.5 border-r border-slate-300 text-center uppercase text-slate-700">
                    ON/OFF
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PAGING_EQUIPMENT_ITEMS.map((item, idx) => {
                  const statusVal = formData[`${item.id}_status_on_off`] || item.defaultStatus;
                  const sound1Val = formData[`${item.id}_test_sound_1`] || item.defaultTestSound1;
                  const posisiVal = formData[`${item.id}_posisi`] !== undefined ? formData[`${item.id}_posisi`] : item.defaultPosisi;
                  const sound2Val = formData[`${item.id}_test_sound_2`] || item.defaultTestSound2;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* 1. NAMA PERALATAN */}
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span>{item.name}</span>
                        </div>
                      </td>

                      {/* 2. STATUS ON/OFF */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-bold font-mono border ${
                              statusVal === 'ON'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {statusVal}
                          </span>
                        ) : (
                          <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                            {PAGING_STATUS_ON_OFF_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleChange(`${item.id}_status_on_off`, opt)}
                                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer font-mono ${
                                  statusVal === opt
                                    ? opt === 'ON'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : 'bg-rose-600 text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* 3. TEST SOUND (COL 1) */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                              sound1Val === 'OK'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sound1Val === 'NOT OK'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {sound1Val === 'OK' && <Check className="h-3 w-3" />}
                            {sound1Val}
                          </span>
                        ) : (
                          <select
                            value={sound1Val}
                            onChange={(e) => handleChange(`${item.id}_test_sound_1`, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${
                              sound1Val === 'OK'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : sound1Val === 'NOT OK'
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            {PAGING_TEST_SOUND_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      {/* 4. POSISI */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span className="font-semibold text-slate-800 font-mono text-xs">
                            {posisiVal || '-'}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={posisiVal}
                            onChange={(e) => handleChange(`${item.id}_posisi`, e.target.value)}
                            placeholder="NORMAL / STANDBY / READY"
                            className="w-full px-2.5 py-1.5 text-center text-xs font-medium rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        )}
                      </td>

                      {/* 5. TEST SOUND (COL 2) */}
                      <td className="p-2 text-center">
                        {readOnly ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                              sound2Val === 'OK'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : sound2Val === 'NOT OK'
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {sound2Val === 'OK' && <Check className="h-3 w-3" />}
                            {sound2Val}
                          </span>
                        ) : (
                          <select
                            value={sound2Val}
                            onChange={(e) => handleChange(`${item.id}_test_sound_2`, e.target.value)}
                            className={`px-2.5 py-1.5 rounded-lg border font-bold text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer ${
                              sound2Val === 'OK'
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                : sound2Val === 'NOT OK'
                                ? 'bg-rose-50 border-rose-300 text-rose-800'
                                : 'bg-white border-slate-300 text-slate-700'
                            }`}
                          >
                            {PAGING_TEST_SOUND_OPTIONS.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
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

      {/* CARD VIEW (MOBILE / TOUCH FRIENDLY) */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PAGING_EQUIPMENT_ITEMS.map((item, idx) => {
            const statusVal = formData[`${item.id}_status_on_off`] || item.defaultStatus;
            const sound1Val = formData[`${item.id}_test_sound_1`] || item.defaultTestSound1;
            const posisiVal = formData[`${item.id}_posisi`] !== undefined ? formData[`${item.id}_posisi`] : item.defaultPosisi;
            const sound2Val = formData[`${item.id}_test_sound_2`] || item.defaultTestSound2;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-300 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm font-sans">
                      {item.name}
                    </h3>
                  </div>

                  {readOnly ? (
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                        statusVal === 'ON'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {statusVal}
                    </span>
                  ) : (
                    <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                      {PAGING_STATUS_ON_OFF_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange(`${item.id}_status_on_off`, opt)}
                          className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer font-mono ${
                            statusVal === opt
                              ? opt === 'ON'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                              : 'text-slate-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Test Sound 1
                    </span>
                    {readOnly ? (
                      <span className="font-bold font-mono text-slate-800">{sound1Val}</span>
                    ) : (
                      <select
                        value={sound1Val}
                        onChange={(e) => handleChange(`${item.id}_test_sound_1`, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white text-slate-800"
                      >
                        {PAGING_TEST_SOUND_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Test Sound 2
                    </span>
                    {readOnly ? (
                      <span className="font-bold font-mono text-slate-800">{sound2Val}</span>
                    ) : (
                      <select
                        value={sound2Val}
                        onChange={(e) => handleChange(`${item.id}_test_sound_2`, e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-slate-300 font-bold text-xs bg-white text-slate-800"
                      >
                        {PAGING_TEST_SOUND_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                    Posisi Selector
                  </span>
                  {readOnly ? (
                    <span className="font-semibold text-slate-800 font-mono text-xs">{posisiVal || '-'}</span>
                  ) : (
                    <input
                      type="text"
                      value={posisiVal}
                      onChange={(e) => handleChange(`${item.id}_posisi`, e.target.value)}
                      placeholder="NORMAL / STANDBY / READY"
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3-PARTY VERIFICATION & SIGN-OFF SECTION */}
      <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-serif">
            VERIFIKASI & TANDA TANGAN LOGSHEET
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            (tertera otomatis pada lembar pdf cetak)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Teknisi */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Dibuat Oleh</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-mono text-[9px]">Teknisi</span>
            </div>
            {readOnly ? (
              <span className="font-bold text-slate-900 text-sm block">
                {formData.teknisi_nama || 'Teknisi Engineering'}
              </span>
            ) : (
              <input
                type="text"
                value={formData.teknisi_nama || ''}
                onChange={(e) => handleChange('teknisi_nama', e.target.value)}
                placeholder="Nama Teknisi Pelaksana"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Teknisi 1 / Pelaksana</span>
          </div>

          {/* Supervisor */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Diperiksa Oleh</span>
              <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-mono text-[9px]">Supervisor</span>
            </div>
            {readOnly ? (
              <span className="font-bold text-slate-900 text-sm block">
                {formData.spv_nama || 'Supervisor Engineering'}
              </span>
            ) : (
              <input
                type="text"
                value={formData.spv_nama || ''}
                onChange={(e) => handleChange('spv_nama', e.target.value)}
                placeholder="Nama Supervisor Engineering"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Supervisor Engineering</span>
          </div>

          {/* Building Manager */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Disetujui Oleh</span>
              <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono text-[9px]">Building Manager</span>
            </div>
            {readOnly ? (
              <span className="font-bold text-slate-900 text-sm block">
                {formData.bm_nama || 'Building Manager'}
              </span>
            ) : (
              <input
                type="text"
                value={formData.bm_nama || ''}
                onChange={(e) => handleChange('bm_nama', e.target.value)}
                placeholder="Nama Building Manager"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            )}
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Building Manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}
