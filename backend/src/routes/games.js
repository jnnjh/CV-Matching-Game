import { Router } from 'express'
import { createGame } from '../services/games.js'

export const gameRoutes = Router()

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