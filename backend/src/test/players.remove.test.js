import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'
import { pool } from '../db/pool.js'

describe('DELETE /api/players/:playerId', () => {
  let gameId
  let players = {}
  let statements = {}

  beforeEach(async () => {
    // Started game with three players, one statement each
    const { rows: gameRows } = await pool.query(
      `
      INSERT INTO games (game_code, password, status, current_round, expires_at)
      VALUES ('KICK01', 'testpass', 'started', 1, NOW() + INTERVAL '24 hours')
      RETURNING id
      `,
    )
    gameId = gameRows[0].id

    players = {}
    statements = {}

    const names = ['Alice', 'Bob', 'Carol']

    for (let i = 0; i < names.length; i++) {
      const { rows: userRows } = await pool.query(
        `
        INSERT INTO users (game_id, name, is_host, is_ready)
        VALUES ($1, $2, false, true)
        RETURNING id
        `,
        [gameId, names[i]],
      )
      players[names[i]] = userRows[0].id

      const { rows: statementRows } = await pool.query(
        `
        INSERT INTO statements (game_id, user_id, content, round_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [gameId, userRows[0].id, `Statement by ${names[i]}`, i + 1],
      )
      statements[names[i]] = statementRows[0].id
    }
  })

  afterEach(async () => {
    await pool.query('DELETE FROM games WHERE id = $1', [gameId])
  })

  async function getGame() {
    const { rows } = await pool.query(`SELECT status, current_round FROM games WHERE id = $1`, [
      gameId,
    ])
    return rows[0]
  }

  async function getStatements() {
    const { rows } = await pool.query(
      `SELECT user_id, round_order FROM statements WHERE game_id = $1 ORDER BY round_order`,
      [gameId],
    )
    return rows
  }

  describe('Valid Removals', () => {
    it('should remove a lobby player who has no statement yet', async () => {
      await pool.query(`UPDATE games SET status = 'waiting' WHERE id = $1`, [gameId])

      const { rows } = await pool.query(
        `INSERT INTO users (game_id, name, is_host) VALUES ($1, 'Dave', false) RETURNING id`,
        [gameId],
      )
      const daveId = rows[0].id

      const response = await request(app).delete(`/api/players/${daveId}`)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.removed).toBe(true)

      const { rows: remaining } = await pool.query(`SELECT id FROM users WHERE id = $1`, [daveId])
      expect(remaining).toHaveLength(0)

      // Nobody else's statements moved
      const stmts = await getStatements()
      expect(stmts.map((s) => s.round_order)).toEqual([1, 2, 3])
    })

    it('should shift later statements and the round pointer down when removing an earlier author', async () => {
      // Round 2 is live, Alice (statement 1) disconnects
      await pool.query(`UPDATE games SET current_round = 2 WHERE id = $1`, [gameId])

      const response = await request(app).delete(`/api/players/${players.Alice}`)

      expect(response.status).toBe(200)
      expect(response.body.round).toBe(1)
      expect(response.body.status).toBe('started')

      const game = await getGame()
      expect(game.current_round).toBe(1)
      expect(game.status).toBe('started')

      // Bob and Carol slid into slots 1 and 2, current_round still points at Bob
      const stmts = await getStatements()
      expect(stmts).toEqual([
        { user_id: players.Bob, round_order: 1 },
        { user_id: players.Carol, round_order: 2 },
      ])
    })

    it('should keep the round pointing at the next statement when removing the current author', async () => {
      // Round 2 is live, Bob (statement 2) disconnects
      await pool.query(`UPDATE games SET current_round = 2 WHERE id = $1`, [gameId])

      const response = await request(app).delete(`/api/players/${players.Bob}`)

      expect(response.status).toBe(200)
      expect(response.body.round).toBe(2)
      expect(response.body.status).toBe('started')

      const game = await getGame()
      expect(game.current_round).toBe(2)
      expect(game.status).toBe('started')

      // Carol's statement is now the current one
      const stmts = await getStatements()
      expect(stmts).toEqual([
        { user_id: players.Alice, round_order: 1 },
        { user_id: players.Carol, round_order: 2 },
      ])
    })

    it('should finish the game when the removed statement was the last one left', async () => {
      // Round 3 is live, Carol (statement 3) disconnects
      await pool.query(`UPDATE games SET current_round = 3 WHERE id = $1`, [gameId])

      const response = await request(app).delete(`/api/players/${players.Carol}`)

      expect(response.status).toBe(200)
      expect(response.body.status).toBe('finished')

      const game = await getGame()
      expect(game.status).toBe('finished')
    })

    it('should cascade every vote involving the removed player and keep the rest', async () => {
      const seedVote = (statementId, voterId, guessedUserId) =>
        pool.query(
          `
          INSERT INTO votes (game_id, statement_id, voter_id, guessed_user_id)
          VALUES ($1, $2, $3, $4)
          `,
          [gameId, statementId, voterId, guessedUserId],
        )

      await seedVote(statements.Alice, players.Bob, players.Carol) // guessed Carol
      await seedVote(statements.Alice, players.Carol, players.Bob) // cast by Carol
      await seedVote(statements.Carol, players.Alice, players.Bob) // on Carol's statement
      await seedVote(statements.Bob, players.Alice, players.Bob) // untouched by Carol

      const response = await request(app).delete(`/api/players/${players.Carol}`)

      expect(response.status).toBe(200)

      const { rows: votes } = await pool.query(
        `SELECT statement_id, voter_id, guessed_user_id FROM votes WHERE game_id = $1`,
        [gameId],
      )

      expect(votes).toEqual([
        {
          statement_id: statements.Bob,
          voter_id: players.Alice,
          guessed_user_id: players.Bob,
        },
      ])
    })
  })

  describe('Invalid Removals', () => {
    it('should return 404 for a non-existent player', async () => {
      const response = await request(app).delete('/api/players/999999')

      expect(response.status).toBe(404)
      expect(response.body.error).toBe('Player not found')
    })

    it('should reject removing the host', async () => {
      const { rows } = await pool.query(
        `INSERT INTO users (game_id, name, is_host) VALUES ($1, 'Hosty', true) RETURNING id`,
        [gameId],
      )

      const response = await request(app).delete(`/api/players/${rows[0].id}`)

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('The host cannot be removed')
    })

    it('should reject removals after the game has finished', async () => {
      await pool.query(`UPDATE games SET status = 'finished' WHERE id = $1`, [gameId])

      const response = await request(app).delete(`/api/players/${players.Alice}`)

      expect(response.status).toBe(403)
      expect(response.body.error).toBe('Game has already finished')
    })
  })
})
