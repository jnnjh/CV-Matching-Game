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

/**
 * Removes a player and everything they contributed. Deleting the user
 * cascades to their statement, votes they cast, votes on their statement
 * and votes where others guessed them.
 *
 * If the player had a statement, later statements shift down one
 * round_order slot so getCurrentRound and advanceRound never hit a gap.
 * The game's current_round pointer moves with them, and if the removed
 * statement was the last one left to play, the game is finished.
 */
export async function removePlayer(playerId) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    const { rows: playerRows } = await client.query(
      `
      SELECT u.id, u.game_id, u.is_host, g.status, g.current_round
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

    if (player.is_host) {
      throw new Error('The host cannot be removed')
    }

    if (player.status === 'finished') {
      throw new Error('Game has already finished')
    }

    const { rows: statementRows } = await client.query(
      `
      SELECT round_order FROM statements
      WHERE user_id = $1
      `,
      [playerId],
    )

    const removedOrder = statementRows[0]?.round_order ?? null

    await client.query('DELETE FROM users WHERE id = $1', [playerId])

    let currentRound = player.current_round
    let status = player.status

    if (removedOrder !== null) {
      // Close the gap the removed statement left behind
      await client.query(
        `
        UPDATE statements
        SET round_order = round_order - 1
        WHERE game_id = $1 AND round_order > $2
        `,
        [player.game_id, removedOrder],
      )

      if (status === 'started') {
        // The current statement shifted down together with the rest
        if (removedOrder < currentRound) {
          currentRound = currentRound - 1

          await client.query(
            `
            UPDATE games
            SET current_round = $2
            WHERE id = $1
            `,
            [player.game_id, currentRound],
          )
        }

        // If the removed statement was the current one and nothing slid
        // into its slot, there is nothing left to play
        const { rows: remaining } = await client.query(
          `
          SELECT id FROM statements
          WHERE game_id = $1 AND round_order = $2
          `,
          [player.game_id, currentRound],
        )

        if (remaining.length === 0) {
          status = 'finished'

          await client.query(
            `
            UPDATE games
            SET status = 'finished'
            WHERE id = $1
            `,
            [player.game_id],
          )
        }
      }
    }

    await client.query('COMMIT')

    return {
      removed: true,
      playerId: player.id,
      gameId: player.game_id,
      round: currentRound,
      status,
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
