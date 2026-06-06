// Runs the versioned Schema + Dati SQL files against DATABASE_URL.
//   npm run migrate   -> schema only
//   npm run seed      -> schema + seed data
//
// Both the schema and seed files are idempotent (IF NOT EXISTS / ON CONFLICT),
// so this is safe to re-run.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { pool } from './client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../../../'); // backend/src/db -> repo root

const VERSION = '1.1.0';
const schemaFile = resolve(repoRoot, 'Schema', VERSION, 'create_tables.sql');
const seedFile = resolve(repoRoot, 'Dati', VERSION, 'seed.sql');

async function runFile(label: string, path: string): Promise<void> {
  const sql = readFileSync(path, 'utf8');
  console.log(`[migrate] running ${label}: ${path}`);
  await pool.query(sql);
  console.log(`[migrate] ${label} done`);
}

async function main(): Promise<void> {
  const withSeed = process.argv.includes('--seed');
  await runFile('schema', schemaFile);
  if (withSeed) {
    await runFile('seed', seedFile);
  }
  console.log('[migrate] complete');
  await pool.end();
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
