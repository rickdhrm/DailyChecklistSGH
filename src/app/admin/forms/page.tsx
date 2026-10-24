'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { FormTemplate, FormType, FormHeading, FormSubheading, FormChild, FormField, User } from '@/types';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Edit, 
  X, 
  Loader2 
} from 'lucide-react';

export default function FormBuilderAdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form builder modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [formType, setFormType] = useState<FormType>('CUSTOM');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Schema builder state
  const [standardFields, setStandardFields] = useState<FormField[]>([]);
  const [customHeadings, setCustomHeadings] = useState<FormHeading[]>([]);

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

        const formsRes = await fetch('/api/forms');
        if (formsRes.ok) {
          const forms = await formsRes.json();
          setTemplates(forms);
        }
      } catch (err) {
        console.error('Error initializing form builder:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const openCreateModal = () => {
    setEditingId(null);
    setCode('');
    setTitle('');
    setCategory('');
    setDescription('');
    setFormType('CUSTOM');
    setStandardFields([]);
    setCustomHeadings([
      {
        id: `h_${Date.now()}`,
        title: 'Section A - Primary Operational Checks',
        subheadings: [
          {
            id: `sub_${Date.now()}`,
            title: 'Equipment Unit 1',
            fixed_benchmark: 'Standard Spec: 380V ± 5%',
            children: [
              {
                id: `child_${Date.now()}`,
                label: 'Main Motor Readings',
                fields: [
                  {
                    id: `f_${Date.now()}_1`,
                    label: 'Supply Voltage',
                    field_type: 'NUMBER',
                    unit: 'V',
                    required: true,
                  },
                  {
                    id: `f_${Date.now()}_2`,
                    label: 'Running Condition',
                    field_type: 'STATUS_TOGGLE',
                    options: ['OK', 'NOT OK'],
                    required: true,
                  }
                ]
              }
            ]
          }
        ]
      }
    ]);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (tmpl: FormTemplate) => {
    setEditingId(tmpl.id);
    setCode(tmpl.code);
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setDescription(tmpl.description || '');
    setFormType(tmpl.form_type);

    if (tmpl.form_type === 'STANDARD') {
      setStandardFields(tmpl.schema_definition?.fields || []);
      setCustomHeadings([]);
    } else {
      setCustomHeadings(tmpl.schema_definition?.headings || []);
      setStandardFields([]);
    }

    setModalError(null);
    setIsModalOpen(true);
  };

  const addStandardField = () => {
    const newField: FormField = {
      id: `std_${Date.now()}`,
      label: 'New Checkpoint Field',
      field_type: 'NUMBER',
      required: false,
    };
    setStandardFields([...standardFields, newField]);
  };

  const getFieldSelectType = (field: FormField): string => {
    if (field.field_type === 'STATUS_TOGGLE') {
      const opts = field.options || [];
      if (opts.includes('ON') || opts.includes('OFF')) return 'STATUS_ON_OFF';
      if (opts.includes('OPEN') || opts.includes('CLOSE') || opts.includes('CLOSED')) return 'STATUS_OPEN_CLOSE';
      return 'STATUS_OK_NOT_OK';
    }
    return field.field_type;
  };

  const updateFieldType = (field: FormField, selectVal: string) => {
    if (selectVal === 'STATUS_OK_NOT_OK') {
      field.field_type = 'STATUS_TOGGLE';
      field.options = ['OK', 'NOT OK'];
    } else if (selectVal === 'STATUS_ON_OFF') {
      field.field_type = 'STATUS_TOGGLE';
      field.options = ['ON', 'OFF'];
    } else if (selectVal === 'STATUS_OPEN_CLOSE') {
      field.field_type = 'STATUS_TOGGLE';
      field.options = ['OPEN', 'CLOSE'];
    } else {
      field.field_type = selectVal as any;
      delete field.options;
    }
  };

  const addHeading = () => {
    const newHeading: FormHeading = {
      id: `h_${Date.now()}`,
      title: 'New Heading Section',
      subheadings: [],
      children: [],
    };
    setCustomHeadings([...customHeadings, newHeading]);
  };

  const addSubheading = (headingIdx: number) => {
    const newSub: FormSubheading = {
      id: `sub_${Date.now()}`,
      title: 'New Subheading',
      fixed_benchmark: '',
      children: [
        {
          id: `child_${Date.now()}`,
          label: 'Child Node / Equipment',
          fields: [
            {
              id: `f_${Date.now()}`,
              label: 'Reading Parameter',
              field_type: 'NUMBER',
              required: true,
              unit: '',
            }
          ]
        }
      ],
    };
    const updated = [...customHeadings];
    if (!updated[headingIdx].subheadings) updated[headingIdx].subheadings = [];
    updated[headingIdx].subheadings!.push(newSub);
    setCustomHeadings(updated);
  };

  const addChildToSubheading = (headingIdx: number, subIdx: number) => {
    const newChild: FormChild = {
      id: `child_${Date.now()}`,
      label: 'New Child Node',
      fields: [
        {
          id: `f_${Date.now()}`,
          label: 'Reading Parameter',
          field_type: 'NUMBER',
          required: true,
          unit: '',
        }
      ],
    };
    const updated = [...customHeadings];
    if (!updated[headingIdx].subheadings![subIdx].children) {
      updated[headingIdx].subheadings![subIdx].children = [];
    }
    updated[headingIdx].subheadings![subIdx].children.push(newChild);
    setCustomHeadings(updated);
  };

  const removeChild = (headingIdx: number, subIdx: number, childIdx: number) => {
    const updated = [...customHeadings];
    updated[headingIdx].subheadings![subIdx].children = updated[headingIdx].subheadings![subIdx].children.filter((_, idx) => idx !== childIdx);
    setCustomHeadings(updated);
  };

  const addFieldToChild = (child: FormChild) => {
    const newField: FormField = {
      id: `f_${Date.now()}`,
      label: 'New Reading Parameter',
      field_type: 'NUMBER',
      required: true,
      unit: '',
    };
    if (!child.fields) child.fields = [];
    child.fields.push(newField);
    setCustomHeadings([...customHeadings]);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);

    const schemaDefinition =
      formType === 'STANDARD'
        ? { fields: standardFields }
        : { headings: customHeadings };

    try {
      const payload: any = {
        title,
        description,
        form_type: formType,
        schema_definition: schemaDefinition,
      };
      if (code) payload.code = code;
      if (category) payload.category = category;

      const url = editingId ? `/api/forms/${editingId}` : '/api/forms';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save form template');

      setFeedback(`Form "${title}" successfully ${editingId ? 'updated' : 'created'}.`);
      setIsModalOpen(false);

      // Refresh list
      const refRes = await fetch('/api/forms');
      if (refRes.ok) setTemplates(await refRes.json());
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] pb-20 text-slate-800">
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
              <Sliders className="h-6 w-6 text-amber-600" />
              Dynamic Form Creation Engine
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure Standard Google-style forms or Custom multi-tier hierarchical checklists (Heading $\rightarrow$ Subheading $\rightarrow$ Children $\rightarrow$ Fields).
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Form
          </button>
        </div>

        {feedback && (
          <div className="mb-6 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback(null)}>
              <X className="h-4 w-4 text-emerald-600" />
            </button>
          </div>
        )}

        {/* Existing Templates Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span>Loading form templates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl) => (
              <div key={tmpl.id} className="facility-card p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {tmpl.form_type === 'CUSTOM' ? 'Hierarchical Checklist' : 'Standard Checklist'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      v{tmpl.version}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-1 font-serif">{tmpl.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {tmpl.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-end text-xs">
                  <button
                    onClick={() => openEditModal(tmpl)}
                    className="px-3 py-1.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-300 cursor-pointer"
                  >
                    <Edit className="h-3 w-3 text-amber-600" />
                    Configure Fields
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Builder Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="facility-card w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative bg-white border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">
                    {editingId ? `Edit Form: ${title}` : 'Create Dynamic Form Template'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define metadata and hierarchical field structure for field inspections.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSaveForm} className="space-y-5">
                {/* Basic Meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Form Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. Checklist Pompa"
                      className="w-full px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Form Type *
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as FormType)}
                      disabled={!!editingId}
                      className="w-full px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs disabled:opacity-50 focus:bg-white"
                    >
                      <option value="CUSTOM">Custom Form (Hierarchical)</option>
                      <option value="STANDARD">Standard Form (Flat/Google Style)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief inspection scope..."
                    className="w-full px-3 py-2 rounded bg-slate-50 border border-slate-300 text-slate-900 text-xs"
                  />
                </div>

                {/* FORM BUILDER CANVAS */}
                <div className="border-t border-slate-200 pt-4">
                  {formType === 'STANDARD' ? (
                    /* Standard Form Builder */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                          Standard Form Fields (Flat)
                        </h4>
                        <button
                          type="button"
                          onClick={addStandardField}
                          className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3 w-3" /> Add Field
                        </button>
                      </div>

                      {standardFields.map((f, i) => (
                        <div key={f.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2">
                          <input
                            type="text"
                            value={f.label}
                            onChange={(e) => {
                              const updated = [...standardFields];
                              updated[i].label = e.target.value;
                              setStandardFields(updated);
                            }}
                            placeholder="Field Label"
                            className="flex-1 px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900"
                          />
                          <select
                            value={getFieldSelectType(f)}
                            onChange={(e) => {
                              const updated = [...standardFields];
                              updateFieldType(updated[i], e.target.value);
                              setStandardFields(updated);
                            }}
                            className="px-2.5 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 font-medium"
                          >
                            <option value="NUMBER">Number (No limitation)</option>
                            <option value="STATUS_OK_NOT_OK">Toggle: OK / NOT OK</option>
                            <option value="STATUS_ON_OFF">Toggle: ON / OFF</option>
                            <option value="STATUS_OPEN_CLOSE">Toggle: OPEN / CLOSE</option>
                            <option value="TEXT">Text</option>
                          </select>
                          {f.field_type === 'STATUS_TOGGLE' ? (
                            <span className="text-[10px] font-bold px-2 py-1.5 rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                              {f.options?.join(' / ')}
                            </span>
                          ) : (
                            <input
                              type="text"
                              value={f.unit || ''}
                              onChange={(e) => {
                                const updated = [...standardFields];
                                updated[i].unit = e.target.value;
                                setStandardFields(updated);
                              }}
                              placeholder="Unit (V, Bar)"
                              className="w-20 px-2 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-900 font-mono"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setStandardFields(standardFields.filter((_, idx) => idx !== i));
                            }}
                            className="p-1.5 rounded text-rose-500 hover:bg-slate-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Custom Hierarchical Form Builder */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                            Custom Hierarchical Tree (Heading $\rightarrow$ Subheading $\rightarrow$ Children $\rightarrow$ Fields)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            According to SGH Checklist specifications.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={addHeading}
                          className="px-3 py-1.5 rounded bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add Heading Section
                        </button>
                      </div>

                      {customHeadings.map((h, hIdx) => (
                        <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                          {/* Heading Header */}
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 uppercase">
                                Heading Section
                              </span>
                              <input
                                type="text"
                                value={h.title}
                                onChange={(e) => {
                                  const updated = [...customHeadings];
                                  updated[hIdx].title = e.target.value;
                                  setCustomHeadings(updated);
                                }}
                                className="flex-1 px-2.5 py-1 rounded bg-white border border-slate-300 text-xs font-semibold text-slate-900"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => addSubheading(hIdx)}
                                className="px-2 py-1 rounded text-[11px] bg-amber-50 text-amber-800 border border-amber-300"
                              >
                                + Subheading
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomHeadings(customHeadings.filter((_, idx) => idx !== hIdx));
                                }}
                                className="p-1 rounded text-rose-500 hover:bg-slate-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subheadings in Heading */}
                          {h.subheadings?.map((sub, sIdx) => (
                            <div key={sub.id} className="ml-3 p-3 rounded-lg border border-slate-200 bg-white space-y-2 shadow-2xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 uppercase border border-amber-200">
                                    Subheading
                                  </span>
                                  <input
                                    type="text"
                                    value={sub.title}
                                    onChange={(e) => {
                                      const updated = [...customHeadings];
                                      updated[hIdx].subheadings![sIdx].title = e.target.value;
                                      setCustomHeadings(updated);
                                    }}
                                    className="flex-1 px-2 py-1 rounded bg-slate-50 border border-slate-300 text-xs text-amber-800 font-medium focus:bg-white"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => addChildToSubheading(hIdx, sIdx)}
                                    className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="h-3 w-3" /> Child Node
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...customHeadings];
                                      updated[hIdx].subheadings = updated[hIdx].subheadings!.filter((_, idx) => idx !== sIdx);
                                      setCustomHeadings(updated);
                                    }}
                                    className="p-1 rounded text-rose-500 hover:bg-slate-100 cursor-pointer"
                                    title="Delete Subheading"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-amber-700 shrink-0 font-semibold">Fixed Benchmark:</span>
                                <input
                                  type="text"
                                  value={sub.fixed_benchmark || ''}
                                  onChange={(e) => {
                                    const updated = [...customHeadings];
                                    updated[hIdx].subheadings![sIdx].fixed_benchmark = e.target.value;
                                    setCustomHeadings(updated);
                                  }}
                                  placeholder="e.g. Max Tolerance: 4.5 mm/s | 380V"
                                  className="flex-1 px-2 py-1 rounded bg-white border border-amber-300 text-xs text-amber-900"
                                />
                              </div>

                              {/* Children under Subheading */}
                              <div className="space-y-2 pl-2 border-l border-slate-200 pt-1">
                                {sub.children?.map((child, cIdx) => (
                                  <div key={child.id} className="p-2.5 rounded bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-semibold text-slate-500 uppercase">
                                        Child Node:
                                      </span>
                                      <input
                                        type="text"
                                        value={child.label}
                                        onChange={(e) => {
                                          const updated = [...customHeadings];
                                          updated[hIdx].subheadings![sIdx].children[cIdx].label = e.target.value;
                                          setCustomHeadings(updated);
                                        }}
                                        className="flex-1 px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-800 font-medium"
                                      />
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => addFieldToChild(child)}
                                          className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1 cursor-pointer font-medium"
                                        >
                                          <Plus className="h-2.5 w-2.5" /> Field
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeChild(hIdx, sIdx, cIdx)}
                                          className="p-1 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                                          title="Delete Child Node"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Fields */}
                                    <div className="space-y-1.5 pl-2">
                                      {child.fields?.map((field, fIdx) => (
                                        <div key={field.id} className="flex items-center gap-2 text-xs">
                                          <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => {
                                              const updated = [...customHeadings];
                                              updated[hIdx].subheadings![sIdx].children[cIdx].fields[fIdx].label = e.target.value;
                                              setCustomHeadings(updated);
                                            }}
                                            placeholder="Field name"
                                            className="flex-1 px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900"
                                          />
                                          <select
                                            value={getFieldSelectType(field)}
                                            onChange={(e) => {
                                              const updated = [...customHeadings];
                                              updateFieldType(updated[hIdx].subheadings![sIdx].children[cIdx].fields[fIdx], e.target.value);
                                              setCustomHeadings(updated);
                                            }}
                                            className="px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 font-medium"
                                          >
                                            <option value="NUMBER">Number (No limitation)</option>
                                            <option value="STATUS_OK_NOT_OK">Toggle: OK / NOT OK</option>
                                            <option value="STATUS_ON_OFF">Toggle: ON / OFF</option>
                                            <option value="STATUS_OPEN_CLOSE">Toggle: OPEN / CLOSE</option>
                                            <option value="TEXT">Text</option>
                                          </select>
                                          {field.field_type === 'STATUS_TOGGLE' ? (
                                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                              {field.options?.join(' / ')}
                                            </span>
                                          ) : (
                                            <input
                                              type="text"
                                              value={field.unit || ''}
                                              onChange={(e) => {
                                                const updated = [...customHeadings];
                                                updated[hIdx].subheadings![sIdx].children[cIdx].fields[fIdx].unit = e.target.value;
                                                setCustomHeadings(updated);
                                              }}
                                              placeholder="Unit (V, Bar)"
                                              className="w-16 px-2 py-1 rounded bg-white border border-slate-300 text-xs text-slate-900 font-mono"
                                            />
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = [...customHeadings];
                                              updated[hIdx].subheadings![sIdx].children[cIdx].fields = updated[hIdx].subheadings![sIdx].children[cIdx].fields.filter((_, idx) => idx !== fIdx);
                                              setCustomHeadings(updated);
                                            }}
                                            className="p-1 rounded text-rose-500 hover:bg-slate-100"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}

                                {(!sub.children || sub.children.length === 0) ? (
                                  <div className="p-3 rounded-lg border border-dashed border-slate-300 text-center bg-slate-50/60">
                                    <p className="text-[11px] text-slate-500 mb-2">No child nodes under this subheading yet.</p>
                                    <button
                                      type="button"
                                      onClick={() => addChildToSubheading(hIdx, sIdx)}
                                      className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" /> Add Child Node
                                    </button>
                                  </div>
                                ) : (
                                  <div className="pt-1">
                                    <button
                                      type="button"
                                      onClick={() => addChildToSubheading(hIdx, sIdx)}
                                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                                    >
                                      <Plus className="h-3 w-3" /> Add Another Child Node
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg btn-gold font-bold text-xs flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Saving Template...
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        Save Form Template
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
