import { pool } from '../db/pool.js'

/**
 * Check if the voter is trying to vote on their own statement
 */
async function isSelfVote(statementId, voterId) {
  const { rows } = await pool.query(`SELECT user_id FROM statements WHERE id = $1`, [statementId])
  if (rows.length === 0) return false

  // voterId can arrive as a number (JSON body on POST /api/votes) or as a
  // string (query string on GET /api/votes/status). Normalize both sides
  // so the comparison works either way.
  return String(rows[0].user_id) === String(voterId)
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

/**
 * Vote progress for the current statement, for the host's screen.
 * Returns every player with a hasVoted flag. The statement's author
 * can't vote, so they are marked as hasVoted to avoid the host screen
 * silently giving away whose statement it is (one permanently greyed
 * out name would be a dead giveaway).
 */
export async function getVoteProgress(gameId) {
  const { rows: gameRows } = await pool.query(
    `SELECT current_round, status FROM games WHERE id = $1`,
    [gameId],
  )

  if (gameRows.length === 0) {
    throw new Error('Game not found')
  }

  const { current_round: currentRound, status } = gameRows[0]

  const { rows: statementRows } = await pool.query(
    `SELECT id, user_id FROM statements WHERE game_id = $1 AND round_order = $2`,
    [gameId, currentRound],
  )

  const statement = statementRows[0] || null

  const { rows: players } = await pool.query(
    `SELECT id, name FROM users WHERE game_id = $1 ORDER BY id`,
    [gameId],
  )

  let voterIds = new Set()

  if (statement) {
    const { rows: votes } = await pool.query(`SELECT voter_id FROM votes WHERE statement_id = $1`, [
      statement.id,
    ])
    voterIds = new Set(votes.map((v) => v.voter_id))
  }

  const playerProgress = players.map((player) => ({
    id: player.id,
    name: player.name,
    hasVoted: statement ? voterIds.has(player.id) || player.id === statement.user_id : false,
  }))

  const votesNeeded = Math.max(players.length - 1, 0)

  return {
    round: currentRound,
    status,
    votesIn: voterIds.size,
    votesNeeded,
    allVotesIn: voterIds.size >= votesNeeded && votesNeeded > 0,
    players: playerProgress,
  }
}

/**
 * Status of a voter for a statement:
 * - hasVoted: lets the frontend keep the vote screen locked after a refresh
 * - isOwnStatement: the author sits the round out and sees a message
 *   instead of voting options
 *
 * Both flags are computed here, server-side, and only answered for the
 * requesting voter. The statement's author is never exposed to other
 * players' browsers, so nobody can cheat by inspecting network traffic.
 */

export async function getVoteStatus(statementId, voterId) {
  const [hasVoted, isOwnStatement] = await Promise.all([
    hasAlreadyVoted(statementId, voterId),
    isSelfVote(statementId, voterId),
  ])

  return { hasVoted, isOwnStatement }
}
