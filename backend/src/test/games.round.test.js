import { describe, it, expect, beforeEach } from 'vitest'
import { pool } from '../db/pool.js'
import { advanceRound, getCurrentRound } from '../services/games.js'
import { getVoteProgress, saveVote } from '../services/votes.js'
import { saveStatement } from '../services/statements.js'

describe('Round progression', () => {
  let gameId
  let players = []

  beforeEach(async () => {
    const gameRes = await pool.query(
      `INSERT INTO games (game_code, password, expires_at, status)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours', 'started')
       RETURNING id`,
      ['ROUND1', 'testpass'],
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

    // statements are saved through the service so round_order is sequential
    for (const [i, player] of players.entries()) {
      await saveStatement(gameId, player.id, `Statement number ${i + 1}`)
    }
  })

  it('gives statements sequential round_order values', async () => {
    const { rows } = await pool.query(
      `SELECT round_order FROM statements WHERE game_id = $1 ORDER BY round_order`,
      [gameId],
    )
    expect(rows.map((r) => r.round_order)).toEqual([1, 2, 3])
  })

  it('advances to the next round', async () => {
    const result = await advanceRound(gameId)

    expect(result.round).toBe(2)
    expect(result.finished).toBe(false)

    const round = await getCurrentRound(gameId)
    expect(round.statement.content).toBe('Statement number 2')
  })

  it('finishes the game after the last statement', async () => {
    await advanceRound(gameId) // -> 2
    await advanceRound(gameId) // -> 3
    const result = await advanceRound(gameId) // no round 4

    expect(result.finished).toBe(true)
    expect(result.status).toBe('finished')

    const round = await getCurrentRound(gameId)
    expect(round.status).toBe('finished')
    expect(round.statement).toBeNull()
  })

  it('throws for an unknown game', async () => {
    await expect(advanceRound(999999)).rejects.toThrow('Game not found')
  })

  it('reports vote progress with the author counted as voted', async () => {
    // round 1 statement belongs to Ana (players[0])
    const before = await getVoteProgress(gameId)

    expect(before.votesIn).toBe(0)
    expect(before.votesNeeded).toBe(2)
    expect(before.allVotesIn).toBe(false)

    const ana = before.players.find((p) => p.name === 'Ana')
    expect(ana.hasVoted).toBe(true) // author is masked as voted

    const { rows: stmt } = await pool.query(
      `SELECT id FROM statements WHERE game_id = $1 AND round_order = 1`,
      [gameId],
    )

    await saveVote(gameId, stmt[0].id, players[1].id, players[0].id)
    await saveVote(gameId, stmt[0].id, players[2].id, players[0].id)

    const after = await getVoteProgress(gameId)
    expect(after.votesIn).toBe(2)
    expect(after.allVotesIn).toBe(true)
    expect(after.players.every((p) => p.hasVoted)).toBe(true)
  })
})
