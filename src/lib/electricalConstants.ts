export interface ElectricalDayEntry {
  tgl: number; // 1 to 31
  jam?: string;
  power_faktor?: string | number;
  kv?: string | number;
  kwh_wbp?: string | number;
  kwh_lwbp_1?: string | number;
  total_kwh?: string | number;
  total_kvarh?: string | number;
  kwh_genset?: string | number;
  pdam?: string | number;
  ats_status?: 'AUTO' | 'MANUAL' | '';
  step_cap_bank?: string | number;
  cos_pi_cap_bank?: string | number;
  step_trafo?: string | number;
  level_oli_trafo?: 'H' | 'M' | 'L' | '';
  dicek_oleh?: string;
}

export const ELECTRICAL_CHECKLIST_CODE = 'LOG-ELEC-MONTHLY';
export const ELECTRICAL_CHECKLIST_TITLE = 'LOG SHEET ELECTRICAL';
export const ELECTRICAL_LAYOUT = 'TABLE_ELECTRICAL_MONTHLY';
export const ELECTRICAL_TEMPLATE_ID = 'f4a84567-89ab-4cde-a444-d0f05e9f0005';

export const ATS_OPTIONS = ['AUTO', 'MANUAL'] as const;
export const OLI_TRAFO_OPTIONS = ['H', 'M', 'L'] as const;

export const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Helper to get days in month
export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

// Calculate Total KWH = WBP + LWBP
export function calculateTotalKwh(wbp: string | number | undefined, lwbp: string | number | undefined): string {
  const numWbp = parseFloat(String(wbp || '0').replace(',', '.'));
  const numLwbp = parseFloat(String(lwbp || '0').replace(',', '.'));
  if (isNaN(numWbp) && isNaN(numLwbp)) return '';
  const sum = (isNaN(numWbp) ? 0 : numWbp) + (isNaN(numLwbp) ? 0 : numLwbp);
  return sum === 0 && !wbp && !lwbp ? '' : sum.toFixed(1);
}
