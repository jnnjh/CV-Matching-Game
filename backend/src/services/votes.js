import { pool } from '../db/pool.js'

/**
 * Check if the voter is trying to vote on their own statement
 */
async function isSelfVote(statementId, voterId) {
  const { rows } = await pool.query(`SELECT user_id FROM statements WHERE id = $1`, [statementId])
  return rows[0]?.user_id === voterId
}

/**
 * Check if the voter has already voted on this statement
 */
async function hasAlreadyVoted(statementId, voterId) {
  const { rows } = await pool.query(
    `SELECT id FROM votes WHERE statement_id = $1 AND voter_id = $2`,
    [statementId, voterId],
  )
  return rows.length > 0
}

/**
 * Save a vote
 */
export async function saveVote(gameId, statementId, voterId, guessedUserId) {
  if (await isSelfVote(statementId, voterId)) {
    throw new Error('You cannot vote on your own statement')
  }

  if (await hasAlreadyVoted(statementId, voterId)) {
    throw new Error('You have already voted on this statement')
  }

  const { rows } = await pool.query(
    `
    INSERT INTO votes (game_id, statement_id, voter_id, guessed_user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [gameId, statementId, voterId, guessedUserId],
  )

  return rows[0]
}
