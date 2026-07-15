import { Router } from 'express'
import {
  createGame,
  startGame,
  getCurrentRound,
  advanceRound,
  getGameResults,
  endGame,
} from '../services/games.js'
import { getVoteProgress } from '../services/votes.js'
import { pool } from '../db/pool.js'

export const gameRoutes = Router()

//--create game--//
gameRoutes.post('/', async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Host name required' })
    }

    const game = await createGame(name)

    res.status(201).json(game)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

//--start game--//
gameRoutes.post('/:gameId/start', async (req, res) => {
  try {
    const game = await startGame(req.params.gameId)

    res.status(200).json(game)
  } catch (err) {
    console.error(err)

    if (err.message === 'Not all users are ready') {
      return res.status(400).json({ error: err.message })
    }

    if (err.message === 'At least 3 players are required to start the game') {
      return res.status(400).json({ error: err.message })
    }

    if (err.message === 'No users in game') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to start game' })
  }
})

// NEW: get game status
gameRoutes.get('/:gameId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT id, status, current_round
      FROM games
      WHERE id = $1
      `,
      [req.params.gameId],
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch game' })
  }
})

//--current round--//
gameRoutes.get('/:gameId/current-round', async (req, res) => {
  try {
    const roundData = await getCurrentRound(req.params.gameId)

    res.status(200).json(roundData)
  } catch (err) {
    console.error(err)

    if (err.message === 'Game not found' || err.message === 'No statement found') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to fetch current round' })
  }
})

//--advance to the next statement (host control)--//
gameRoutes.post('/:gameId/next-round', async (req, res) => {
  try {
    const result = await advanceRound(req.params.gameId)

    res.status(200).json(result)
  } catch (err) {
    console.error(err)

    if (err.message === 'Game not found') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to advance to the next statement' })
  }
})

//--vote progress for the current statement (host screen)--//
gameRoutes.get('/:gameId/vote-progress', async (req, res) => {
  try {
    const progress = await getVoteProgress(req.params.gameId)

    res.status(200).json(progress)
  } catch (err) {
    console.error(err)

    if (err.message === 'Game not found') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to fetch vote progress' })
  }
})

//--final results (shown when the game is finished)--//
gameRoutes.get('/:gameId/results', async (req, res) => {
  try {
    const results = await getGameResults(req.params.gameId)

    res.status(200).json(results)
  } catch (err) {
    console.error(err)

    if (err.message === 'Game not found') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to fetch results' })
  }
})

//--end game: delete it and everything attached via ON DELETE CASCADE--//
gameRoutes.delete('/:gameId', async (req, res) => {
  try {
    const result = await endGame(req.params.gameId)

    res.status(200).json(result)
  } catch (err) {
    console.error(err)

    if (err.message === 'Game not found') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to end game' })
  }
})
