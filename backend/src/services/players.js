import { pool } from '../db/pool.js';

// Validates if a game code exists and is still active
export async function validateGameCode(gameCode) {
  const { rows } = await pool.query(
    `
    SELECT id, game_code, status, expires_at 
    FROM games 
    WHERE game_code = $1 
    LIMIT 1
    `,
    [gameCode]
  );

  if (rows.length === 0) {
    return { valid: false, error: 'Invalid game code' };
  }

  const game = rows[0];

  // Check if game is expired
  if (new Date(game.expires_at) < new Date()) {
    return { valid: false, error: 'Game has expired' };
  }

  // Check if game is still in 'waiting' status
  if (game.status !== 'waiting') {
    return { valid: false, error: 'Game is not accepting new players' };
  }

  return { valid: true, game };
}

// Adds a player to a game
export async function addPlayerToGame(gameId, name) {
  const { rows } = await pool.query(
    `
    INSERT INTO users (game_id, name, is_host)
    VALUES ($1, $2, false)
    RETURNING *
    `,
    [gameId, name]
  );

  return rows[0];
}