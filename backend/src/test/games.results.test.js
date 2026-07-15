import { describe, it, expect, beforeEach } from 'vitest'
import { pool } from '../db/pool.js'
import { getGameResults, endGame } from '../services/games.js'
import { saveStatement } from '../services/statements.js'
import { saveVote } from '../services/votes.js'

describe('Game results and end game', () => {
  let gameId
  let players = []
  let statements = []

  beforeEach(async () => {
    const gameRes = await pool.query(
      `INSERT INTO games (game_code, password, expires_at, status)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours', 'finished')
       RETURNING id`,
      ['RESULT', 'testpass'],
    )
    gameId = gameRes.rows[0].id

    players = []
    for (const name of ['Ana', 'Ben', 'Cy']) {
      const res = await pool.query(
        `INSERT INTO users (game_id, name) VALUES ($1, $2) RETURNING id`,
        [gameId, name],
      )
      players.push({ id: res.rows[0].id, name })
    }

    statements = []
    for (const [i, player] of players.entries()) {
      const statement = await saveStatement(gameId, player.id, `Statement number ${i + 1}`)
      statements.push(statement)
    }
  })

  it('computes the percentage of correct guesses per player', async () => {
    const [ana, ben, cy] = players

    // Ana's statement: Ben guesses right, Cy guesses wrong -> 50%
    await saveVote(gameId, statements[0].id, ben.id, ana.id)
    await saveVote(gameId, statements[0].id, cy.id, ben.id)

    // Ben's statement: Ana and Cy both guess right -> 100%
    await saveVote(gameId, statements[1].id, ana.id, ben.id)
    await saveVote(gameId, statements[1].id, cy.id, ben.id)

    const { results, status } = await getGameResults(gameId)

    expect(status).toBe('finished')
    expect(results).toHaveLength(3)

    const anaResult = results.find((r) => r.id === ana.id)
    expect(anaResult.statement).toBe('Statement number 1')
    expect(anaResult.totalVotes).toBe(2)
    expect(anaResult.correctVotes).toBe(1)
    expect(anaResult.percentage).toBe(50)

    const benResult = results.find((r) => r.id === ben.id)
    expect(benResult.percentage).toBe(100)

    // Nobody voted on Cy's statement
    const cyResult = results.find((r) => r.id === cy.id)
    expect(cyResult.totalVotes).toBe(0)
    expect(cyResult.percentage).toBe(0)
  })

  it('throws for a game that does not exist', async () => {
    await expect(getGameResults(999999)).rejects.toThrow('Game not found')
  })

  it('endGame deletes the game and cascades to users, statements and votes', async () => {
    const [ana, ben] = players
    await saveVote(gameId, statements[0].id, ben.id, ana.id)

    const result = await endGame(gameId)
    expect(result.deleted).toBe(true)

    const games = await pool.query(`SELECT id FROM games WHERE id = $1`, [gameId])
    const users = await pool.query(`SELECT id FROM users WHERE game_id = $1`, [gameId])
    const stmts = await pool.query(`SELECT id FROM statements WHERE game_id = $1`, [gameId])
    const votes = await pool.query(`SELECT id FROM votes WHERE game_id = $1`, [gameId])

    expect(games.rows).toHaveLength(0)
    expect(users.rows).toHaveLength(0)
    expect(stmts.rows).toHaveLength(0)
    expect(votes.rows).toHaveLength(0)
  })

  it('endGame throws for a game that does not exist', async () => {
    await expect(endGame(999999)).rejects.toThrow('Game not found')
  })
})
