import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { pool } from '../db/pool.js'

describe('POST /api/votes', () => {
  let testGameId
  let voterId
  let authorId
  let statementId

  beforeEach(async () => {
    const gameRes = await pool.query(
      `INSERT INTO games (game_code, password, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       RETURNING id`,
      ['VOTE02', 'testpass'],
    )
    testGameId = gameRes.rows[0].id

    const voterRes = await pool.query(
      `INSERT INTO users (game_id, name) VALUES ($1, $2) RETURNING id`,
      [testGameId, 'RouteVoter'],
    )
    voterId = voterRes.rows[0].id

    const authorRes = await pool.query(
      `INSERT INTO users (game_id, name) VALUES ($1, $2) RETURNING id`,
      [testGameId, 'RouteAuthor'],
    )
    authorId = authorRes.rows[0].id

    const statementRes = await pool.query(
      `INSERT INTO statements (game_id, user_id, content, round_order)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testGameId, authorId, 'I love ramen', 1],
    )
    statementId = statementRes.rows[0].id
  })

  it('creates a vote on valid input', async () => {
    const response = await request(app).post('/api/votes').send({
      gameId: testGameId,
      statementId,
      voterId,
      guessedUserId: authorId,
    })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.vote.voter_id).toBe(voterId)
  })

  it('rejects missing fields', async () => {
    const response = await request(app)
      .post('/api/votes')
      .send({ voterId, guessedUserId: authorId })

    expect(response.status).toBe(400)
  })

  it('returns 409 for duplicate votes', async () => {
    await request(app)
      .post('/api/votes')
      .send({ gameId: testGameId, statementId, voterId, guessedUserId: authorId })

    const response = await request(app)
      .post('/api/votes')
      .send({ gameId: testGameId, statementId, voterId, guessedUserId: authorId })

    expect(response.status).toBe(409)
  })

  it('returns 400 for self votes', async () => {
    const response = await request(app).post('/api/votes').send({
      gameId: testGameId,
      statementId,
      voterId: authorId,
      guessedUserId: voterId,
    })

    expect(response.status).toBe(400)
  })
})
