import { pool } from '../db/pool.js'

/**
 * Get all players for a specific game
 */
export async function getPlayersByGameId(gameId) {
  const { rows } = await pool.query(
    `
      SELECT id, name, is_host, joined_at
      FROM users
      WHERE game_id = $1
      ORDER BY joined_at ASC
    `,
    [gameId],
  )

  return rows
}

/**
 * Check if a game exists
 */
export async function gameExists(gameId) {
  const { rowCount } = await pool.query(
    `
      SELECT 1
      FROM games
      WHERE id = $1
    `,
    [gameId],
  )

  return rowCount > 0
}