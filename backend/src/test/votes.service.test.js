import { describe, it, expect, beforeEach } from 'vitest'
import { pool } from '../db/pool.js'
import { saveVote } from '../services/votes.js'

describe('Votes Service', () => {
  let testGameId
  let voterId
  let authorId
  let statementId

  beforeEach(async () => {
    // create a game
    const gameRes = await pool.query(
      `INSERT INTO games (game_code, password, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       RETURNING id`,
      ['VOTE01', 'testpass'],
    )
    testGameId = gameRes.rows[0].id

    // create two users: a voter and a statement author
    const voterRes = await pool.query(
      `INSERT INTO users (game_id, name) VALUES ($1, $2) RETURNING id`,
      [testGameId, 'Voter'],
    )
    voterId = voterRes.rows[0].id

    const authorRes = await pool.query(
      `INSERT INTO users (game_id, name) VALUES ($1, $2) RETURNING id`,
      [testGameId, 'Author'],
    )
    authorId = authorRes.rows[0].id

    // create a statement written by the author
    const statementRes = await pool.query(
      `INSERT INTO statements (game_id, user_id, content, round_order)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testGameId, authorId, 'I have 3 cats', 1],
    )
    statementId = statementRes.rows[0].id
  })

  it('saves a vote', async () => {
    const vote = await saveVote(testGameId, statementId, voterId, authorId)

    expect(vote).toBeDefined()
    expect(vote.statement_id).toBe(statementId)
    expect(vote.voter_id).toBe(voterId)
    expect(vote.guessed_user_id).toBe(authorId)
  })

  it('blocks duplicate votes', async () => {
    await saveVote(testGameId, statementId, voterId, authorId)

    await expect(saveVote(testGameId, statementId, voterId, authorId)).rejects.toThrow(
      'You have already voted on this statement',
    )
  })

  it('blocks self votes', async () => {
    // author tries to vote on their own statement
    await expect(saveVote(testGameId, statementId, authorId, voterId)).rejects.toThrow(
      'You cannot vote on your own statement',
    )
  })
})
