import { pool } from '../db/pool.js'

// Service functions talk to the database (or any data source).
// They return plain data – no req/res objects here.

export async function getAllUsers() {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id')
  return rows
}

export async function getUserById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] ?? null
}
