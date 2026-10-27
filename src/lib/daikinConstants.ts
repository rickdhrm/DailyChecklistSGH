export interface DaikinFloorItem {
  id: string;
  name: string;
  defaultStatus: 'ON' | 'OFF';
  defaultTemperature: string;
  defaultKeterangan: string;
}

export const DAIKIN_FLOOR_ITEMS: DaikinFloorItem[] = [
  {
    id: 'lantai_10',
    name: 'LANTAI 10',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_9',
    name: 'LANTAI 9',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_8',
    name: 'LANTAI 8',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_7',
    name: 'LANTAI 7',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_6',
    name: 'LANTAI 6',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_5',
    name: 'LANTAI 5',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_4',
    name: 'LANTAI 4',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_3',
    name: 'LANTAI 3',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_2',
    name: 'LANTAI 2',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'lantai_1',
    name: 'LANTAI 1',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Suhu Sejuk',
  },
  {
    id: 'groundfloor',
    name: 'GROUNDFLOOR',
    defaultStatus: 'ON',
    defaultTemperature: '24',
    defaultKeterangan: 'Normal - Lobby Sejuk',
  },
];

export const DAIKIN_CHECKLIST_CODE = 'CHK-ITM-DAIKIN';
export const DAIKIN_CHECKLIST_TITLE = 'PANEL ITM DAIKIN';
export const DAIKIN_LAYOUT = 'TABLE_ITM_DAIKIN';
