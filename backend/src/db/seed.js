import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { pool } from './index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function seed() {
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8');
  const data   = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
  await pool.query(schema);
  await pool.query(data);
  console.log('DB seeded successfully.');
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
