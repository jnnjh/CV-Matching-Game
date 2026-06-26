import { pool } from '../db/pool.js';

/**
 * Validates if a game code exists and is still active
 */
export async function validateGameCode(gameCode) {
  console.log('🔍 validateGameCode called with:', gameCode);
  
  const { rows } = await pool.query(
    `
    SELECT id, game_code, status, expires_at 
    FROM games 
    WHERE game_code = $1 
    LIMIT 1
    `,
    [gameCode]
  );

  console.log('📊 Query result rows:', rows);

  if (rows.length === 0) {
    console.log('❌ Game not found');
    return { valid: false, error: 'Invalid game code' };
  }

  const game = rows[0];
  console.log('✅ Game found:', game);

  // Check if game is expired
  const now = new Date();
  const expiresAt = new Date(game.expires_at);
  console.log('🕐 Now:', now, 'Expires at:', expiresAt);
  
  if (expiresAt < now) {
    console.log('❌ Game expired');
    return { valid: false, error: 'Game has expired' };
  }

  // Check if game is still in 'waiting' status
  console.log('📊 Game status:', game.status);
  if (game.status !== 'waiting') {
    console.log('❌ Game status is not waiting:', game.status);
    return { valid: false, error: 'Game is not accepting new players' };
  }

  console.log('✅ Game is valid');
  return { valid: true, game };
}

/**
 * Adds a player to a game
 */
export async function addPlayerToGame(gameId, name) {
  console.log('👤 addPlayerToGame called with gameId:', gameId, 'name:', name);
  
  // First check if the game exists
  const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [gameId]);
  console.log('🔍 Game exists check:', gameCheck.rows);
  
  if (gameCheck.rows.length === 0) {
    throw new Error(`Game with id ${gameId} does not exist`);
  }
  
  const { rows } = await pool.query(
    `
    INSERT INTO users (game_id, name, is_host)
    VALUES ($1, $2, false)
    RETURNING *
    `,
    [gameId, name]
  );

  console.log('✅ Player added:', rows[0]);
  return rows[0];
}