const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const enabled = Boolean(connectionString);

const pool = enabled
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5,
    })
  : null;

let schemaPromise;

function ensureSchema() {
  if (!enabled) return Promise.resolve();
  if (!schemaPromise) {
    schemaPromise = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        name TEXT,
        address TEXT,
        postal_code TEXT,
        phone_number TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS orders (
        id BIGSERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        artikelnummer TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        color TEXT NOT NULL,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        image TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS orders_session_id_idx ON orders(session_id);
      CREATE TABLE IF NOT EXISTS quote_requests (
        id BIGSERIAL PRIMARY KEY,
        payload JSONB NOT NULL,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS contact_messages (
        id BIGSERIAL PRIMARY KEY,
        email TEXT,
        name TEXT,
        phone TEXT,
        message TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `).catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

module.exports = { enabled, pool, ensureSchema };
