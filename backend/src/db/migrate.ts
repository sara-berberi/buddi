// Runs the versioned Schema + Dati SQL files against DATABASE_URL, in order.
//   npm run migrate   -> schema only
//   npm run seed      -> schema + seed data
//
// Every schema/seed file is idempotent (IF NOT EXISTS / ADD COLUMN IF NOT
// EXISTS / ON CONFLICT), so this is safe to re-run.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../'); // backend/src/db -> repo root

// Applied in order. Add new versions to the end; never edit old files.
const SCHEMA_FILES = [
  ['Schema', '1.1.0', 'create_tables.sql'],
  ['Schema', '1.2.0', 'alter_tables.sql'],
  ['Schema', '1.3.0', 'create_tables.sql'],
  ['Schema', '1.4.0', 'alter_tables.sql'],
];
const SEED_FILES = [['Dati', '1.1.0', 'seed.sql']];

async function runFile(label: string, parts: string[]): Promise<void> {
  const path = resolve(repoRoot, ...parts);
  const sql = readFileSync(path, 'utf8');
  console.log(`[migrate] running ${label}: ${parts.join('/')}`);
  await pool.query(sql);
  console.log(`[migrate] ${label} done`);
}

async function main(): Promise<void> {
  const withSeed = process.argv.includes('--seed');
  for (const f of SCHEMA_FILES) await runFile('schema', f);
  if (withSeed) {
    for (const f of SEED_FILES) await runFile('seed', f);
  }
  console.log('[migrate] complete');
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
