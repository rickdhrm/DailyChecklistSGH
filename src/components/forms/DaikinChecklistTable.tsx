'use client';

import React, { useState, useEffect } from 'react';
import { DAIKIN_FLOOR_ITEMS, DaikinFloorItem } from '@/lib/daikinConstants';
import {
  Wind,
  Table as TableIcon,
  LayoutGrid,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Thermometer,
} from 'lucide-react';

interface DaikinChecklistTableProps {
  formData: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export default function DaikinChecklistTable({
  formData,
  onChange,
  readOnly = false,
}: DaikinChecklistTableProps) {
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

    DAIKIN_FLOOR_ITEMS.forEach((floor) => {
      onChange(`${floor.id}_status`, floor.defaultStatus);
      onChange(`${floor.id}_temperature`, floor.defaultTemperature);
      onChange(`${floor.id}_keterangan`, floor.defaultKeterangan);
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
            <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 shrink-0">
              <Wind className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                  HVAC • VRV SYSTEM
                </span>
                <span className="text-xs font-semibold text-slate-500 font-mono">
                  DAILY LOGSHEET ENGINEERING DEPARTMENT
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-slate-900">
                PANEL ITM DAIKIN
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Cek operasional harian status ON/OFF unit VRV per lantai dan pemantauan suhu ruang kantor.
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
                title="Populate all floors with default ON and 24°C"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                Set All Normal (ON / 24°C)
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
          <span>Total Lantai: <strong>11 Area (Lt. 10 s/d Groundfloor)</strong></span>
          <span className="text-slate-500">Gedung: SGH TOWER • Sistem: Intelligent Touch Manager</span>
        </div>
      </div>

      {/* TABLE VIEW (DESKTOP / WIDE) */}
      {viewMode === 'TABLE' && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
              <thead>
                {/* Header Row 1 */}
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-300 text-center font-bold text-xs tracking-wider">
                  <th className="p-3 border-r border-slate-300 text-center uppercase min-w-[200px]">
                    PANEL ITM DAIKIN
                  </th>
                  <th
                    colSpan={2}
                    className="p-2 border-r border-slate-300 text-center uppercase min-w-[160px]"
                  >
                    STATUS ON/OFF
                  </th>
                  <th
                    colSpan={2}
                    className="p-2 text-center uppercase min-w-[280px]"
                  >
                    KETERANGAN
                  </th>
                </tr>
                {/* Header Row 2 */}
                <tr className="bg-slate-50 text-slate-900 border-b border-slate-300 text-center font-bold text-[11px] tracking-wide">
                  <th className="p-2.5 border-r border-slate-300 text-center uppercase">
                    CEK TEMPERATURE RUANG KANTOR
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center uppercase w-20 text-emerald-800 font-extrabold">
                    ON
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center uppercase w-20 text-rose-800 font-extrabold">
                    OFF
                  </th>
                  <th className="p-2 border-r border-slate-300 text-center uppercase w-28">
                    SUHU (°C)
                  </th>
                  <th className="p-2 text-center uppercase">
                    KETERANGAN / CATATAN
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {DAIKIN_FLOOR_ITEMS.map((floor, idx) => {
                  const statusVal = formData[`${floor.id}_status`] || floor.defaultStatus;
                  const tempVal = formData[`${floor.id}_temperature`] !== undefined ? formData[`${floor.id}_temperature`] : floor.defaultTemperature;
                  const ketVal = formData[`${floor.id}_keterangan`] !== undefined ? formData[`${floor.id}_keterangan`] : floor.defaultKeterangan;

                  const isOn = statusVal === 'ON';
                  const isOff = statusVal === 'OFF';

                  return (
                    <tr
                      key={floor.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      {/* 1. NAMA PERALATAN / LANTAI */}
                      <td className="p-3 border-r border-slate-200 font-bold text-slate-900 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="tracking-wide">{floor.name}</span>
                        </div>
                      </td>

                      {/* 2. ON Checkbox / Toggle */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          isOn ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-sm">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChange(`${floor.id}_status`, 'ON')}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center mx-auto cursor-pointer border ${
                              isOn
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 border-slate-300'
                            }`}
                            title={`Set ${floor.name} to ON`}
                          >
                            {isOn ? <Check className="h-4 w-4" /> : 'ON'}
                          </button>
                        )}
                      </td>

                      {/* 3. OFF Checkbox / Toggle */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          isOff ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-rose-50 text-rose-800 border border-rose-300 font-bold text-sm">
                              ✓
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChange(`${floor.id}_status`, 'OFF')}
                            className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center mx-auto cursor-pointer border ${
                              isOff
                                ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                                : 'bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-700 border-slate-300'
                            }`}
                            title={`Set ${floor.name} to OFF`}
                          >
                            {isOff ? <Check className="h-4 w-4" /> : 'OFF'}
                          </button>
                        )}
                      </td>

                      {/* 4. SUHU (°C) */}
                      <td className="p-2 border-r border-slate-200 text-center">
                        {readOnly ? (
                          <span className="font-bold font-mono text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 inline-block text-xs">
                            {tempVal ? `${tempVal} °C` : '-'}
                          </span>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              step="any"
                              value={tempVal}
                              onChange={(e) => handleChange(`${floor.id}_temperature`, e.target.value)}
                              placeholder="24"
                              className="w-16 px-2 py-1.5 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <span className="text-xs font-bold text-slate-600 font-mono">°C</span>
                          </div>
                        )}
                      </td>

                      {/* 5. KETERANGAN / CATATAN */}
                      <td className="p-2">
                        {readOnly ? (
                          <span className="text-slate-700 text-xs">
                            {ketVal || <span className="text-slate-400 italic">-</span>}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={ketVal}
                            onChange={(e) => handleChange(`${floor.id}_keterangan`, e.target.value)}
                            placeholder="Catatan / status ruangan (e.g. Normal, Set point 24°C)"
                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
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

      {/* CARD VIEW (MOBILE / TOUCH FRIENDLY) */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {DAIKIN_FLOOR_ITEMS.map((floor, idx) => {
            const statusVal = formData[`${floor.id}_status`] || floor.defaultStatus;
            const tempVal = formData[`${floor.id}_temperature`] !== undefined ? formData[`${floor.id}_temperature`] : floor.defaultTemperature;
            const ketVal = formData[`${floor.id}_keterangan`] !== undefined ? formData[`${floor.id}_keterangan`] : floor.defaultKeterangan;

            const isOn = statusVal === 'ON';

            return (
              <div
                key={floor.id}
                className="bg-white rounded-xl border border-slate-300 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-mono font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm font-sans">
                      {floor.name}
                    </h3>
                  </div>

                  {readOnly ? (
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold font-mono border ${
                        isOn
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {statusVal}
                    </span>
                  ) : (
                    <div className="inline-flex rounded-lg border border-slate-300 bg-slate-100 p-0.5">
                      <button
                        type="button"
                        onClick={() => handleChange(`${floor.id}_status`, 'ON')}
                        className={`px-3 py-1 text-xs font-bold rounded cursor-pointer font-mono ${
                          isOn ? 'bg-emerald-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChange(`${floor.id}_status`, 'OFF')}
                        className={`px-3 py-1 text-xs font-bold rounded cursor-pointer font-mono ${
                          !isOn ? 'bg-rose-600 text-white' : 'text-slate-600'
                        }`}
                      >
                        OFF
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Suhu Ruangan (°C)
                    </span>
                    {readOnly ? (
                      <span className="font-bold font-mono text-slate-900">
                        {tempVal ? `${tempVal} °C` : '-'}
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 w-full">
                        <input
                          type="number"
                          step="any"
                          value={tempVal}
                          onChange={(e) => handleChange(`${floor.id}_temperature`, e.target.value)}
                          placeholder="24"
                          className="w-20 px-2 py-1.5 text-center font-mono font-bold text-xs rounded-lg border border-slate-300 bg-white"
                        />
                        <span className="font-mono text-xs text-slate-500 font-bold">°C</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                      Keterangan / Catatan
                    </span>
                    {readOnly ? (
                      <span className="text-slate-700 text-xs">{ketVal || '-'}</span>
                    ) : (
                      <input
                        type="text"
                        value={ketVal}
                        onChange={(e) => handleChange(`${floor.id}_keterangan`, e.target.value)}
                        placeholder="Normal / Sejuk"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                      />
                    )}
                  </div>
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
            <span className="text-[10px] text-slate-400 block mt-1 font-mono">Teknisi 2 / Pelaksana</span>
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
