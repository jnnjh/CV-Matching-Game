import { pool } from '../db/pool.js'

export async function clearDatabase() {
  await pool.query('DELETE FROM votes')
  await pool.query('DELETE FROM statements')
  await pool.query('DELETE FROM users')
  await pool.query('DELETE FROM games')
}

export async function closeDatabase() {
  await pool.end()
}