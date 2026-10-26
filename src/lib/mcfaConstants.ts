export interface McfaRow {
  id: string;
  lantai: string;
  zone: string;
  penyebab: string;
  penanganan: string;
  status: string;
}

export interface McfaSection {
  id: 'fire' | 'fault';
  title: string;
  defaultLabel: string;
  rowCount: number;
}

export const MCFA_SECTIONS: McfaSection[] = [
  {
    id: 'fire',
    title: 'CEK HISTORY FIRE',
    defaultLabel: 'CEK HISTORY FIRE',
    rowCount: 6,
  },
  {
    id: 'fault',
    title: 'CEK HISTORY FAULT',
    defaultLabel: 'CEK HISTORY FAULT',
    rowCount: 6,
  },
];

export const MCFA_STATUS_OPTIONS = [
  'NORMAL',
  'STANDBY',
  'RESOLVED',
  'MONITORING',
  'TROUBLE',
  'FAULT',
  'ALARM',
];

export const MCFA_CHECKLIST_CODE = 'CHK-MCFA-ANN';
export const MCFA_CHECKLIST_TITLE = 'CHEKLIST OPERASIONAL MCFA & ANNUNCIATOR';
export const MCFA_LAYOUT = 'TABLE_CHEKLIST_MCFA';
