const http = require('http');

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://localhost:3000${path}`,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          const cookies = res.headers['set-cookie'] || [];
          resolve({ status: res.statusCode, headers: res.headers, cookies, data: parsed });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function extractSessionCookie(cookies) {
  for (const c of cookies) {
    if (c.startsWith('sgh_session=')) {
      return c.split(';')[0];
    }
  }
  return '';
}

async function run() {
  console.log('--- TESTING FORM CREATION WITHOUT CODE AND CATEGORY ---');

  // 1. Admin login
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'SGHAdmin2026!' },
  });
  const adminCookie = extractSessionCookie(adminLogin.cookies);

  // 2. Create form with ONLY title, description, form_type, and schema_definition (NO code, NO category)
  console.log('\n2. Creating form without code and without category...');
  const createRes = await request('/api/forms', {
    method: 'POST',
    headers: { Cookie: adminCookie },
    body: {
      title: 'Water Tank Level Test',
      description: 'Daily roof reservoir and basement raw water tank level inspections.',
      form_type: 'STANDARD',
      schema_definition: {
        fields: [
          { id: 'f1', label: 'Tank Water Level', field_type: 'NUMBER', unit: '%', required: true }
        ]
      }
    }
  });

  console.log('Create form status:', createRes.status);
  console.log('Returned form:', {
    id: createRes.data.id,
    title: createRes.data.title,
    code: createRes.data.code,
    category: createRes.data.category,
    form_type: createRes.data.form_type
  });

  const success = createRes.status === 201 && !!createRes.data.id && !!createRes.data.code;
  console.log('Form creation without code and category:', success ? 'PASS' : 'FAIL');

  // 3. Clean up
  if (createRes.data.id) {
    require('dotenv').config();
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    await client.query(`DELETE FROM form_templates WHERE id = $1`, [createRes.data.id]);
    await client.end();
    console.log('Cleaned up test form.');
  }

  process.exit(success ? 0 : 1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
