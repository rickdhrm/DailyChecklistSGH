const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const PUMP_LOGSHEET_ITEMS = [
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

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('1. Clearing references to existing templates...');
    await client.query('UPDATE assets SET default_template_id = NULL');
    await client.query('DELETE FROM department_forms');
    await client.query('DELETE FROM form_submissions');
    await client.query('DELETE FROM form_templates');
    console.log('Cleared all existing templates and old submissions.');

    console.log('2. Preparing SGH TOWER Daily Logsheet Pompa-Pompa Gedung schema...');
    
    // Generate headings and children representation for schema_definition
    const headings = [
      {
        id: 'h_logsheet_pompa',
        title: 'DAILY LOGSHEET POMPA-POMPA GEDUNG',
        is_collapsible: false,
        subheadings: [
          {
            id: 'sub_all_pumps',
            title: 'Equipment & Parameters Matrix',
            children: PUMP_LOGSHEET_ITEMS.map(item => ({
              id: `c_${item.id}`,
              label: item.name,
              fields: [
                { id: `${item.id}_arus_r`, label: `${item.name} - Arus Standby R`, field_type: 'NUMBER', unit: 'A' },
                { id: `${item.id}_arus_s`, label: `${item.name} - Arus Standby S`, field_type: 'NUMBER', unit: 'A' },
                { id: `${item.id}_arus_t`, label: `${item.name} - Arus Standby T`, field_type: 'NUMBER', unit: 'A' },
                { id: `${item.id}_volt_r`, label: `${item.name} - Volt Standby R`, field_type: 'NUMBER', unit: 'V' },
                { id: `${item.id}_volt_s`, label: `${item.name} - Volt Standby S`, field_type: 'NUMBER', unit: 'V' },
                { id: `${item.id}_volt_t`, label: `${item.name} - Volt Standby T`, field_type: 'NUMBER', unit: 'V' },
                { id: `${item.id}_switch`, label: `${item.name} - Switch Position`, field_type: 'STATUS_TOGGLE', options: ['MANUAL', 'AUTO', 'OFF'] },
                { id: `${item.id}_pres_suction`, label: `${item.name} - Pressure Suction`, field_type: 'NUMBER', unit: 'Bar' },
                { id: `${item.id}_pres_discharge`, label: `${item.name} - Pressure Discharge`, field_type: 'NUMBER', unit: 'Bar' },
                { id: `${item.id}_body_temp`, label: `${item.name} - Body Temperature`, field_type: 'NUMBER', unit: '°C' },
                { id: `${item.id}_gate_valve`, label: `${item.name} - Gate Valve`, field_type: 'STATUS_TOGGLE', options: ['OPEN', 'CLOSE'] }
              ]
            }))
          }
        ]
      }
    ];

    const schemaDefinition = {
      type: 'CUSTOM',
      layout: 'TABLE_LOGSHEET_POMPA',
      form_code: 'FR-POMPA-001',
      document_owner: 'PT.MUTIARA PROKLAMASI SEJAHTERA',
      building_name: 'GEDUNG SGH TOWER',
      items: PUMP_LOGSHEET_ITEMS,
      headings
    };

    console.log('3. Inserting single new official form template...');
    const adminUser = await client.query("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1");
    const adminId = adminUser.rows[0]?.id;

    const insertRes = await client.query(`
      INSERT INTO form_templates (
        code,
        title,
        description,
        category,
        form_type,
        version,
        is_active,
        schema_definition,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      ) RETURNING id, code, title
    `, [
      'SGH-LOG-POMPA',
      'DAILY LOGSHEET POMPA-POMPA GEDUNG',
      'Official Daily Logsheet Pompa-Pompa Gedung SGH Tower (PT. Mutiara Proklamasi Sejahtera)',
      'Mechanical & Plumbing',
      'CUSTOM',
      1,
      true,
      JSON.stringify(schemaDefinition),
      adminId
    ]);

    const newTemplate = insertRes.rows[0];
    console.log('Created template:', newTemplate.id, newTemplate.title, newTemplate.code);

    console.log('4. Assigning new form to all departments...');
    const depts = await client.query('SELECT id, name FROM departments WHERE is_active = true');
    for (const d of depts.rows) {
      await client.query(
        'INSERT INTO department_forms (department_id, template_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [d.id, newTemplate.id]
      );
      console.log(`- Assigned to department: ${d.name}`);
    }

    await client.query('COMMIT');
    console.log('MIGRATION COMPLETE! Only 1 official form template now exists.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
