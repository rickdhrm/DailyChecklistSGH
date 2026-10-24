export interface PumpLogsheetItem {
  id: string;
  name: string;
  type: 
    | 'standard'
    | 'battery_volt'
    | 'battery_amp'
    | 'electrical'
    | 'clean_water_pressure'
    | 'percentage'
    | 'wlc_position'
    | 'roof_fire_pressure';
}

export const PUMP_LOGSHEET_ITEMS: PumpLogsheetItem[] = [
  { id: 'jockey_pump', name: 'JOCKEY PUMP', type: 'standard' },
  { id: 'electric_fire_pump', name: 'ELECTRIC FIRE PUMP', type: 'standard' },
  { id: 'diesel_fire_pump', name: 'DIESEL FIRE PUMP', type: 'standard' },
  { id: 'battery_accu', name: 'BATTERY ACCU', type: 'battery_volt' },
  { id: 'amper_accu', name: 'AMPER ACCU', type: 'battery_amp' },
  { id: 'charger_accu', name: 'CHARGER ACCU', type: 'electrical' },
  { id: 'room_exhaust_fan', name: 'ROOM EXHAUST FAN', type: 'electrical' },
  { id: 'transfer_pump_1', name: 'TRANSFER PUMP 1', type: 'standard' },
  { id: 'transfer_pump_2', name: 'TRANSFER PUMP 2', type: 'standard' },
  { id: 'tekanan_air_bersih', name: 'TEKANAN AIR BERSIH RUANG POMPA', type: 'clean_water_pressure' },
  { id: 'recycle_pump_1', name: 'RECYCLE PUMP 1', type: 'standard' },
  { id: 'pompa_stp_1', name: 'POMPA STP 1', type: 'standard' },
  { id: 'pompa_stp_2', name: 'POMPA STP 2', type: 'standard' },
  { id: 'boiler_stp', name: 'BOILER STP', type: 'standard' },
  { id: 'exhaust_stp_1', name: 'EXHAUST STP 1', type: 'standard' },
  { id: 'exhaust_stp_2', name: 'EXHAUST STP 2', type: 'standard' },
  { id: 'swp_1', name: 'SWP 1', type: 'standard' },
  { id: 'swp_2', name: 'SWP 2', type: 'standard' },
  { id: 'swp_3', name: 'SWP 3', type: 'standard' },
  { id: 'swp_4', name: 'SWP 4', type: 'standard' },
  { id: 'swp_5', name: 'SWP 5', type: 'standard' },
  { id: 'booster_pump_1', name: 'BOOSTER PUMP 1 ( ROOF)', type: 'standard' },
  { id: 'booster_pump_2', name: 'BOOSTER PUMP 2 (ROOF)', type: 'standard' },
  { id: 'kapasitas_ground_tank', name: 'KAPASITAS AIR GROUND TANK (%)', type: 'percentage' },
  { id: 'kapasitas_roof_tank', name: 'KAPASITAS AIR ROOF TANK ( %)', type: 'percentage' },
  { id: 'posisi_wlc_ground', name: 'POSISI WLC GROUND TANK', type: 'wlc_position' },
  { id: 'tekanan_pemadam_roof', name: 'TEKANAN AIR PEMADAM DI ROOF', type: 'roof_fire_pressure' }
];
