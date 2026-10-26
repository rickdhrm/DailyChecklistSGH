'use client';

import React, { useState } from 'react';
import { FormSubmission } from '@/types';
import PumpLogsheetTable from '@/components/forms/PumpLogsheetTable';
import LiftChecklistTable from '@/components/forms/LiftChecklistTable';
import McfaChecklistTable from '@/components/forms/McfaChecklistTable';
import PagingChecklistTable from '@/components/forms/PagingChecklistTable';
import { 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  FileText, 
  Printer, 
  Code2, 
  Check, 
  ShieldAlert,
  Flame,
  Layers,
  Trash2
} from 'lucide-react';

interface SubmissionDetailModalProps {
  submission: FormSubmission | null;
  onClose: () => void;
  onDelete?: (submission: FormSubmission) => void;
}

export default function SubmissionDetailModal({ submission, onClose, onDelete }: SubmissionDetailModalProps) {
  const [showRawJson, setShowRawJson] = useState(false);

  if (!submission) return null;

  const isGasForm =
    submission.template_code === 'FR-LO-005' ||
    submission.template_code === 'CHK-GAS' ||
    submission.template_title?.toUpperCase().includes('GAS') ||
    Boolean(submission.submission_data?.status_inspeksi) ||
    Boolean(submission.submission_data?.temuan);

  const isPumpLogsheet =
    submission.template_code === 'SGH-LOG-POMPA' ||
    submission.template_title?.toUpperCase().includes('LOGSHEET POMPA') ||
    Boolean(submission.submission_data?.room_temperature) ||
    Boolean(submission.submission_data?.kondisi_ruang_pompa) ||
    (submission.schema_definition as any)?.layout === 'TABLE_LOGSHEET_POMPA';

  const isLiftChecklist =
    submission.template_code === 'CHK-LIFT-OPS' ||
    submission.template_title?.toUpperCase().includes('OPERASIONAL LIFT') ||
    (submission.schema_definition as any)?.layout === 'TABLE_CHEKLIST_LIFT';

  const isMcfaChecklist =
    submission.template_code === 'CHK-MCFA-ANN' ||
    submission.template_title?.toUpperCase().includes('MCFA') ||
    (submission.schema_definition as any)?.layout === 'TABLE_CHEKLIST_MCFA';

  const isPagingChecklist =
    submission.template_code === 'CHK-PAGING-EVAC' ||
    submission.template_code === 'CHK-PAGING' ||
    submission.template_title?.toUpperCase().includes('PAGING') ||
    (submission.schema_definition as any)?.layout === 'TABLE_PAGING_EVAKUASI';

  const subData = submission.submission_data || {};
  const schema = submission.schema_definition;

  const renderToggleBadge = (val: string) => {
    const s = String(val).toUpperCase().trim();
    if (s === 'OK') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          <Check className="h-3 w-3" /> OK
        </span>
      );
    }
    if (s === 'NOT OK' || s === 'BAD') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">
          <AlertTriangle className="h-3 w-3" /> {s}
        </span>
      );
    }
    if (s === 'ON') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
          ON
        </span>
      );
    }
    if (s === 'OFF') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          OFF
        </span>
      );
    }
    if (s === 'OPEN') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">
          OPEN
        </span>
      );
    }
    if (s === 'CLOSE' || s === 'CLOSED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
          CLOSE
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        {val}
      </span>
    );
  };

  // Collect gas specific keys so we don't repeat them in the dynamic list
  const gasSpecialKeys = new Set([
    'temuan',
    'tindakan_koreksi',
    'status_inspeksi',
    'engineering_nama',
    'hse_nama',
    'building_manager_nama',
  ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full ${isPumpLogsheet || isLiftChecklist || isMcfaChecklist || isPagingChecklist ? 'max-w-5xl' : 'max-w-3xl'} max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                {submission.template_code || 'CHK'}
              </span>
              {submission.department_name && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                  <Building2 className="h-3 w-3 text-amber-600" />
                  {submission.department_name}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  submission.has_abnormal_reading
                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}
              >
                {submission.has_abnormal_reading ? (
                  <>
                    <AlertTriangle className="h-3 w-3 text-rose-600" />
                    ABNORMAL READING
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    ALL SYSTEMS NORMAL
                  </>
                )}
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
              {submission.template_title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Audit Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <UserIcon className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Technician</div>
                <div className="font-bold text-slate-800">{submission.technician_name}</div>
                {submission.employee_code && (
                  <div className="text-[10px] font-mono text-slate-500">{submission.employee_code}</div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Location</div>
                <div className="font-bold text-slate-800">{submission.location_name}</div>
                <div className="text-[10px] text-slate-500">
                  {submission.location_building} {submission.location_floor ? `• ${submission.location_floor}` : ''}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold text-slate-400">Recorded At</div>
                <div className="font-bold text-slate-800">
                  {new Date(submission.submitted_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {new Date(submission.submitted_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} WIB
                </div>
              </div>
            </div>
          </div>

          {/* Technician Remarks (if non-pump or additional) */}
          {!isPumpLogsheet && submission.technician_notes && (
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-1.5 font-serif">
                <FileText className="h-3.5 w-3.5 text-amber-700" />
                Technician Observations & Remarks
              </div>
              <p className="text-slate-800 italic leading-relaxed">
                "{submission.technician_notes}"
              </p>
            </div>
          )}

          {/* SGH TOWER PUMP LOGSHEET SPECIFIC PRESENTATION */}
          {isPumpLogsheet ? (
            <div className="space-y-4">
              {/* Header Box */}
              <div className="bg-slate-50 rounded-xl border border-slate-300 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-bold font-serif text-slate-900 tracking-tight">
                      SGH TOWER
                    </h3>
                    <p className="text-xs font-bold text-slate-700">
                      DAILY LOGSHEET POMPA-POMPA GEDUNG
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="font-semibold text-slate-600 uppercase">ROOM TEMPERATURE:</span>
                      <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                        {subData.room_temperature || '-'} °C
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 space-y-1 self-start sm:self-auto min-w-[200px]">
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 uppercase font-bold">TANGGAL:</span>
                      <span className="font-semibold text-slate-900">{subData.tanggal || new Date(submission.submitted_at).toLocaleDateString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-slate-500 uppercase font-bold">JAM PERIKSA:</span>
                      <span className="font-semibold text-slate-900">{subData.jam_periksa || new Date(submission.submitted_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 27-row Matrix Table (Read Only) */}
              <PumpLogsheetTable formData={subData} readOnly={true} />

              {/* Bottom Inspection Findings & Sign-Off Matrix */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 space-y-4 shadow-2xs">
                {/* Kondisi Ruang Pompa & Keterangan */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-200 pb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 uppercase">KONDISI RUANG POMPA:</span>
                    <span
                      className={`px-2.5 py-1 rounded font-bold uppercase text-[11px] border ${
                        subData.kondisi_ruang_pompa === 'BERDEBU'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      }`}
                    >
                      {subData.kondisi_ruang_pompa === 'BERDEBU' ? '⚠️ BERDEBU' : '✓ BERSIH'}
                    </span>
                  </div>

                  <div className="flex-1 flex items-center gap-2">
                    <span className="font-bold text-slate-700 uppercase whitespace-nowrap">KETERANGAN:</span>
                    <span className="p-2 rounded bg-slate-50 border border-slate-200 text-slate-800 flex-1 font-sans">
                      {subData.keterangan || <span className="text-slate-400 italic">Tidak ada catatan keterangan tambahan.</span>}
                    </span>
                  </div>
                </div>

                {/* 4-Party Verification Sign-off Matrix */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 font-serif">
                    Verifikasi & Otorisasi Dokumen:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Dicek Oleh (Teknisi 1)</span>
                      <span className="font-bold text-slate-900 block truncate">{subData.teknisi_1_nama || submission.technician_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Pelaksana 1</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Dicek Oleh (Teknisi 2)</span>
                      <span className="font-bold text-slate-900 block truncate">{subData.teknisi_2_nama || '-'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Pelaksana 2</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Diperiksa Oleh</span>
                      <span className="font-bold text-slate-900 block truncate">{subData.spv_engineering_nama || 'SPV Engineering'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">SPV Engineering</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block mb-0.5">Mengetahui</span>
                      <span className="font-bold text-slate-900 block truncate">{subData.building_manager_nama || 'Building Manager'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Building Manager</span>
                    </div>
                  </div>
                </div>

                {/* Legal Ownership Notice Box */}
                <div className="p-2.5 rounded-lg border border-slate-300 bg-slate-100/70 text-center">
                  <p className="text-[10px] font-bold text-slate-700 tracking-wider font-mono">
                    DOKUMEN INI MILIK PT.MUTIARA PROKLAMASI SEJAHTERA - GEDUNG SGH TOWER
                  </p>
                </div>
              </div>
            </div>
          ) : isLiftChecklist ? (
            <LiftChecklistTable formData={subData} readOnly={true} />
          ) : isMcfaChecklist ? (
            <McfaChecklistTable formData={subData} readOnly={true} />
          ) : isPagingChecklist ? (
            <PagingChecklistTable formData={subData} readOnly={true} />
          ) : (
            <>
              {/* Gas Checklist Special Section */}
              {isGasForm && (
                <div className="p-4 sm:p-5 rounded-xl border border-amber-200 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <Flame className="h-4 w-4 text-amber-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-serif">
                      Form FR-LO-005 Verification & Findings
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Temuan (Deviasi/Fisik):</span>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 min-h-[40px]">
                        {subData.temuan || <span className="text-slate-400 italic">Tidak ada temuan deviasi.</span>}
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-600 block mb-1">Tindakan Koreksi:</span>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 min-h-[40px]">
                        {subData.tindakan_koreksi || <span className="text-slate-400 italic">Tidak ada tindakan koreksi.</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex-wrap text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Status Keseluruhan: </span>
                      <span className="font-bold text-slate-900 ml-1">
                        {subData.status_inspeksi || 'Normal'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Sign-off: <strong>{subData.engineering_nama || 'Engineering'}</strong></span>
                      <span>•</span>
                      <span><strong>{subData.hse_nama || 'HSE'}</strong></span>
                      <span>•</span>
                      <span><strong>{subData.building_manager_nama || 'BM'}</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Structured Submitted Parameters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5 font-serif">
                    <Layers className="h-3.5 w-3.5 text-amber-600" />
                    Recorded Field Parameters & Values
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Code2 className="h-3 w-3" />
                    {showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}
                  </button>
                </div>

                {/* Standard Forms Fields Layout */}
                {schema?.fields && schema.fields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {schema.fields.map((field) => {
                      const val = subData[field.id];
                      const hasVal = val !== undefined && val !== null && val !== '';

                      return (
                        <div
                          key={field.id}
                          className="p-3 rounded-lg border border-slate-200 bg-white shadow-2xs flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-slate-800 truncate">{field.label}</div>
                            {field.unit && (
                              <span className="text-[10px] text-slate-400 font-mono">Unit: {field.unit}</span>
                            )}
                          </div>

                          <div className="shrink-0 text-right">
                            {!hasVal ? (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            ) : field.field_type === 'STATUS_TOGGLE' ? (
                              renderToggleBadge(val)
                            ) : (
                              <span className="font-bold font-mono text-slate-900 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                {val} {field.unit || ''}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Custom Hierarchical Forms Headings Layout */}
                {schema?.headings && schema.headings.length > 0 && (
                  <div className="space-y-4">
                    {schema.headings.map((heading) => (
                      <div key={heading.id} className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 text-xs font-serif">
                          {heading.title}
                        </div>

                        <div className="p-3 sm:p-4 space-y-3">
                          {heading.subheadings?.map((sub) => (
                            <div key={sub.id} className="space-y-2">
                              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                                <span className="text-xs font-semibold text-amber-900">{sub.title}</span>
                                {sub.fixed_benchmark && (
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    Benchmark: {sub.fixed_benchmark}
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {sub.children?.flatMap((child) =>
                                  child.fields?.map((f) => {
                                    const val = subData[f.id];
                                    const hasVal = val !== undefined && val !== null && val !== '';
                                    return (
                                      <div
                                        key={f.id}
                                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[10px] text-slate-500 truncate">{child.label}</div>
                                          <div className="font-medium text-slate-800 truncate">{f.label}</div>
                                        </div>
                                        <div className="shrink-0">
                                          {!hasVal ? (
                                            <span className="text-slate-400 italic text-[11px]">-</span>
                                          ) : f.field_type === 'STATUS_TOGGLE' ? (
                                            renderToggleBadge(val)
                                          ) : (
                                            <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                              {val} {f.unit || ''}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          ))}

                          {heading.children?.map((child) => (
                            <div key={child.id} className="space-y-2">
                              <span className="text-xs font-semibold text-slate-700">{child.label}</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {child.fields?.map((f) => {
                                  const val = subData[f.id];
                                  const hasVal = val !== undefined && val !== null && val !== '';
                                  return (
                                    <div
                                      key={f.id}
                                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="font-medium text-slate-800 truncate">{f.label}</div>
                                      </div>
                                      <div className="shrink-0">
                                        {!hasVal ? (
                                          <span className="text-slate-400 italic text-[11px]">-</span>
                                        ) : f.field_type === 'STATUS_TOGGLE' ? (
                                          renderToggleBadge(val)
                                        ) : (
                                          <span className="font-bold font-mono text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                                            {val} {f.unit || ''}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fallback table if no schema definition or for generic flat entries */}
                {(!schema || (!schema.fields?.length && !schema.headings?.length)) && (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-3">Field Key</th>
                          <th className="py-2.5 px-3">Recorded Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {Object.entries(subData)
                          .filter(([key]) => !gasSpecialKeys.has(key))
                          .map(([key, val]) => (
                            <tr key={key} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 text-slate-700 font-medium">{key}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {typeof val === 'string' && ['OK', 'NOT OK', 'ON', 'OFF', 'OPEN', 'CLOSE'].includes(val.toUpperCase())
                                  ? renderToggleBadge(val)
                                  : String(val)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Optional Raw JSON view */}
          <div className="pt-2">
            {!isPumpLogsheet && (
              <></>
            )}
            {isPumpLogsheet && (
              <div className="flex justify-end mb-2">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="text-[11px] font-semibold text-slate-500 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  <Code2 className="h-3 w-3" />
                  {showRawJson ? 'Hide Raw JSON' : 'View Raw JSON'}
                </button>
              </div>
            )}
            {showRawJson && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Raw Submission Data Payload:</span>
                <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(subData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 font-mono truncate hidden sm:block">
              Audit ID: {submission.id}
            </span>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(submission)}
                className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Permanently remove this submission"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                Remove Submission
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={
                isPagingChecklist
                  ? `/api/export/paging-pdf?id=${submission.id}`
                  : isMcfaChecklist
                  ? `/api/export/mcfa-pdf?id=${submission.id}`
                  : isLiftChecklist
                  ? `/api/export/lift-pdf?id=${submission.id}`
                  : isGasForm
                  ? `/api/export/gas-pdf?id=${submission.id}`
                  : isPumpLogsheet
                  ? `/api/export/pump-pdf?id=${submission.id}`
                  : `/api/export/pdf?id=${submission.id}`
              }
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-amber-700" />
              {isPagingChecklist
                ? 'Download Panel Paging PDF'
                : isMcfaChecklist
                ? 'Download Cheklist MCFA PDF'
                : isLiftChecklist
                ? 'Download Cheklist Lift PDF'
                : isPumpLogsheet
                ? 'Download Logsheet PDF'
                : isGasForm
                ? 'Download FR-LO-005 PDF'
                : 'Download Audit PDF'}
            </a>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg btn-gold font-bold text-xs transition-all shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
