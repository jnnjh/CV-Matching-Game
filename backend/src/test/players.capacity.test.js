import { describe, it, expect, beforeEach } from 'vitest'
import { pool } from '../db/pool.js'
import { addPlayerToGame } from '../services/players.js'

describe('Player capacity limits', () => {
  let testGameId

  beforeEach(async () => {
    const gameRes = await pool.query(
      `INSERT INTO games (game_code, password, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       RETURNING id`,
      ['CAP001', 'testpass'],
    )
    testGameId = gameRes.rows[0].id
  })

  it('allows up to 10 players to join', async () => {
    for (let i = 1; i <= 10; i++) {
      const player = await addPlayerToGame(testGameId, `Player ${i}`)
      expect(player.id).toBeDefined()
    }

    const { rows } = await pool.query(`SELECT COUNT(*) AS count FROM users WHERE game_id = $1`, [
      testGameId,
    ])
    expect(Number(rows[0].count)).toBe(10)
  })

  it('rejects an 11th player', async () => {
    for (let i = 1; i <= 10; i++) {
      await addPlayerToGame(testGameId, `Player ${i}`)
    }

    await expect(addPlayerToGame(testGameId, 'Player 11')).rejects.toThrow(
      'Game is full (maximum 10 players)',
    )
  })
})
