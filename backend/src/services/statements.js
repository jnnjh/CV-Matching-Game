import { pool } from '../db/pool.js'

/**
 * Check if player already submitted a statement
 */
async function hasPlayerSubmitted(gameId, userId) {
  const { rows } = await pool.query(
    `
    SELECT id FROM statements 
    WHERE game_id = $1 AND user_id = $2
    `,
    [gameId, userId],
  )
  return rows.length > 0
}

/**
 * Save a player's CV statement
 */
export async function saveStatement(gameId, userId, content) {
  // Check if player already submitted
  if (await hasPlayerSubmitted(gameId, userId)) {
    throw new Error('You have already submitted a statement for this game')
  }

  // Each statement gets the next sequential round number for this game.
  // Previously every statement was saved with the game's current_round
  // (always 1 during the lobby phase), which made it impossible to ever
  // advance past round 1.
  const { rows: countRows } = await pool.query(
    `
    SELECT COUNT(*) AS count FROM statements WHERE game_id = $1
    `,
    [gameId],
  )

  const nextRoundOrder = Number(countRows[0].count) + 1

  const { rows } = await pool.query(
    `
    INSERT INTO statements (game_id, user_id, content, round_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [gameId, userId, content, nextRoundOrder],
  )

  // Mark player as ready
  await pool.query(
    `
    UPDATE users
    SET is_ready = TRUE
    WHERE id = $1
    `,
    [userId],
  )

  return rows[0]
}
