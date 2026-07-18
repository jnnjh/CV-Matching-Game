import { Router } from 'express'
import { gameExists, getPlayersByGameId } from '../services/lobby.js'

export const lobbyRoutes = Router()

/**
 * GET /api/games/:gameId/players
 * Returns all players in a game lobby
 */
lobbyRoutes.get('/:gameId/players', async (req, res) => {
  const { gameId } = req.params

  try {
    if (!(await gameExists(gameId))) {
      return res.status(404).json({
        error: 'Game not found',
      })
    }

    const players = await getPlayersByGameId(gameId)

    return res.json({
      players,
      count: players.length,
    })
  } catch (error) {
    console.error('Error fetching lobby players:', error)

    return res.status(500).json({
      error: 'Failed to fetch lobby players',
    })
  }
})