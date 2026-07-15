import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { pool } from '../db/pool.js'

describe('POST /api/players', () => {
  let testGameId
  let testGameCode

  beforeEach(async () => {
    // Create a test game
    const { rows } = await pool.query(
      `
      INSERT INTO games (game_code, password, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      RETURNING id, game_code
      `,
      ['JOIN12', 'testpass'],
    )
    testGameId = rows[0].id
    testGameCode = rows[0].game_code
  })

  afterEach(async () => {
    // Clean up test data
    if (testGameId) {
      await pool.query('DELETE FROM games WHERE id = $1', [testGameId])
    }
    // Clean up any users that might have been created
    await pool.query('DELETE FROM users WHERE game_id = $1', [testGameId])
  })

  describe('Valid Joins', () => {
    it('should allow a player to join a valid game', async () => {
      const response = await request(app).post('/api/players').send({
        gameCode: testGameCode,
        name: 'Alice',
      })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.player).toBeDefined()
      expect(response.body.player.name).toBe('Alice')
      expect(response.body.player.is_host).toBe(false)
      expect(response.body.game).toBeDefined()
      expect(response.body.game.gameCode).toBe(testGameCode)
    })
  })

  describe('Invalid Joins', () => {
    it('should reject missing game code', async () => {
      const response = await request(app).post('/api/players').send({
        name: 'Alice',
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Game code is required')
    })

    it('should reject missing name', async () => {
      const response = await request(app).post('/api/players').send({
        gameCode: testGameCode,
      })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Name is required')
    })

    it('should reject invalid game code', async () => {
      const response = await request(app).post('/api/players').send({
        gameCode: 'INVALID',
        name: 'Alice',
      })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Game not found')
    })

    it('should reject duplicate names', async () => {
      // First join
      await request(app).post('/api/players').send({
        gameCode: testGameCode,
        name: 'Duplicate',
      })

      // Second join with same name
      const response = await request(app).post('/api/players').send({
        gameCode: testGameCode,
        name: 'Duplicate',
      })

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('A player with this name already exists in the game')
    })
  })
})

describe('PATCH /api/players/:playerId', () => {
  let testGameId
  let testPlayerId

  beforeEach(async () => {
    // Create a test game in waiting status
    const { rows } = await pool.query(
      `
      INSERT INTO games (game_code, password, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      RETURNING id
      `,
      ['RENAM1', 'testpass'],
    )
    testGameId = rows[0].id

    // Add a player to rename
    const { rows: playerRows } = await pool.query(
      `
      INSERT INTO users (game_id, name, is_host)
      VALUES ($1, 'Alice', false)
      RETURNING id
      `,
      [testGameId],
    )
    testPlayerId = playerRows[0].id
  })

  afterEach(async () => {
    await pool.query('DELETE FROM users WHERE game_id = $1', [testGameId])
    await pool.query('DELETE FROM games WHERE id = $1', [testGameId])
  })

  describe('Valid Renames', () => {
    it('should rename a player while the game is waiting', async () => {
      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: 'Alicia' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.player.name).toBe('Alicia')
      expect(response.body.player.id).toBe(testPlayerId)
    })

    it('should trim whitespace from the new name', async () => {
      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: '  Alicia  ' })

      expect(response.status).toBe(200)
      expect(response.body.player.name).toBe('Alicia')
    })
  })

  describe('Invalid Renames', () => {
    it('should reject a missing name', async () => {
      const response = await request(app).patch(`/api/players/${testPlayerId}`).send({})

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Name is required')
    })

    it('should reject an empty name', async () => {
      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: '   ' })

      expect(response.status).toBe(400)
      expect(response.body.error).toBe('Name is required')
    })

    it('should return 404 for a non-existent player', async () => {
      const response = await request(app).patch('/api/players/999999').send({ name: 'Ghost' })

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Player not found')
    })

    it('should reject renaming after the game has started', async () => {
      await pool.query(`UPDATE games SET status = 'started' WHERE id = $1`, [testGameId])

      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: 'TooLate' })

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Game has already started')
    })

    it('should reject a name already taken in the same game (case-insensitive)', async () => {
      await pool.query(`INSERT INTO users (game_id, name, is_host) VALUES ($1, 'Bob', false)`, [
        testGameId,
      ])

      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: 'bob' })

      expect(response.status).toBe(409)
      expect(response.body.error).toBe('A player with this name already exists in the game')
    })

    it('should allow a player to keep their own name with different casing', async () => {
      const response = await request(app)
        .patch(`/api/players/${testPlayerId}`)
        .send({ name: 'ALICE' })

      expect(response.status).toBe(200)
      expect(response.body.player.name).toBe('ALICE')
    })
  })
})
