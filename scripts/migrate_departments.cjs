require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runDepartmentMigration() {
  const client = await pool.connect();
  console.log('🚀 Connected to NeonDB for Department Migration...');

  try {
    await client.query('BEGIN');

    // 1. Create departments table
    console.log('📦 Creating departments table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_by UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_departments_code ON departments (code);
      CREATE INDEX IF NOT EXISTS idx_departments_active ON departments (is_active);
    `);

    // 2. Add department_id to users table
    console.log('🔗 Adding department_id to users...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
      CREATE INDEX IF NOT EXISTS idx_users_department_id ON users (department_id);
    `);

    // 3. Create department_forms junction table
    console.log('🔗 Creating department_forms junction table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS department_forms (
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (department_id, template_id)
      );
      CREATE INDEX IF NOT EXISTS idx_dept_forms_dept ON department_forms (department_id);
      CREATE INDEX IF NOT EXISTS idx_dept_forms_template ON department_forms (template_id);
    `);

    // 4. Seed initial standard SGH Tower departments if empty
    const countRes = await client.query(`SELECT COUNT(*) FROM departments;`);
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial departments...');
      const adminRes = await client.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;`);
      const adminId = adminRes.rows[0]?.id || null;

      const deptRes = await client.query(`
        INSERT INTO departments (code, name, description, is_active, created_by)
        VALUES 
          ('MECH', 'Mechanical & Plumbing', 'Pumps, water supply, gas piping, and diesel generator infrastructure', true, $1),
          ('ELEC', 'Electrical & Power Systems', 'Substation PLN, panels, transformers, and emergency lighting', true, $1),
          ('HVAC', 'HVAC & Air Conditioning', 'Daikin ITM central chillers, cooling towers, and FCU units', true, $1),
          ('SAFETY', 'Fire & Life Safety', 'MCFA fire alarm annunciators, hydrants, and evacuation paging', true, $1),
          ('LIFT', 'Vertical Transport', 'Passenger, service lifts, and escalator maintenance', true, $1)
        RETURNING id, code;
      `, [adminId]);

      const deptMap = {};
      deptRes.rows.forEach(r => { deptMap[r.code] = r.id; });

      // Assign SPV Andi to MECH
      if (deptMap['MECH']) {
        await client.query(`
          UPDATE users SET department_id = $1 WHERE username = 'spv_andi';
        `, [deptMap['MECH']]);
        console.log('Assigned spv_andi to MECH department');
      }

      // Assign tech_budi to MECH, tech_siti to ELEC
      if (deptMap['MECH']) {
        await client.query(`
          UPDATE users SET department_id = $1 WHERE username = 'tech_budi';
        `, [deptMap['MECH']]);
      }
      if (deptMap['ELEC']) {
        await client.query(`
          UPDATE users SET department_id = $1 WHERE username = 'tech_siti';
        `, [deptMap['ELEC']]);
      }

      // Assign initial forms to departments
      const tmplRes = await client.query(`SELECT id, code FROM form_templates;`);
      for (const tmpl of tmplRes.rows) {
        let targetDept = null;
        if (tmpl.code === 'CHK-POMPA' || tmpl.code === 'CHK-GAS') targetDept = deptMap['MECH'];
        else if (tmpl.code === 'CHK-PLN' || tmpl.code === 'CHK-ACCESS') targetDept = deptMap['ELEC'];
        else if (tmpl.code === 'CHK-ITM-DAIKIN') targetDept = deptMap['HVAC'];
        else if (tmpl.code === 'CHK-MCFA' || tmpl.code === 'CHK-PAGING') targetDept = deptMap['SAFETY'];
        else if (tmpl.code === 'CHK-LIFT') targetDept = deptMap['LIFT'];

        if (targetDept) {
          await client.query(`
            INSERT INTO department_forms (department_id, template_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING;
          `, [targetDept, tmpl.id]);
        }
      }
      console.log('Assigned operational templates to departments.');
    }

    await client.query('COMMIT');
    console.log('✅ Department Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runDepartmentMigration();
