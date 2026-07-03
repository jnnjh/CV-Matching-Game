import { Router } from 'express'
import { createGame, startGame } from '../services/games.js'

export const gameRoutes = Router()

//--create game--//
gameRoutes.post('/', async (req, res) => {
  console.log(req.body)

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

    if (err.message === 'No users in game') {
      return res.status(404).json({ error: err.message })
    }

    res.status(500).json({ error: 'Failed to start game' })
  }
})