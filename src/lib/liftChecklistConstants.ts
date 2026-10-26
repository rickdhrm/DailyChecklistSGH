export interface LiftChecklistItem {
  id: string;
  name: string;
}

export interface LiftGroup {
  id: string;
  label: string;
  items: LiftChecklistItem[];
}

export const LIFT_GROUPS: LiftGroup[] = [
  {
    id: 'p1',
    label: 'P1',
    items: [
      { id: 'p1_lift', name: 'Lift' },
      { id: 'p1_acces_card', name: 'Acces card' },
      { id: 'p1_exhaust', name: 'EXHAUST' },
      { id: 'p1_interphone', name: 'Interphone' },
      { id: 'p1_penerangan', name: 'Penerangan' },
    ],
  },
  {
    id: 'p2',
    label: 'P2',
    items: [
      { id: 'p2_lift', name: 'Lift' },
      { id: 'p2_acces_card', name: 'Acces card' },
      { id: 'p2_exhaust', name: 'EXHAUST' },
      { id: 'p2_interphone', name: 'Interphone' },
      { id: 'p2_penerangan', name: 'Penerangan' },
    ],
  },
  {
    id: 'hl_rps',
    label: 'HOME LIFT RPS',
    items: [
      { id: 'hl_lift', name: 'Lift' },
      { id: 'hl_acces_card', name: 'Acces card' },
      { id: 'hl_exhaust', name: 'EXHAUST' },
      { id: 'hl_interphone', name: 'Interphone' },
      { id: 'hl_penerangan', name: 'Penerangan' },
    ],
  },
  {
    id: 'escalator',
    label: 'ESCALATOR',
    items: [
      { id: 'esc_naik_gf', name: 'NAIK GF' },
      { id: 'esc_turun_gf', name: 'TURUN GF' },
    ],
  },
  {
    id: 'service',
    label: 'SERVICE',
    items: [
      { id: 'srv_lift', name: 'Lift' },
      { id: 'srv_acces_card', name: 'Acces card' },
      { id: 'srv_ac', name: 'AC' },
      { id: 'srv_interphone', name: 'Interphone' },
      { id: 'srv_penerangan', name: 'Penerangan' },
    ],
  },
];

export interface ComputerLiftItem {
  id: string;
  name: string;
}

export const COMPUTER_LIFT_ITEMS: ComputerLiftItem[] = [
  { id: 'komp_pl1', name: 'Komunikasi PL-1' },
  { id: 'komp_pl2', name: 'Komunikasi PL-2' },
  { id: 'komp_sl1', name: 'Komunikasi SL-1' },
  { id: 'komp_hl', name: 'Komunikasi HL' },
];

export const LIFT_CHECKLIST_CODE = 'CHK-LIFT-OPS';
export const LIFT_CHECKLIST_TITLE = 'CHEKLIST OPERASIONAL LIFT';
export const LIFT_LAYOUT = 'TABLE_CHEKLIST_LIFT';
