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

export async function getCurrentRound(gameId) {
  // get current round
  const { rows: gameRows } = await pool.query(
    `
    SELECT current_round
    FROM games
    WHERE id = $1
    `,
    [gameId]
  )

  if (gameRows.length === 0) {
    throw new Error('Game not found')
  }

  const currentRound = gameRows[0].current_round

  // get statement for current round
  const { rows: statementRows } = await pool.query(
    `
    SELECT id, content
    FROM statements
    WHERE game_id = $1
    AND round_order = $2
    `,
    [gameId, currentRound]
  )

  if (statementRows.length === 0) {
    throw new Error('No statement found')
  }

  // get player choices
  const { rows: players } = await pool.query(
    `
    SELECT id, name
    FROM users
    WHERE game_id = $1
    `,
    [gameId]
  )

  return {
    round: currentRound,
    statement: statementRows[0],
    choices: players,
  }
}