import { Router } from 'express';
import { getPlayersByGameId, gameExists } from '../services/lobby.js';

export const lobbyRoutes = Router();

/**
 * GET /api/games/:gameId/players
 * Returns all players in a game lobby
 */
lobbyRoutes.get('/:gameId/players', async (req, res) => {
  try {
    const { gameId } = req.params;

    // Check if game exists
    const exists = await gameExists(gameId);
    if (!exists) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get players
    const players = await getPlayersByGameId(gameId);

    res.json({
      players,
      count: players.length,
    });
  } catch (error) {
    console.error('Error fetching lobby players:', error);
    res.status(500).json({ error: 'Failed to fetch lobby players' });
  }
});