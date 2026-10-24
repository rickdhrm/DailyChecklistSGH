require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const gasSections = [
  {
    code: 'a',
    title: 'A. AREA TABUNG LPG',
    items: [
      'Tabung dalam kondisi baik.',
      'Tidak terdapat penyok/kerusakan berat.',
      'Tidak terdapat korosi berlebihan.',
      'Tidak terdapat indikasi kebocoran.',
      'Valve tabung dalam kondisi baik.',
      'Tabung berdiri/terpasang sesuai sistem penempatannya.',
      'Tabung terlindung dari benturan.',
      'Area bebas sumber api.',
      'Area bebas rokok.',
      'Tidak ada barang yang tidak berkaitan dengan LPG.',
      'Ventilasi area baik.',
      'Akses menuju tabung tidak terhalang.'
    ]
  },
  {
    code: 'b',
    title: 'B. MANIFOLD DAN VALVE',
    items: [
      'Manifold tidak mengalami kerusakan.',
      'Sambungan tidak menunjukkan indikasi kebocoran.',
      'Valve dapat dioperasikan.',
      'Valve diberi identifikasi.',
      'Tidak terdapat korosi berat.',
      'Tidak terdapat modifikasi tidak resmi',
      'Kondisi fitting baik.'
    ]
  },
  {
    code: 'c',
    title: 'C. VAPORIZER',
    items: [
      'Kondisi fisik baik.',
      'Tidak terdapat kebocoran.',
      'Tidak terdapat suara/getaran abnormal.',
      'Sambungan baik.',
      'Pressure/indikator dalam kondisi normal sesuai spesifikasi.',
      'Tidak terdapat kerusakan komponen.',
      'Area sekitar vaporizer bersih.',
      'Tidak ada sumber api.',
      'Sistem pengaman vaporizer dalam kondisi baik.'
    ]
  },
  {
    code: 'e',
    title: 'E. PIPA DAN FITTING',
    items: [
      'Pipa tidak rusak.',
      'Tidak terdapat korosi berat.',
      'Tidak terdapat kebocoran.',
      'Support pipa dalam kondisi baik.',
      'Fitting tidak longgar.',
      'Tidak ada modifikasi tanpa izin.',
      'Jalur pipa tidak terhalang.'
    ]
  },
  {
    code: 'f',
    title: 'F. SISTEM KESELAMATAN',
    items: [
      'APAR tersedia.',
      'APAR mudah diakses.',
      'APAR tidak terhalang.',
      'APAR masih dalam masa pemeriksaan.',
      'Rambu DILARANG MEROKOK tersedia.',
      'Rambu BAHAYA GAS tersedia.',
      'Emergency contact tersedia.',
      'Gas detector berfungsi',
      'Alarm berfungsi',
      'Ventilasi baik.'
    ]
  },
  {
    code: 'g',
    title: 'G. AREA KITCHEN TENANT',
    items: [
      'Tidak terdapat bau gas.',
      'Seluruh peralatan gas dalam kondisi baik.',
      'Burner berfungsi normal.',
      'Valve peralatan berfungsi.',
      'Tidak terdapat selang/fitting rusak.',
      'Tidak terdapat grease berlebihan.',
      'Tidak ada api terbuka yang tidak diperlukan.',
      'Peralatan gas tidak ditinggalkan tanpa pengawasan.',
      'Valve ditutup setelah operasional.'
    ]
  },
  {
    code: 'h',
    title: 'H. ADMINISTRASI',
    items: [
      'Checklist sebelumnya tersedia.',
      'Maintenance terakhir tercatat.',
      'Laporan gangguan telah ditindaklanjuti.',
      'Dokumen vendor tersedia.',
      'Dokumen pemeriksaan tersedia.',
      'Personel pengguna telah mendapatkan briefing.',
      'Tidak terdapat pekerjaan/modifikasi tanpa izin.'
    ]
  }
];

const headings = gasSections.map((sec, secIdx) => ({
  id: `heading_${sec.code}`,
  title: sec.title,
  order_index: secIdx + 1,
  children: [
    {
      id: `child_${sec.code}`,
      label: `${sec.title} Items`,
      order_index: 1,
      fields: sec.items.map((itemText, itemIdx) => {
        const itemNo = itemIdx + 1;
        return {
          id: `gas_${sec.code}_${itemNo}`,
          label: `${itemNo}. ${itemText}`,
          field_type: 'STATUS_TOGGLE',
          options: ['GOOD', 'BAD'],
          required: false,
          unit: null,
          order_index: itemNo
        };
      })
    }
  ]
}));

const schemaDefinition = {
  form_code: 'FR-LO-005',
  revisi: '00',
  tanggal_dokumen: '26 Agustus 2026',
  halaman: '1 dari 1',
  layout: 'TABLE_GAS_CHECKLIST',
  headings: headings
};

async function seedGasChecklist() {
  const client = await pool.connect();
  console.log('🚀 Connecting to NeonDB...');

  try {
    await client.query('BEGIN');

    // 1. Get an Admin user ID to set as creator
    const adminRes = await client.query(`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1;`);
    const adminId = adminRes.rows[0]?.id || null;

    // 2. Insert or update the template
    console.log('📝 Upserting FR-LO-005 template...');
    const templateRes = await client.query(`
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
        'FR-LO-005',
        'CHECKLIST INSPEKSI GAS LPG SENTRAL',
        'Formulir Checklist Inspeksi Harian Gas LPG Sentral (Sesuai Standar Form FR-LO-005 Rev. 00)',
        'Mechanical & Plumbing',
        'CUSTOM',
        1,
        TRUE,
        $1,
        $2
      )
      ON CONFLICT (code, version) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        category = EXCLUDED.category,
        form_type = EXCLUDED.form_type,
        schema_definition = EXCLUDED.schema_definition,
        is_active = TRUE,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, code, title;
    `, [JSON.stringify(schemaDefinition), adminId]);

    const templateId = templateRes.rows[0].id;
    console.log(`✅ Template created/updated: ${templateRes.rows[0].title} (ID: ${templateId})`);

    // 3. Assign this form to departments (Engineering, Fire & Safety, Mechanical & Plumbing)
    console.log('🏢 Linking template to relevant departments...');
    const deptsRes = await client.query(`
      SELECT id, code, name FROM departments 
      WHERE code IN ('ENG', 'SAFETY', 'MECH') OR code = 'MECH';
    `);

    for (const dept of deptsRes.rows) {
      await client.query(`
        INSERT INTO department_forms (department_id, template_id)
        VALUES ($1, $2)
        ON CONFLICT (department_id, template_id) DO NOTHING;
      `, [dept.id, templateId]);
      console.log(`   🔗 Linked to department: ${dept.name} (${dept.code})`);
    }

    await client.query('COMMIT');
    console.log('🎉 Gas Checklist seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding gas checklist:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedGasChecklist();
