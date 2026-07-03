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

export async function startGame(gameId) {
  const { rows: users } = await pool.query(
    `
    SELECT * FROM users
    WHERE game_id = $1
    `,
    [gameId]
  )

  if (users.length === 0) {
    throw new Error('No users in game')
  }

  const allReady = users.every((user) => user.is_ready)

  if (!allReady) {
    throw new Error('Not all users are ready')
  }

  const { rows } = await pool.query(
    `
    UPDATE games
    SET status = 'started'
    WHERE id = $1
    RETURNING *
    `,
    [gameId]
  )

  return rows[0]
}