'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PUMP_LOGSHEET_ITEMS, PumpLogsheetItem } from '@/lib/pumpLogsheetConstants';
import { 
  Check, 
  AlertTriangle, 
  Layers, 
  Table as TableIcon, 
  LayoutGrid, 
  Zap, 
  Flame, 
  Wind, 
  Droplet, 
  Gauge, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  Sliders,
  Info
} from 'lucide-react';

interface PumpLogsheetTableProps {
  formData: Record<string, any>;
  onChange?: (fieldId: string, value: any) => void;
  readOnly?: boolean;
}

export const PUMP_CATEGORIES = [
  { id: 'ALL', label: 'Semua (27)', count: 27 },
  { id: 'FIRE', label: 'Fire Pumps (3)', itemIds: ['jockey_pump', 'electric_fire_pump', 'diesel_fire_pump'] },
  { id: 'ACCU_EXHAUST', label: 'Accu & Fan (4)', itemIds: ['battery_accu', 'amper_accu', 'charger_accu', 'room_exhaust_fan'] },
  { id: 'TRANSFER_WATER', label: 'Transfer Air (3)', itemIds: ['transfer_pump_1', 'transfer_pump_2', 'tekanan_air_bersih'] },
  { id: 'RECYCLE_STP', label: 'Recycle & STP (6)', itemIds: ['recycle_pump_1', 'pompa_stp_1', 'pompa_stp_2', 'boiler_stp', 'exhaust_stp_1', 'exhaust_stp_2'] },
  { id: 'SWP', label: 'Sumppit SWP (5)', itemIds: ['swp_1', 'swp_2', 'swp_3', 'swp_4', 'swp_5'] },
  { id: 'BOOSTER_TANK', label: 'Booster & Tank (6)', itemIds: ['booster_pump_1', 'booster_pump_2', 'kapasitas_ground_tank', 'kapasitas_roof_tank', 'posisi_wlc_ground', 'tekanan_pemadam_roof'] },
];

