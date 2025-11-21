import { db } from '../config/db.js';

export async function createUser({ id, name, email, passwordHash }) {
  const query = `
    INSERT INTO users (id, name, email, password_hash)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, created_at
  `;
  const params = [id, name, email, passwordHash];
  const { rows } = await db.query(query, params);
  return rows[0];
}

export async function findUserByEmail(email) {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email]);
  return rows[0] || null;
}

export async function countUsers() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS count FROM users');
  return rows[0]?.count || 0;
}

export async function findUserById(id) {
  const { rows } = await db.query('SELECT id, name, email, created_at FROM users WHERE id = $1 LIMIT 1', [id]);
  return rows[0] || null;
}

export async function updateUser({ id, name, email, passwordHash }) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (name) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (email) {
    fields.push(`email = $${idx++}`);
    values.push(email);
  }
  if (passwordHash) {
    fields.push(`password_hash = $${idx++}`);
    values.push(passwordHash);
  }

  if (!fields.length) return await findUserById(id);

  const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, created_at`;
  values.push(id);
  const { rows } = await db.query(query, values);
  return rows[0] || null;
}
