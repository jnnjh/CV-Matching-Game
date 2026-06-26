import { pool } from '../db/pool.js'

function generateGameCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createGame(password) {
  const gameCode = generateGameCode()

  const { rows } = await pool.query(
    `
    INSERT INTO games (game_code, password, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '24 hours')
    RETURNING *
    `,
    [gameCode, password]
  )

  return rows[0]
}