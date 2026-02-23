'use strict';

/**
 * Lightweight migration runner.
 * Reads *.sql files from migrations/ in alphabetical order and applies any
 * that have not yet been recorded in schema_migrations.
 *
 * Usage:
 *   node src/db/migrate.js           # apply pending migrations
 *   node src/db/migrate.js rollback  # (not implemented – use explicit rollback scripts)
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'attendance_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      filename   VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(
    'SELECT filename FROM schema_migrations ORDER BY filename'
  );
  return new Set(rows.map((r) => r.filename));
}

async function applyMigration(client, filename, sql) {
  console.log(`  Applying: ${filename}`);
  await client.query(sql);
  await client.query(
    'INSERT INTO schema_migrations (filename) VALUES ($1)',
    [filename]
  );
}

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureMigrationsTable(client);

    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        continue;
      }
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
      await applyMigration(client, file, sql);
      count++;
    }

    await client.query('COMMIT');
    if (count === 0) {
      console.log('No pending migrations.');
    } else {
      console.log(`Applied ${count} migration(s) successfully.`);
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
