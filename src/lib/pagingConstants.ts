export interface PagingEquipmentItem {
  id: string;
  name: string;
  defaultStatus: 'ON' | 'OFF';
  defaultTestSound1: 'OK' | 'NOT OK' | '-';
  defaultPosisi: string;
  defaultTestSound2: 'OK' | 'NOT OK' | '-';
  description?: string;
}

export const PAGING_EQUIPMENT_ITEMS: PagingEquipmentItem[] = [
  {
    id: 'fm_tuner',
    name: 'FM TUNER',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'NORMAL',
    defaultTestSound2: 'OK',
  },
  {
    id: 'pre_amp',
    name: 'PRE-AMP',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'NORMAL',
    defaultTestSound2: 'OK',
  },
  {
    id: 'equalizer',
    name: 'EQUALIZER',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'FLAT / NORMAL',
    defaultTestSound2: 'OK',
  },
  {
    id: 'amplifier_1',
    name: 'AMPLIFIER 1',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'STANDBY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'amplifier_2',
    name: 'AMPLIFIER 2',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'STANDBY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'amplifier_3_car_call',
    name: 'AMPLIFIER 3/ CAR CALL',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'STANDBY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'paging_mic_test',
    name: 'PAGING MIC TEST',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'READY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'paging_evacuation_test',
    name: 'PAGING EVACUATION TEST',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'READY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'car_call_test_lobby',
    name: 'CAR CALL TEST LOBBY',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'READY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'paging_test_evacuation_test',
    name: 'PAGGING TEST EVACUATIIN TEST',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'READY',
    defaultTestSound2: 'OK',
  },
  {
    id: 'ups',
    name: 'UPS',
    defaultStatus: 'ON',
    defaultTestSound1: 'OK',
    defaultPosisi: 'ONLINE / NORMAL',
    defaultTestSound2: 'OK',
  },
];

export const PAGING_STATUS_ON_OFF_OPTIONS = ['ON', 'OFF'] as const;
export const PAGING_TEST_SOUND_OPTIONS = ['OK', 'NOT OK', '-'] as const;

export const PAGING_CHECKLIST_CODE = 'CHK-PAGING-EVAC';
export const PAGING_CHECKLIST_TITLE = 'OPERASIONAL PANEL PAGING EVAKUASI';
export const PAGING_LAYOUT = 'TABLE_PAGING_EVAKUASI';
