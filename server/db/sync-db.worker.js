// Worker thread: runs Postgres (Supabase) queries.
// The main thread calls these synchronously via synckit, so the rest of the
// app can keep using the existing better-sqlite3-style synchronous API.
import { runAsWorker } from 'synckit';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
});

runAsWorker(async ({ text, params }) => {
  // No params -> simple query protocol (allows multi-statement DDL).
  // With params -> extended protocol (parameterized, safe).
  const res = (params && params.length)
    ? await pool.query(text, params)
    : await pool.query(text);
  return { rows: res.rows, rowCount: res.rowCount };
});
