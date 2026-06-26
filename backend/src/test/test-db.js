import { pool } from '../db/pool.js'

export async function clearDatabase() {
  await pool.query('DELETE FROM users')
}

export async function closeDatabase() {
  await pool.end()
}