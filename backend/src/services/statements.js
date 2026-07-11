import { pool } from '../db/pool.js';

/**
 * Get the current round number for a game
 */
async function getCurrentRound(gameId) {
  const { rows } = await pool.query(
    `
    SELECT current_round FROM games WHERE id = $1
    `,
    [gameId]
  );
  return rows[0]?.current_round || 1;
}

/**
 * Check if player already submitted a statement
 */
async function hasPlayerSubmitted(gameId, userId) {
  const { rows } = await pool.query(
    `
    SELECT id FROM statements 
    WHERE game_id = $1 AND user_id = $2
    `,
    [gameId, userId]
  );
  return rows.length > 0;
}

/**
 * Save a player's CV statement
 */
export async function saveStatement(gameId, userId, content) {
  // Check if player already submitted
  if (await hasPlayerSubmitted(gameId, userId)) {
    throw new Error('You have already submitted a statement for this game');
  }

  const currentRound = await getCurrentRound(gameId);

  const { rows } = await pool.query(
    `
    INSERT INTO statements (game_id, user_id, content, round_order)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [gameId, userId, content, currentRound]
  );

  // Mark player as ready
  await pool.query(
    `
    UPDATE users
    SET is_ready = TRUE
    WHERE id = $1
    `,
    [userId]
  );

  return rows[0];
}