import pg from 'pg';
import { config } from '../config.js';

// SSL rules:
//  - Public proxy (proxy.rlwy.net): SSL required, self-signed chain -> don't verify.
//  - Internal host (postgres.railway.internal): private network, NO SSL.
//  - Anything else with sslmode in the URL: respect it.
// Override with PGSSL=disable / PGSSL=require if needed.
const url = config.databaseUrl;
const isInternal = url.includes('.railway.internal');
const isPublicProxy = url.includes('proxy.rlwy.net') || url.includes('.rlwy.net');
const sslOverride = process.env.PGSSL; // 'require' | 'disable' | undefined

let ssl: false | { rejectUnauthorized: false };
if (sslOverride === 'disable') ssl = false;
else if (sslOverride === 'require') ssl = { rejectUnauthorized: false };
else if (isInternal) ssl = false;
else if (isPublicProxy) ssl = { rejectUnauthorized: false };
else ssl = false;

export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('[db] unexpected pool error', err);
});

type Params = ReadonlyArray<unknown>;

/** Run a query and return all rows. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: Params
): Promise<T[]> {
  const res = await pool.query(text, params as unknown[]);
  return res.rows as T[];
}

/** Run a query and return the first row, or null. */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: Params
): Promise<T | null> {
  const res = await pool.query(text, params as unknown[]);
  return (res.rows[0] as T) ?? null;
}

/** Run a statement and return the number of affected rows. */
export async function execute(text: string, params?: Params): Promise<number> {
  const res = await pool.query(text, params as unknown[]);
  return res.rowCount ?? 0;
}

/** Run a set of statements inside a single transaction. */
export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
