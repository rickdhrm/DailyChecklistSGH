'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { FormTemplate, Location, User, FormHeading, FormSubheading, FormChild, FormField } from '@/types';
import PumpLogsheetTable from '@/components/forms/PumpLogsheetTable';
import { PUMP_LOGSHEET_ITEMS } from '@/lib/pumpLogsheetConstants';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  Save, 
  ArrowLeft, 
  Loader2, 
  Info,
  Clock,
  Download,
  Check,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export default function ChecklistEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [technicianNotes, setTechnicianNotes] = useState<string>('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Official Gas Checklist specific states (FR-LO-005)
  const [temuan, setTemuan] = useState<string>('');
  const [tindakanKoreksi, setTindakanKoreksi] = useState<string>('');
  const [statusInspeksi, setStatusInspeksi] = useState<string>('Normal');
  const [engineeringName, setEngineeringName] = useState<string>('Andi (SPV)');
  const [hseName, setHseName] = useState<string>('HSE Officer');
  const [bmName, setBmName] = useState<string>('Lead BM');

  // Official SGH Tower Daily Logsheet Pompa-Pompa Gedung specific states
  const [roomTemperature, setRoomTemperature] = useState<string>('28');
  const [tanggalPeriksa, setTanggalPeriksa] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [jamPeriksa, setJamPeriksa] = useState<string>(() => {
    const today = new Date();
    return `${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
  });
  const [kondisiRuangPompa, setKondisiRuangPompa] = useState<'BERSIH' | 'BERDEBU'>('BERSIH');
  const [keteranganRuangPompa, setKeteranganRuangPompa] = useState<string>('');
  const [teknisi1Nama, setTeknisi1Nama] = useState<string>('');
  const [teknisi2Nama, setTeknisi2Nama] = useState<string>('');
  const [spvEngineeringNama, setSpvEngineeringNama] = useState<string>('SPV Engineering');
  const [buildingManagerNama, setBuildingManagerNama] = useState<string>('Building Manager');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Auth check
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
        if (meData.user?.full_name) {
          setTeknisi1Nama(meData.user.full_name);
        }

        // 2. Fetch Form Template
        const formRes = await fetch(`/api/forms/${id}`);
        if (!formRes.ok) throw new Error('Failed to load form template');
        const formDataObj = await formRes.json();
        setTemplate(formDataObj);

        // 3. Fetch Locations
        const locRes = await fetch('/api/locations');
        if (locRes.ok) {
          const locs = await locRes.json();
          setLocations(locs);
          if (locs.length > 0) setSelectedLocationId(locs[0].id);
        }

        // Initialize default form values
        const defaults: Record<string, any> = {};

        // Pump Logsheet default initialization (Switch: AUTO, Valve: OPEN)
        const isPump =
          formDataObj.code === 'SGH-LOG-POMPA' ||
          formDataObj.title?.toUpperCase().includes('LOGSHEET POMPA') ||
          formDataObj.schema_definition?.layout === 'TABLE_LOGSHEET_POMPA';

        if (isPump) {
          PUMP_LOGSHEET_ITEMS.forEach((item) => {
            if (item.type === 'standard' || item.type === 'electrical') {
              defaults[`${item.id}_switch`] = 'AUTO';
              defaults[`${item.id}_gate_valve`] = 'OPEN';
            } else if (item.type === 'wlc_position') {
              defaults['posisi_wlc_ground_switch'] = 'AUTO';
            }
          });
        }

        if (formDataObj.form_type === 'STANDARD' && formDataObj.schema_definition?.fields) {
          formDataObj.schema_definition.fields.forEach((f: FormField) => {
            if (f.field_type === 'STATUS_TOGGLE') {
              defaults[f.id] = (f.options && f.options.length > 0) ? f.options[0] : 'OK';
            }
          });
        } else if (formDataObj.form_type === 'CUSTOM' && formDataObj.schema_definition?.headings) {
          formDataObj.schema_definition.headings.forEach((h: FormHeading) => {
            const checkChildren = (children: FormChild[]) => {
              children?.forEach((c: FormChild) => {
                c.fields?.forEach((f: FormField) => {
                  if (f.field_type === 'STATUS_TOGGLE') {
                    defaults[f.id] = (f.options && f.options.length > 0) ? f.options[0] : 'OK';
                  }
                });
              });
            };

            if (h.children) checkChildren(h.children);
            if (h.subheadings) {
              h.subheadings.forEach((sub: FormSubheading) => {
                if (sub.children) checkChildren(sub.children);
              });
            }
          });
        }
        setFormData(defaults);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, router]);

  const isGasForm =
    template?.code === 'FR-LO-005' ||
    template?.code === 'CHK-GAS' ||
    (template?.schema_definition as any)?.form_code === 'FR-LO-005' ||
    template?.title?.toUpperCase().includes('GAS');
  const isPumpLogsheet =
    template?.code === 'SGH-LOG-POMPA' ||
    template?.title?.toUpperCase().includes('LOGSHEET POMPA') ||
    (template?.schema_definition as any)?.layout === 'TABLE_LOGSHEET_POMPA';

  const toggleSection = (headingId: string) => {
    setCollapsedSections(prev => ({ ...prev, [headingId]: !prev[headingId] }));
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const isFieldAbnormal = (field: FormField, val: any): boolean => {
    if (val === undefined || val === null || val === '') return false;
    if (field.field_type === 'STATUS_TOGGLE') {
      const s = String(val).toUpperCase().trim();
      return (
        s === 'NOT OK' ||
        s.includes('ABNORMAL') ||
        s.includes('TROUBLE') ||
        s.includes('FAULT') ||
        s.includes('LEAK') ||
        s.includes('DEAD') ||
        s === 'BAD'
      );
    }
    // No limitation on all of the number input fields
    return false;
  };

  const handleDownloadOfficialPDF = async () => {
    setDownloadingPdf(true);
    try {
      const endpoint = isPumpLogsheet ? '/api/export/pump-pdf' : '/api/export/gas-pdf';
      const defaultFilename = isPumpLogsheet
        ? `SGH_Logsheet_Pompa_Template_${Date.now()}.pdf`
        : `FR-LO-005_Checklist_Gas_${Date.now()}.pdf`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to generate official PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Check for any abnormal readings
      let hasAbnormal = false;

      const checkField = (f: FormField) => {
        if (isFieldAbnormal(f, formData[f.id])) {
          hasAbnormal = true;
        }
      };

      if (template?.form_type === 'STANDARD') {
        template.schema_definition?.fields?.forEach(checkField);
      } else if (template?.schema_definition?.headings) {
        template.schema_definition.headings.forEach(h => {
          h.children?.forEach(c => c.fields?.forEach(checkField));
          h.subheadings?.forEach(sub => sub.children?.forEach(c => c.fields?.forEach(checkField)));
        });
      }

      if (statusInspeksi !== 'Normal') {
        hasAbnormal = true;
      }

      if (isPumpLogsheet && kondisiRuangPompa === 'BERDEBU') {
        hasAbnormal = true;
      }

      // Merge Gas & Pump specific fields into submission data
      const finalSubmissionData = {
        ...formData,
        ...(isPumpLogsheet ? {
          room_temperature: roomTemperature,
          tanggal: tanggalPeriksa,
          jam_periksa: jamPeriksa,
          kondisi_ruang_pompa: kondisiRuangPompa,
          keterangan: keteranganRuangPompa,
          teknisi_1_nama: teknisi1Nama || user?.full_name || 'Teknisi 1',
          teknisi_2_nama: teknisi2Nama,
          spv_engineering_nama: spvEngineeringNama,
          building_manager_nama: buildingManagerNama,
        } : {}),
        ...(isGasForm ? {
          temuan,
          tindakan_koreksi: tindakanKoreksi,
          status_inspeksi: statusInspeksi,
          engineering_nama: engineeringName,
          hse_nama: hseName,
          building_manager_nama: bmName,
        } : {})
      };

      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: template?.id,
          location_id: selectedLocationId,
          submission_data: finalSubmissionData,
          technician_notes: isPumpLogsheet 
            ? (keteranganRuangPompa || technicianNotes) 
            : (isGasForm ? temuan || technicianNotes : technicianNotes),
          has_abnormal_reading: hasAbnormal,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit checklist');

      setSuccessMessage('Checklist successfully recorded and submitted.');
      setTimeout(() => {
        router.push('/history');
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500 mr-2" />
        <span>Loading checklist schema...</span>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] p-6 text-center text-slate-500">
        Checklist template not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={user} />

      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 pb-36 sm:pb-20">
        {/* Back Link & Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Checklists
          </button>

          {(isGasForm || isPumpLogsheet) && (
            <button
              type="button"
              onClick={handleDownloadOfficialPDF}
              disabled={downloadingPdf}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                isPumpLogsheet
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
              }`}
            >
              {downloadingPdf ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className={`h-3.5 w-3.5 ${isPumpLogsheet ? 'text-amber-700' : 'text-rose-600'}`} />
              )}
              {isPumpLogsheet ? 'Download Blank PDF (Logsheet Pompa)' : 'Download Blank PDF (FR-LO-005)'}
            </button>
          )}
        </div>

        {/* Master Header Card */}
        <div className="facility-card p-5 sm:p-6 mb-6 bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300">
                  {isGasForm ? 'FORM FR-LO-005 • Rev. 00' : template.category}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {template.code} • v{template.version}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-serif">
                {template.title}
              </h1>
              {template.description && (
                <p className="text-xs text-slate-500 mt-1">{template.description}</p>
              )}
            </div>

            {isGasForm ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-mono shrink-0 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">No. Form</span>
                  <span className="text-slate-900 font-bold">: FR-LO-005</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Revisi</span>
                  <span className="text-slate-900 font-bold">: 00</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Tanggal</span>
                  <span className="text-slate-800">
                    : {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Halaman</span>
                  <span className="text-slate-800">: 1 dari 1</span>
                </div>
              </div>
            ) : isPumpLogsheet ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px] font-mono shrink-0 space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Gedung</span>
                  <span className="text-slate-900 font-bold">: SGH TOWER</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Entitas</span>
                  <span className="text-slate-900 font-bold">: PT. Mutiara Proklamasi Sejahtera</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-500">Total Pompa</span>
                  <span className="text-amber-800 font-bold">: 27 Unit</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 shrink-0">
                <Clock className="h-4 w-4 text-amber-600" />
                <span>Inspection: {new Date().toLocaleDateString('id-ID', { dateStyle: 'medium' })}</span>
              </div>
            )}
          </div>

          {/* Location & Metadata Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                Inspection Location Site
              </label>
              <select
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white transition-all"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} — {loc.building} ({loc.floor || 'Level'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-amber-600" />
                Inspector & Timestamp
              </label>
              <div className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-sm flex items-center justify-between">
                <span className="font-medium">{user?.full_name || user?.username || 'Technician'} ({user?.role})</span>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date().toLocaleDateString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2.5 shadow-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2.5 shadow-xs">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {isPumpLogsheet ? (
            <div className="space-y-6">
              {/* SGH TOWER OFFICIAL LOGSHEET HEADER */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-slate-900">
                      SGH TOWER
                    </h2>
                    <p className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
                      DAILY LOGSHEET POMPA-POMPA GEDUNG
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs w-full lg:w-auto">
                    {/* Room Temp */}
                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-[10px] font-bold text-amber-900 uppercase">
                        Room Temperature
                      </span>
                      <div className="inline-flex items-center gap-1.5">
                        <input
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={roomTemperature}
                          onChange={(e) => setRoomTemperature(e.target.value)}
                          placeholder="28"
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-white border border-amber-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <span className="text-xs font-bold text-amber-900 font-mono">°C</span>
                      </div>
                    </div>

                    {/* Tanggal */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        Tanggal Periksa
                      </span>
                      <input
                        type="date"
                        value={tanggalPeriksa}
                        onChange={(e) => setTanggalPeriksa(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-semibold text-xs"
                      />
                    </div>

                    {/* Jam Periksa */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between sm:flex-col sm:items-start gap-1">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">
                        Jam Periksa
                      </span>
                      <input
                        type="time"
                        value={jamPeriksa}
                        onChange={(e) => setJamPeriksa(e.target.value)}
                        className="px-2 py-1 bg-white border border-slate-300 rounded-md text-slate-900 font-semibold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 27-ROW INTERACTIVE MATRIX TABLE / MOBILE CARD VIEW */}
              <PumpLogsheetTable
                formData={formData}
                onChange={handleFieldChange}
                readOnly={false}
              />

              {/* SGH TOWER OFFICIAL LOGSHEET BOTTOM SECTION */}
              <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 space-y-5 shadow-xs">
                {/* Kondisi Ruang Pompa & Keterangan */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 border-b border-slate-200 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      KONDISI RUANG POMPA :
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setKondisiRuangPompa('BERSIH')}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                          kondisiRuangPompa === 'BERSIH'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {kondisiRuangPompa === 'BERSIH' ? '✓ ' : '○ '} BERSIH
                      </button>
                      <button
                        type="button"
                        onClick={() => setKondisiRuangPompa('BERDEBU')}
                        className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 min-h-[44px] ${
                          kondisiRuangPompa === 'BERDEBU'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {kondisiRuangPompa === 'BERDEBU' ? '✓ ' : '○ '} BERDEBU
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase whitespace-nowrap">
                      KETERANGAN :
                    </span>
                    <input
                      type="text"
                      value={keteranganRuangPompa}
                      onChange={(e) => setKeteranganRuangPompa(e.target.value)}
                      placeholder="Catatan kondisi ruang pompa, temuan fisik, atau tindak lanjut..."
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-sm sm:text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* 4-Party Verification Sign-off Matrix & Legal Notice */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                  {/* Dicek Oleh: Teknisi 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Dicek Oleh</span>
                      <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-mono text-[9px]">Teknisi 1</span>
                    </div>
                    <input
                      type="text"
                      value={teknisi1Nama}
                      onChange={(e) => setTeknisi1Nama(e.target.value)}
                      placeholder="Nama Teknisi 1"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">Pelaksana Inspeksi 1</span>
                  </div>

                  {/* Dicek Oleh: Teknisi 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Dicek Oleh</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 font-mono text-[9px]">Teknisi 2</span>
                    </div>
                    <input
                      type="text"
                      value={teknisi2Nama}
                      onChange={(e) => setTeknisi2Nama(e.target.value)}
                      placeholder="Nama Teknisi 2 (Opsional)"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">Pelaksana Inspeksi 2</span>
                  </div>

                  {/* Diperiksa Oleh: SPV Engineering */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Diperiksa Oleh</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-mono text-[9px]">Supervisor</span>
                    </div>
                    <input
                      type="text"
                      value={spvEngineeringNama}
                      onChange={(e) => setSpvEngineeringNama(e.target.value)}
                      placeholder="Nama SPV Engineering"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">SPV Engineering</span>
                  </div>

                  {/* Mengetahui: Building Manager */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Mengetahui</span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-900 font-mono text-[9px]">Management</span>
                    </div>
                    <input
                      type="text"
                      value={buildingManagerNama}
                      onChange={(e) => setBuildingManagerNama(e.target.value)}
                      placeholder="Nama Building Manager"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">Building Manager</span>
                  </div>
                </div>

                {/* Official Legal Ownership Notice Box */}
                <div className="p-3 rounded-lg border border-slate-300 bg-slate-100/60 text-center">
                  <p className="text-[11px] font-bold text-slate-700 tracking-wider font-mono">
                    DOKUMEN INI MILIK PT.MUTIARA PROKLAMASI SEJAHTERA
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest font-mono">
                    GEDUNG SGH TOWER
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* STANDARD FLAT FORM RENDERER */}
              {template.form_type === 'STANDARD' && (
                <div className="facility-card p-5 space-y-4 bg-white border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 font-serif">
                    Inspection Questions
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {template.schema_definition?.fields?.map((field: FormField) => renderFieldInput(field))}
                  </div>
                </div>
              )}

              {/* CUSTOM HIERARCHICAL FORM RENDERER */}
              {template.form_type === 'CUSTOM' && (
                <div className="space-y-4">
                  {template.schema_definition?.headings?.map((heading: FormHeading) => {
                    const isCollapsed = collapsedSections[heading.id] ?? false;

                    return (
                      <div key={heading.id} className="facility-card overflow-hidden bg-white border border-slate-200 shadow-xs">
                        {/* Collapsible Section Header */}
                        <button
                          type="button"
                          onClick={() => toggleSection(heading.id)}
                          className="w-full px-5 py-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left transition-colors border-b border-slate-200 cursor-pointer"
                        >
                          <span className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2 font-serif">
                            {heading.title}
                          </span>
                          <div className="p-1 rounded-md bg-white border border-slate-200 text-slate-600">
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </button>

                        {/* Section Body */}
                        {!isCollapsed && (
                          <div className="p-4 sm:p-5 space-y-4">
                            {/* If Gas Form with tabular layout */}
                            {isGasForm ? (
                              <div>
                                {/* Mobile Card View for Gas Checklist */}
                                <div className="sm:hidden space-y-3">
                                  {heading.children?.[0]?.fields?.map((field: any, idx: number) => {
                                    const conditionVal = formData[field.id] || 'GOOD';
                                    const totalVal = formData[`${field.id}_total`] || '';
                                    const remarksVal = formData[`${field.id}_remarks`] || '';

                                    return (
                                      <div key={field.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                                        <div className="flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {idx + 1}
                                          </span>
                                          <span className="font-semibold text-slate-800 text-xs">
                                            {field.label.replace(/^\d+\.\s*/, '')}
                                          </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                              Total
                                            </span>
                                            <input
                                              type="text"
                                              inputMode="numeric"
                                              value={totalVal}
                                              onChange={(e) => handleFieldChange(`${field.id}_total`, e.target.value)}
                                              placeholder="-"
                                              className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-center text-sm font-mono text-slate-900 focus:bg-white"
                                            />
                                          </div>

                                          <div>
                                            <span className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                              Kondisi
                                            </span>
                                            <div className="grid grid-cols-2 gap-1">
                                              <button
                                                type="button"
                                                onClick={() => handleFieldChange(field.id, 'GOOD')}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer min-h-[42px] flex items-center justify-center ${
                                                  conditionVal === 'GOOD'
                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                    : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                              >
                                                GOOD
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleFieldChange(field.id, 'BAD')}
                                                className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all cursor-pointer min-h-[42px] flex items-center justify-center ${
                                                  conditionVal === 'BAD'
                                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                    : 'bg-white text-slate-600 border-slate-200'
                                                }`}
                                              >
                                                BAD
                                              </button>
                                            </div>
                                          </div>
                                        </div>

                                        <div>
                                          <input
                                            type="text"
                                            value={remarksVal}
                                            onChange={(e) => handleFieldChange(`${field.id}_remarks`, e.target.value)}
                                            placeholder="Catatan / keterangan temuan..."
                                            className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs text-slate-900 focus:bg-white"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Desktop Table for Gas Checklist */}
                                <div className="hidden sm:block overflow-x-auto">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[10px] border-b border-slate-200">
                                      <tr>
                                        <th className="py-2.5 px-3 w-12 text-center">NO</th>
                                        <th className="py-2.5 px-3 min-w-[220px]">ITEMS</th>
                                        <th className="py-2.5 px-3 w-24 text-center">TOTAL</th>
                                        <th className="py-2.5 px-3 w-36 text-center">CONDITION</th>
                                        <th className="py-2.5 px-3 min-w-[150px]">REMARKS</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {heading.children?.[0]?.fields?.map((field: any, idx: number) => {
                                        const conditionVal = formData[field.id] || 'GOOD';
                                        const totalVal = formData[`${field.id}_total`] || '';
                                        const remarksVal = formData[`${field.id}_remarks`] || '';

                                        return (
                                          <tr key={field.id} className="hover:bg-amber-50/20">
                                            <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">
                                              {idx + 1}
                                            </td>
                                            <td className="py-2 px-3 text-slate-800 font-medium">
                                              {field.label.replace(/^\d+\.\s*/, '')}
                                            </td>
                                            <td className="py-2 px-3">
                                              <input
                                                type="text"
                                                value={totalVal}
                                                onChange={(e) => handleFieldChange(`${field.id}_total`, e.target.value)}
                                                placeholder="-"
                                                className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-300 text-center text-xs text-slate-900 focus:bg-white"
                                              />
                                            </td>
                                            <td className="py-2 px-3">
                                              <div className="grid grid-cols-2 gap-1 w-28 mx-auto">
                                                <button
                                                  type="button"
                                                  onClick={() => handleFieldChange(field.id, 'GOOD')}
                                                  className={`py-1 px-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                                                    conditionVal === 'GOOD'
                                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-400 hover:text-emerald-700'
                                                  }`}
                                                >
                                                  GOOD
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleFieldChange(field.id, 'BAD')}
                                                  className={`py-1 px-1.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                                                    conditionVal === 'BAD'
                                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-700'
                                                  }`}
                                                >
                                                  BAD
                                                </button>
                                              </div>
                                            </td>
                                            <td className="py-2 px-3">
                                              <input
                                                type="text"
                                                value={remarksVal}
                                                onChange={(e) => handleFieldChange(`${field.id}_remarks`, e.target.value)}
                                                placeholder="Remarks..."
                                                className="w-full px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white"
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : (
                              /* Standard custom rendering for other equipment */
                              <>
                                {heading.subheadings?.map((subheading: FormSubheading) => (
                                  <div key={subheading.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                                    <div className="border-b border-slate-200 pb-2">
                                      <h3 className="text-sm font-bold text-amber-800 font-serif">
                                        {subheading.title}
                                      </h3>
                                      {subheading.fixed_benchmark && (
                                        <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-300">
                                          <Info className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                                          <span>Benchmark: {subheading.fixed_benchmark}</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-4 pl-1">
                                      {subheading.children?.map((child: FormChild) => (
                                        <div key={child.id} className="space-y-3">
                                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                                            {child.label}
                                          </h4>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {child.fields?.map((field: FormField) => renderFieldInput(field))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}

                                {heading.children?.map((child: FormChild) => (
                                  <div key={child.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                                      {child.label}
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {child.fields?.map((field: FormField) => renderFieldInput(field))}
                                    </div>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* OFFICIAL PDF BOTTOM SECTION: TEMUAN, STATUS & SIGN-OFF */}
              {isGasForm ? (
                <div className="facility-card p-5 sm:p-6 space-y-6 bg-white border border-slate-200 shadow-xs">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 font-serif">
                    Temuan, Status & Verifikasi Sign-off (Sesuai Form FR-LO-005)
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Temuan & Tindakan Koreksi */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Temuan:
                        </label>
                        <textarea
                          rows={2}
                          value={temuan}
                          onChange={(e) => setTemuan(e.target.value)}
                          placeholder="Tuliskan temuan fisik atau deviasi operasional gas..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                          Tindakan Koreksi:
                        </label>
                        <textarea
                          rows={2}
                          value={tindakanKoreksi}
                          onChange={(e) => setTindakanKoreksi(e.target.value)}
                          placeholder="Tuliskan langkah perbaikan yang telah atau akan dilakukan..."
                          className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:ring-1 focus:ring-amber-500/50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* 2. Status Radio Options */}
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold uppercase tracking-wider text-amber-800">
                        Status Keseluruhan:
                      </label>
                      <div className="space-y-2">
                        {['Normal', 'Perlu Perbaikan', 'Critical – Gas Harus Diisolasi'].map((st) => (
                          <button
                            type="button"
                            key={st}
                            onClick={() => setStatusInspeksi(st)}
                            className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between border transition-all cursor-pointer ${
                              statusInspeksi === st
                                ? st === 'Normal'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 font-bold shadow-xs'
                                  : st === 'Perlu Perbaikan'
                                  ? 'bg-amber-50 text-amber-800 border-amber-400 font-bold shadow-xs'
                                  : 'bg-rose-50 text-rose-800 border-rose-400 font-bold shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <span>[ {statusInspeksi === st ? 'X' : ' '} ] {st}</span>
                            {statusInspeksi === st && <Check className="h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 3. 4-Party Sign-Off Matrix */}
                  <div className="border-t border-slate-200 pt-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3">
                      Matriks Verifikasi & Tanda Tangan (TTD):
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                          Petugas (Field)
                        </span>
                        <input
                          type="text"
                          disabled
                          value={user?.full_name || 'Petugas'}
                          className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-200 text-xs text-slate-700 font-medium"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                          Engineering
                        </span>
                        <input
                          type="text"
                          value={engineeringName}
                          onChange={(e) => setEngineeringName(e.target.value)}
                          placeholder="Nama Engineering"
                          className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                          HSE Officer
                        </span>
                        <input
                          type="text"
                          value={hseName}
                          onChange={(e) => setHseName(e.target.value)}
                          placeholder="Nama HSE"
                          className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900"
                        />
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                          Building Manager
                        </span>
                        <input
                          type="text"
                          value={bmName}
                          onChange={(e) => setBmName(e.target.value)}
                          placeholder="Nama Building Manager"
                          className="w-full px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard notes section for other checklists */
                <div className="facility-card p-5 space-y-3 bg-white border border-slate-200 shadow-xs">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Technician Remarks / Observations
                  </label>
                  <textarea
                    rows={3}
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    placeholder="Add physical observations, unusual noises, leak remarks, or maintenance notes..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:bg-white"
                  />
                </div>
              )}
            </>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 rounded-xl btn-gold font-bold text-base transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-h-[50px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting Inspection...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Submit {isGasForm ? 'Form FR-LO-005 Checklist' : isPumpLogsheet ? 'Daily Logsheet Pompa-Pompa' : 'Daily Checklist'}
              </>
            )}
          </button>
        </form>

        {/* Floating Mobile Sticky Action Bar */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-2xl flex items-center justify-between gap-3 pb-safe">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isPumpLogsheet ? 'Status Logsheet' : 'Form Progress'}
            </span>
            <span className="text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isPumpLogsheet
                ? `${PUMP_LOGSHEET_ITEMS.filter((i) => formData[`${i.id}_switch`] || formData[`${i.id}_arus_r`]).length}/27 Pompa`
                : 'Siap Disimpan'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 px-4 rounded-xl btn-gold font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 cursor-pointer min-h-[46px]"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Kirim {isPumpLogsheet ? 'Logsheet' : 'Checklist'}</span>
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );

  function renderFieldInput(field: FormField) {
    const val = formData[field.id];

    return (
      <div key={field.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between gap-2 mb-1">
          <label className="text-xs font-semibold text-slate-800">
            {field.label} {field.required && <span className="text-rose-500">*</span>}
          </label>
          {field.unit && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-500 font-mono">
              {field.unit}
            </span>
          )}
        </div>

        {field.field_type === 'STATUS_TOGGLE' ? (
          <div className="grid grid-cols-2 gap-2">
            {(field.options && field.options.length > 0 ? field.options : ['OK', 'NOT OK']).map((opt) => {
              const selected = val === opt;
              const isNotOk = opt === 'NOT OK' || isFieldAbnormal(field, opt);
              const isOk = opt === 'OK';
              const isOn = opt === 'ON';
              const isOff = opt === 'OFF';
              const isOpen = opt === 'OPEN';
              const isClose = opt === 'CLOSE' || opt === 'CLOSED';

              let activeStyle = 'bg-amber-50 text-amber-800 border-amber-400 font-bold shadow-xs';
              if (isNotOk) {
                activeStyle = 'bg-rose-50 text-rose-700 border-rose-400 font-bold shadow-xs';
              } else if (isOk || isOn) {
                activeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-400 font-bold shadow-xs';
              } else if (isOff) {
                activeStyle = 'bg-slate-200 text-slate-800 border-slate-400 font-bold shadow-xs';
              } else if (isOpen) {
                activeStyle = 'bg-blue-50 text-blue-800 border-blue-400 font-bold shadow-xs';
              } else if (isClose) {
                activeStyle = 'bg-slate-200 text-slate-800 border-slate-400 font-bold shadow-xs';
              }

              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => handleFieldChange(field.id, opt)}
                  className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer min-h-[46px] flex items-center justify-center gap-1.5 ${
                    selected
                      ? activeStyle
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {selected && (isNotOk ? <AlertTriangle className="h-3.5 w-3.5 text-rose-600" /> : <Check className="h-3.5 w-3.5 text-emerald-600" />)}
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        ) : field.field_type === 'NUMBER' ? (
          <div>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={val ?? ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.unit ? `Input in ${field.unit}` : 'Enter value'}
              required={field.required}
              className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
        ) : (
          <input
            type="text"
            value={val ?? ''}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            placeholder="Notes or value"
            required={field.required}
            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-sm sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        )}
      </div>
    );
  }
}
