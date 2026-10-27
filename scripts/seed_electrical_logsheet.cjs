const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TEMPLATE_ID = 'f4a84567-89ab-4cde-a444-d0f05e9f0005';
const TEMPLATE_CODE = 'LOG-ELEC-MONTHLY';
const TEMPLATE_TITLE = 'Log Sheet Electrical';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Seeding Monthly Log Sheet Electrical template...');

    // 1. Insert or update form_template
    await client.query(`
      INSERT INTO form_templates (
        id, code, title, description, category, form_type, version, schema_definition, is_active, updated_at
      ) VALUES (
        $1, $2, $3,
        'Pencatatan harian meter listrik PLN depan gardu, genset, PDAM, Cap Bank, dan Trafo per bulan (31 hari).',
        'Electrical',
        'CUSTOM',
        1,
        $4,
        true,
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        schema_definition = EXCLUDED.schema_definition,
        is_active = true,
        updated_at = NOW();
    `, [
      TEMPLATE_ID,
      TEMPLATE_CODE,
      TEMPLATE_TITLE,
      JSON.stringify({
        type: 'CUSTOM',
        layout: 'TABLE_ELECTRICAL_MONTHLY',
        form_code: 'LOG-ELEC-001',
        building_name: 'GEDUNG SGH TOWER',
        document_owner: 'PT. MUTIARA PROKLAMASI SEJAHTERA',
      })
    ]);

    // Also handle code conflict if different ID
    await client.query(`
      UPDATE form_templates 
      SET schema_definition = jsonb_set(COALESCE(schema_definition, '{}'::jsonb), '{layout}', '"TABLE_ELECTRICAL_MONTHLY"')
      WHERE code = $1
    `, [TEMPLATE_CODE]);

    console.log(`✓ Template ${TEMPLATE_CODE} (${TEMPLATE_TITLE}) ensured.`);

    // 2. Link to Engineering (ENG) department
    const deptRes = await client.query(`SELECT id FROM departments WHERE code = 'ENG' LIMIT 1`);
    if (deptRes.rowCount > 0) {
      const engDeptId = deptRes.rows[0].id;
      await client.query(`
        INSERT INTO department_forms (department_id, template_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [engDeptId, TEMPLATE_ID]);
      console.log('✓ Linked to Engineering department.');
    }

    // 3. Ensure a location for Electrical / Gardu PLN
    let locRes = await client.query(`SELECT id FROM locations WHERE code = 'LOC-ELEC-GARDU' OR name ILIKE '%Gardu%' OR name ILIKE '%Electrical%' LIMIT 1`);
    if (locRes.rowCount === 0) {
      const newLoc = await client.query(`
        INSERT INTO locations (name, code, floor, building)
        VALUES ('Ruang Panel Utama & Gardu PLN', 'LOC-ELEC-GARDU', 'GF', 'SGH Tower')
        RETURNING id
      `);
      console.log('✓ Created location: Ruang Panel Utama & Gardu PLN');
    }

    await client.query('COMMIT');
    console.log('All steps completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding electrical logsheet:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
