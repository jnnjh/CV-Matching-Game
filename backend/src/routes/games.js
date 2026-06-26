import { Router } from 'express'
import { createGame } from '../services/games.js'

export const gameRoutes = Router()

gameRoutes.post('/', async (req, res) => {
  console.log(req.body)
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({ error: 'Password required' })
    }

    const game = await createGame(password)

    res.status(201).json(game)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create game' })
  }
})