import { Pool } from 'pg';

// Pool hacia Postgres (usuarios persistentes)
const pool = new Pool({
  connectionString: process.env.DB_URL || process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

export const db = {
  query: (text, params) => pool.query(text, params)
};

// Tiendas en memoria para datos demo (drivers/trips)
const stores = {
  users: new Map(),
  drivers: new Map(),
  trips: new Map()
};

export function getStore(name) {
  if (!stores[name]) throw new Error(`Unknown store: ${name}`);
  return stores[name];
}

export default { getStore, db };
