import { pool } from '../db/pool.js'

/**
 * Validates if a game code exists and is still active
 */
export async function validateGameCode(gameCode) {
  const { rows } = await pool.query(
    `
    SELECT id, game_code, status, expires_at
    FROM games
    WHERE game_code = $1
    LIMIT 1
    `,
    [gameCode],
  )

  if (rows.length === 0) {
    return { valid: false, error: 'Invalid game code' }
  }

  const game = rows[0]

  // Check if game is expired
  const now = new Date()
  const expiresAt = new Date(game.expires_at)

  if (expiresAt < now) {
    return { valid: false, error: 'Game has expired' }
  }

  // Check if game is still accepting players
  if (game.status !== 'waiting') {
    return { valid: false, error: 'Game is not accepting new players' }
  }

  return { valid: true, game }
}

/**
 * Adds a player to a game
 */
export async function addPlayerToGame(gameId, name) {
  // Check that the game exists
  const gameCheck = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])

  if (gameCheck.rows.length === 0) {
    throw new Error(`Game with id ${gameId} does not exist`)
  }

  // Check maximum number of players
  const { rows: countRows } = await pool.query(
    `
    SELECT COUNT(*) AS count
    FROM users
    WHERE game_id = $1
    `,
    [gameId],
  )

  const playerCount = Number(countRows[0].count)

  if (playerCount >= 10) {
    throw new Error('Game is full (maximum 10 players)')
  }

  const { rows } = await pool.query(
    `
    INSERT INTO users (game_id, name, is_host)
    VALUES ($1, $2, false)
    RETURNING *
    `,
    [gameId, name],
  )

  return rows[0]
}

/**
 * Updates a player's name while the game is still in the lobby
 */
export async function updatePlayerName(playerId, newName) {
  const { rows: playerRows } = await pool.query(
    `
    SELECT u.id, u.game_id, g.status
    FROM users u
    JOIN games g ON g.id = u.game_id
    WHERE u.id = $1
    `,
    [playerId],
  )

  if (playerRows.length === 0) {
    throw new Error('Player not found')
  }

  const player = playerRows[0]

  if (player.status !== 'waiting') {
    throw new Error('Game has already started')
  }

  const { rows: existing } = await pool.query(
    `
    SELECT id FROM users
    WHERE game_id = $1 AND name ILIKE $2 AND id != $3
    `,
    [player.game_id, newName, playerId],
  )

  if (existing.length > 0) {
    throw new Error('A player with this name already exists in the game')
  }

  const { rows } = await pool.query(
    `
    UPDATE users
    SET name = $1
    WHERE id = $2
    RETURNING *
    `,
    [newName, playerId],
  )

  return rows[0]
}