export default function PumpLogsheetTable({
  formData,
  onChange,
  readOnly = false,
}: PumpLogsheetTableProps) {
  // Mobile vs Table grid mode
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Detect initial screen size: on desktop default to TABLE, on mobile default to CARDS
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      setViewMode('TABLE');
    }
  }, []);

  const handleChange = (fieldId: string, val: any) => {
    if (!readOnly && onChange) {
      onChange(fieldId, val);
    }
  };

  // Helper to check if an item has data logged
  const isItemLogged = (item: PumpLogsheetItem) => {
    if (item.type === 'standard') {
      return (
        formData[`${item.id}_arus_r`] !== undefined ||
        formData[`${item.id}_volt_r`] !== undefined ||
        formData[`${item.id}_pres_discharge`] !== undefined ||
        formData[`${item.id}_body_temp`] !== undefined
      );
    }
    if (item.type === 'battery_volt') return formData['battery_accu_volt'] !== undefined && formData['battery_accu_volt'] !== '';
    if (item.type === 'battery_amp') return formData['amper_accu'] !== undefined && formData['amper_accu'] !== '';
    if (item.type === 'electrical') return formData[`${item.id}_arus_r`] !== undefined || formData[`${item.id}_volt_r`] !== undefined;
    if (item.type === 'clean_water_pressure') return formData['tekanan_air_bersih'] !== undefined && formData['tekanan_air_bersih'] !== '';
    if (item.type === 'percentage') return formData[item.id] !== undefined && formData[item.id] !== '';
    if (item.type === 'wlc_position') return formData['posisi_wlc_ground'] !== undefined && formData['posisi_wlc_ground'] !== '';
    if (item.type === 'roof_fire_pressure') return formData['tekanan_pemadam_roof'] !== undefined && formData['tekanan_pemadam_roof'] !== '';
    return false;
  };

  // Filtered items based on active category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return PUMP_LOGSHEET_ITEMS;
    const cat = PUMP_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!cat || !cat.itemIds) return PUMP_LOGSHEET_ITEMS;
    return PUMP_LOGSHEET_ITEMS.filter((item) => cat.itemIds.includes(item.id));
  }, [selectedCategory]);

  const loggedCount = useMemo(() => {
    return PUMP_LOGSHEET_ITEMS.filter(isItemLogged).length;
  }, [formData]);

  // Quick Action: Pre-fill all currently visible standard pumps to AUTO & OPEN
  const handleQuickSetAutoAndOpen = () => {
    if (readOnly || !onChange) return;
    filteredItems.forEach((item) => {
      if (item.type === 'standard' || item.type === 'electrical') {
        onChange(`${item.id}_switch`, 'AUTO');
        if (item.type === 'standard') {
          onChange(`${item.id}_gate_valve`, 'OPEN');
        }
      } else if (item.type === 'wlc_position') {
        onChange('posisi_wlc_ground', 'AUTO');
      }
    });
  };

  // -------------------------------------------------------------
  // RENDERERS: INPUTS & BUTTONS
  // -------------------------------------------------------------
  const renderNumberInput = (fieldId: string, placeholder = '-', widthClass = 'w-14 sm:w-16', inputMode: 'decimal' | 'numeric' = 'decimal') => {
    const val = formData[fieldId] ?? '';

    if (readOnly) {
      return (
        <span className="font-mono font-bold text-slate-900 text-xs text-center block">
          {val !== '' ? val : '-'}
        </span>
      );
    }

    return (
      <input
        type="number"
        step="any"
        inputMode={inputMode}
        value={val}
        onChange={(e) => handleChange(fieldId, e.target.value)}
        placeholder={placeholder}
        className={`${widthClass} px-2 py-1.5 text-center font-mono text-sm sm:text-xs rounded-md bg-white border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/60 focus:bg-amber-50/20`}
      />
    );
  };

  const renderSwitchButton = (itemId: string, opt: 'MANUAL' | 'AUTO' | 'OFF', isMobileCard = false) => {
    const fieldId = `${itemId}_switch`;
    const currentVal = formData[fieldId] || 'AUTO';
    const isSelected = currentVal === opt;

    let activeColor = 'bg-amber-100 text-amber-900 border-amber-400 font-bold';
    if (opt === 'AUTO') {
      activeColor = 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs';
    } else if (opt === 'OFF') {
      activeColor = 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs';
    } else if (opt === 'MANUAL') {
      activeColor = 'bg-amber-500 text-white border-amber-500 font-bold shadow-xs';
    }

    if (readOnly) {
      return (
        <span
          className={`py-1 px-2 rounded-md text-[11px] font-mono border block text-center ${
            isSelected
              ? activeColor
              : 'bg-transparent text-slate-300 border-transparent opacity-30'
          }`}
        >
          {opt}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleChange(fieldId, opt)}
        className={`w-full ${isMobileCard ? 'py-2 px-1 text-xs' : 'py-1 px-1 text-[10px]'} font-bold rounded-lg border transition-all cursor-pointer text-center ${
          isSelected
            ? activeColor
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
        }`}
      >
        {opt}
      </button>
    );
  };

  const renderGateValveButton = (itemId: string, opt: 'OPEN' | 'CLOSE', isMobileCard = false) => {
    const fieldId = `${itemId}_gate_valve`;
    const currentVal = formData[fieldId] || 'OPEN';
    const isSelected = currentVal === opt;

    let activeColor = 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs';
    if (opt === 'CLOSE') {
      activeColor = 'bg-slate-700 text-white border-slate-700 font-bold shadow-xs';
    }

    if (readOnly) {
      return (
        <span
          className={`py-1 px-2 rounded-md text-[11px] font-mono border block text-center ${
            isSelected
              ? activeColor
              : 'bg-transparent text-slate-300 border-transparent opacity-30'
          }`}
        >
          {opt}
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleChange(fieldId, opt)}
        className={`w-full ${isMobileCard ? 'py-2 px-1 text-xs' : 'py-1 px-1 text-[10px]'} font-bold rounded-lg border transition-all cursor-pointer text-center ${
          isSelected
            ? activeColor
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
        }`}
      >
        {opt}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* ============================================================== */}
      {/* 1. VIEW MODE SWITCHER & LOGSHEET PROGRESS HEADER              */}
      {/* ============================================================== */}
      <div className="facility-card p-3.5 bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm font-serif">
                Matrix Logsheet (27 Unit Pompa)
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {loggedCount}/27 Terisi
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {viewMode === 'CARDS'
                ? 'Mode Kartu Mobile — sentuh untuk input parameter setiap unit pompa'
                : 'Mode Grid Spreadsheet — geser horizontal untuk melihat 14 parameter'}
            </p>
          </div>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'CARDS'
                  ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-amber-600" />
              <span>Mobile Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'TABLE'
                  ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5 text-amber-600" />
              <span>Full Grid Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. MOBILE CARDS VIEW (OPTIMIZED FOR FIELD SMARTPHONES)          */}
      {/* ============================================================== */}
      {viewMode === 'CARDS' && (
        <div className="space-y-4">
          {/* Category Filter Chips & Fast Action */}
          <div className="facility-card p-3 bg-white border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Filter Kelompok Pompa:
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleQuickSetAutoAndOpen}
                  className="text-[11px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-300 flex items-center gap-1 transition-all cursor-pointer"
                  title="Otomatis mengisi posisi Switch = AUTO & Valve = OPEN untuk pompa yang tampil"
                >
                  <Sparkles className="h-3 w-3 text-amber-600" />
                  Quick Set AUTO & OPEN
                </button>
              )}
            </div>

            {/* Horizontal Scrollable Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {PUMP_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredItems.map((item, idx) => {
              const originalIndex = PUMP_LOGSHEET_ITEMS.findIndex((p) => p.id === item.id);
              const isLogged = isItemLogged(item);

              return (
                <div
                  key={item.id}
                  className={`facility-card p-4 bg-white border transition-all ${
                    isLogged
                      ? 'border-emerald-300 bg-emerald-50/10 shadow-xs'
                      : 'border-slate-200 shadow-2xs hover:border-amber-300'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-amber-100/80 text-amber-900 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        {originalIndex + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm font-serif">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                          {item.type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                        isLogged
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isLogged ? (
                        <>
                          <Check className="h-3 w-3" /> Terisi
                        </>
                      ) : (
                        'Belum'
                      )}
                    </span>
                  </div>

                  {/* 1. STANDARD PUMP CARD */}
                  {item.type === 'standard' && (
                    <div className="space-y-3.5">
                      {/* Toggles: Switch Position & Gate Valve */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        {/* Switch */}
                        <div>
                          <span className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Switch Position
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            {renderSwitchButton(item.id, 'MANUAL', true)}
                            {renderSwitchButton(item.id, 'AUTO', true)}
                            {renderSwitchButton(item.id, 'OFF', true)}
                          </div>
                        </div>

                        {/* Gate Valve */}
                        <div>
                          <span className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                            Gate Valve
                          </span>
                          <div className="grid grid-cols-2 gap-1">
                            {renderGateValveButton(item.id, 'OPEN', true)}
                            {renderGateValveButton(item.id, 'CLOSE', true)}
                          </div>
                        </div>
                      </div>

                      {/* Arus Standby (A) R, S, T */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-amber-600" />
                            Arus Standby (Ampere)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Phase R - S - T</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">R</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_r`, '-', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">S</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_s`, '-', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">T</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_t`, '-', 'w-full')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Volt Standby (V) R, S, T */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-blue-950 flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-blue-600" />
                            Volt Standby (Volt)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Phase R - S - T</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">R</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_r`, '380', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">S</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_s`, '380', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200/80 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">T</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_t`, '380', 'w-full')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Pressure & Body Temp Row */}
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        {/* Suction */}
                        <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-2">
                          <span className="block text-[10px] font-bold text-purple-900 uppercase">
                            Pres. Suction
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1">{renderNumberInput(`${item.id}_pres_suction`, '-', 'w-full')}</div>
                            <span className="text-[10px] font-bold text-purple-800 font-mono">Bar</span>
                          </div>
                        </div>

                        {/* Discharge */}
                        <div className="bg-purple-50/50 border border-purple-200 rounded-lg p-2">
                          <span className="block text-[10px] font-bold text-purple-900 uppercase">
                            Pres. Discharge
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1">{renderNumberInput(`${item.id}_pres_discharge`, '-', 'w-full')}</div>
                            <span className="text-[10px] font-bold text-purple-800 font-mono">Bar</span>
                          </div>
                        </div>

                        {/* Body Temp */}
                        <div className="bg-rose-50/50 border border-rose-200 rounded-lg p-2">
                          <span className="block text-[10px] font-bold text-rose-900 uppercase">
                            Body Temp
                          </span>
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex-1">{renderNumberInput(`${item.id}_body_temp`, '-', 'w-full')}</div>
                            <span className="text-[10px] font-bold text-rose-800 font-mono">°C</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. BATTERY ACCU (VOLT) CARD */}
                  {item.type === 'battery_volt' && (
                    <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-blue-600" />
                          Tegangan Battery Accu (Volt)
                        </span>
                        <span className="text-[10px] text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded font-mono">
                          Normal: 24 - 28 V
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderNumberInput('battery_accu_volt', '24.0', 'w-full')}
                        </div>
                        <span className="text-sm font-bold text-blue-900 font-mono">Volt DC</span>
                      </div>
                    </div>
                  )}

                  {/* 3. AMPER ACCU (A) CARD */}
                  {item.type === 'battery_amp' && (
                    <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-amber-600" />
                          Kapasitas Arus Accu (Ampere)
                        </span>
                        <span className="text-[10px] text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded font-mono">
                          Current Load
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderNumberInput('amper_accu', '4.0', 'w-full')}
                        </div>
                        <span className="text-sm font-bold text-amber-900 font-mono">Ampere</span>
                      </div>
                    </div>
                  )}

                  {/* 4. ELECTRICAL / FAN CARD */}
                  {item.type === 'electrical' && (
                    <div className="space-y-3">
                      {/* Switch */}
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                          Switch Position
                        </span>
                        <div className="grid grid-cols-3 gap-1">
                          {renderSwitchButton(item.id, 'MANUAL', true)}
                          {renderSwitchButton(item.id, 'AUTO', true)}
                          {renderSwitchButton(item.id, 'OFF', true)}
                        </div>
                      </div>

                      {/* Arus Standby (A) */}
                      <div>
                        <span className="block text-[10px] font-bold text-amber-950 mb-1">
                          Arus Standby (A) - Phase R / S / T
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">R</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_r`, '-', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">S</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_s`, '-', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50/40 border border-amber-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-amber-800 w-3 text-center">T</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_arus_t`, '-', 'w-full')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Volt Standby (V) */}
                      <div>
                        <span className="block text-[10px] font-bold text-blue-950 mb-1">
                          Volt Standby (V) - Phase R / S / T
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">R</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_r`, '380', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">S</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_s`, '380', 'w-full')}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-blue-50/40 border border-blue-200 rounded-lg p-1.5">
                            <span className="text-[10px] font-bold font-mono text-blue-800 w-3 text-center">T</span>
                            <div className="flex-1">{renderNumberInput(`${item.id}_volt_t`, '380', 'w-full')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 5. TEKANAN AIR BERSIH RUANG POMPA */}
                  {item.type === 'clean_water_pressure' && (
                    <div className="p-3 rounded-xl bg-purple-50/40 border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Droplet className="h-4 w-4 text-purple-600" />
                          Tekanan Header Air Bersih
                        </span>
                        <span className="text-[10px] text-purple-700 bg-purple-100/60 px-2 py-0.5 rounded font-mono">
                          Main Supply
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderNumberInput('tekanan_air_bersih', '4.5', 'w-full')}
                        </div>
                        <span className="text-sm font-bold text-purple-900 font-mono">Bar</span>
                      </div>
                    </div>
                  )}

                  {/* 6. PERCENTAGE TANKS (GROUND TANK & ROOF TANK) */}
                  {item.type === 'percentage' && (
                    <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                          <Droplet className="h-4 w-4 text-emerald-600" />
                          Level Kapasitas Air (%)
                        </span>
                        <span className="text-[10px] text-emerald-700 font-mono">
                          0% - 100%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderNumberInput(item.id, '85', 'w-full')}
                        </div>
                        <span className="text-sm font-bold text-emerald-900 font-mono">%</span>
                      </div>
                      {/* Visual Level Indicator */}
                      {formData[item.id] !== undefined && formData[item.id] !== '' && (
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, Number(formData[item.id]) || 0))}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 7. WLC POSITION */}
                  {item.type === 'wlc_position' && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="block text-[11px] font-bold text-slate-700 uppercase">
                        Posisi Switch WLC Ground Tank
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {renderSwitchButton('posisi_wlc_ground', 'MANUAL', true)}
                        {renderSwitchButton('posisi_wlc_ground', 'AUTO', true)}
                        {renderSwitchButton('posisi_wlc_ground', 'OFF', true)}
                      </div>
                    </div>
                  )}

                  {/* 8. TEKANAN PEMADAM ROOF */}
                  {item.type === 'roof_fire_pressure' && (
                    <div className="p-3 rounded-xl bg-rose-50/40 border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-rose-600" />
                          Tekanan Air Pemadam Jalur Roof
                        </span>
                        <span className="text-[10px] text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded font-mono">
                          Fire Hydrant Roof
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          {renderNumberInput('tekanan_pemadam_roof', '7.5', 'w-full')}
                        </div>
                        <span className="text-sm font-bold text-rose-900 font-mono">Bar</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. FULL GRID SPREADSHEET TABLE VIEW (WITH STICKY LEFT COLUMN)  */}
      {/* ============================================================== */}
      {viewMode === 'TABLE' && (
        <div className="space-y-2">
          {/* Mobile Swipe Hint Banner */}
          <div className="sm:hidden p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>↔</span> Geser ke kanan untuk melihat Volt, Switch, Presure & Valve
            </span>
            <button
              type="button"
              onClick={() => setViewMode('CARDS')}
              className="font-bold underline text-amber-800"
            >
              Ganti ke Kartu
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-800 uppercase text-[10px] font-bold border-b border-slate-300 select-none">
                {/* Main Category Header Row */}
                <tr className="border-b border-slate-300 divide-x divide-slate-300 text-center">
                  <th rowSpan={2} className="py-2.5 px-3 min-w-[210px] text-left bg-slate-100 sticky left-0 z-20 font-serif border-r border-slate-300 shadow-xs">
                    DESCRIPTION
                  </th>
                  <th colSpan={3} className="py-1.5 px-2 bg-amber-50 text-amber-950 font-bold">
                    ARUS STANDBY (A)
                  </th>
                  <th colSpan={3} className="py-1.5 px-2 bg-blue-50 text-blue-950 font-bold">
                    VOLT-STANDBY (V)
                  </th>
                  <th colSpan={3} className="py-1.5 px-2 bg-emerald-50 text-emerald-950 font-bold">
                    SWITCH POSITION
                  </th>
                  <th colSpan={2} className="py-1.5 px-2 bg-purple-50 text-purple-950 font-bold">
                    PRESURE (Bar)
                  </th>
                  <th rowSpan={2} className="py-2.5 px-2 w-20 bg-rose-50 text-rose-950 font-bold">
                    BODY TEMP (°C)
                  </th>
                  <th colSpan={2} className="py-1.5 px-2 bg-cyan-50 text-cyan-950 font-bold">
                    GATE VALVE
                  </th>
                </tr>

                {/* Sub-Header Row */}
                <tr className="divide-x divide-slate-300 text-center font-bold">
                  {/* Arus Standby: R, S, T */}
                  <th className="py-1 px-1.5 w-14 bg-amber-50/60 text-amber-900">R</th>
                  <th className="py-1 px-1.5 w-14 bg-amber-50/60 text-amber-900">S</th>
                  <th className="py-1 px-1.5 w-14 bg-amber-50/60 text-amber-900">T</th>

                  {/* Volt-Standby: R, S, T */}
                  <th className="py-1 px-1.5 w-14 bg-blue-50/60 text-blue-900">R</th>
                  <th className="py-1 px-1.5 w-14 bg-blue-50/60 text-blue-900">S</th>
                  <th className="py-1 px-1.5 w-14 bg-blue-50/60 text-blue-900">T</th>

                  {/* Switch Position: MANUAL, AUTO, OFF */}
                  <th className="py-1 px-1 w-16 bg-emerald-50/60 text-emerald-900 text-[9px]">MANUAL</th>
                  <th className="py-1 px-1 w-16 bg-emerald-50/60 text-emerald-900 text-[9px]">AUTO</th>
                  <th className="py-1 px-1 w-14 bg-emerald-50/60 text-emerald-900 text-[9px]">OFF</th>

                  {/* Presure: SUCTION, DISCHARGE */}
                  <th className="py-1 px-1.5 w-16 bg-purple-50/60 text-purple-900 text-[9px]">SUCTION</th>
                  <th className="py-1 px-1.5 w-16 bg-purple-50/60 text-purple-900 text-[9px]">DISCHARGE</th>

                  {/* Gate Valve: OPEN, CLOSE */}
                  <th className="py-1 px-1 w-14 bg-cyan-50/60 text-cyan-900 text-[9px]">OPEN</th>
                  <th className="py-1 px-1 w-14 bg-cyan-50/60 text-cyan-900 text-[9px]">CLOSE</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {PUMP_LOGSHEET_ITEMS.map((item, idx) => {
                  const isAlt = idx % 2 === 1;

                  return (
                    <tr
                      key={item.id}
                      className={`divide-x divide-slate-200 hover:bg-amber-50/20 transition-colors ${
                        isAlt ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Description Column (Sticky Left) */}
                      <td className="py-2 px-3 font-semibold text-slate-900 text-xs sticky left-0 z-10 bg-inherit border-r border-slate-200 whitespace-nowrap shadow-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-4 text-right">
                            {idx + 1}.
                          </span>
                          <span className="font-serif">{item.name}</span>
                        </div>
                      </td>

                      {/* 1. STANDARD PUMP ROW */}
                      {item.type === 'standard' && (
                        <>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_r`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_s`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_t`)}</td>

                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_r`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_s`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_t`)}</td>

                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'MANUAL')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'AUTO')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'OFF')}</td>

                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_pres_suction`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_pres_discharge`)}</td>

                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_body_temp`)}</td>

                          <td className="py-1 px-0.5 text-center">{renderGateValveButton(item.id, 'OPEN')}</td>
                          <td className="py-1 px-0.5 text-center">{renderGateValveButton(item.id, 'CLOSE')}</td>
                        </>
                      )}

                      {/* 2. BATTERY ACCU (VOLT) ROW */}
                      {item.type === 'battery_volt' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="py-1 px-2 text-center bg-blue-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {renderNumberInput('battery_accu_volt', '-', 'w-24')}
                              <span className="text-[10px] font-bold text-slate-700 font-mono">Volt</span>
                            </div>
                          </td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 3. AMPER ACCU (A) ROW */}
                      {item.type === 'battery_amp' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="py-1 px-2 text-center bg-blue-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {renderNumberInput('amper_accu', '-', 'w-24')}
                              <span className="text-[10px] font-bold text-slate-700 font-mono">A</span>
                            </div>
                          </td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 4. ELECTRICAL / FAN ROW */}
                      {item.type === 'electrical' && (
                        <>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_r`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_s`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_arus_t`)}</td>

                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_r`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_s`)}</td>
                          <td className="py-1 px-1 text-center">{renderNumberInput(`${item.id}_volt_t`)}</td>

                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'MANUAL')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'AUTO')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton(item.id, 'OFF')}</td>

                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 5. TEKANAN AIR BERSIH */}
                      {item.type === 'clean_water_pressure' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="py-1 px-2 text-center bg-purple-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {renderNumberInput('tekanan_air_bersih', '-', 'w-24')}
                              <span className="text-[10px] font-bold text-slate-700 font-mono">Bar</span>
                            </div>
                          </td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 6. PERCENTAGE ROWS */}
                      {item.type === 'percentage' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="py-1 px-2 text-center bg-emerald-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {renderNumberInput(item.id, '0-100', 'w-24')}
                              <span className="text-[10px] font-bold text-slate-700 font-mono">%</span>
                            </div>
                          </td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 7. WLC POSITION */}
                      {item.type === 'wlc_position' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton('posisi_wlc_ground', 'MANUAL')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton('posisi_wlc_ground', 'AUTO')}</td>
                          <td className="py-1 px-0.5 text-center">{renderSwitchButton('posisi_wlc_ground', 'OFF')}</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}

                      {/* 8. TEKANAN PEMADAM ROOF */}
                      {item.type === 'roof_fire_pressure' && (
                        <>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={3} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="py-1 px-2 text-center bg-purple-50/20">
                            <div className="flex items-center justify-center gap-1.5">
                              {renderNumberInput('tekanan_pemadam_roof', '-', 'w-24')}
                              <span className="text-[10px] font-bold text-slate-700 font-mono">Bar</span>
                            </div>
                          </td>
                          <td className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                          <td colSpan={2} className="bg-slate-100/70 text-center text-slate-300 font-mono text-[10px]">-</td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
