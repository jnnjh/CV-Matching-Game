import { Router } from 'express';
import { pool } from '../db/pool.js';
import { validateGameCode, addPlayerToGame } from '../services/players.js';

export const playerRoutes = Router();

playerRoutes.post('/', async (req, res) => {
  try {
    const { gameCode, name } = req.body;

    // Validate required fields
    if (!gameCode) {
      return res.status(400).json({ error: 'Game code is required' });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate the game code
    const validation = await validateGameCode(gameCode);
    
    if (!validation.valid) {
      if (validation.error === 'Invalid game code') {
        return res.status(404).json({ error: 'Game not found' });
      }
      if (validation.error === 'Game has expired') {
        return res.status(410).json({ error: 'Game has expired' });
      }
      return res.status(403).json({ error: validation.error });
    }

    // Check if player name already exists in this game
    const { rows: existingUsers } = await pool.query(
      `
      SELECT id FROM users 
      WHERE game_id = $1 AND name ILIKE $2
      `,
      [validation.game.id, name.trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ error: 'A player with this name already exists in the game' });
    }

    // Add the player to the game
    const player = await addPlayerToGame(validation.game.id, name.trim());

    res.status(201).json({
      success: true,
      player: player,
      game: {
        id: validation.game.id,
        gameCode: validation.game.game_code,
        status: validation.game.status
      }
    });
  } catch (error) {
  console.error('Error joining game:', error)

  if (error.message === 'Game is full (maximum 10 players)') {
    return res.status(400).json({ error: error.message })
  }

  res.status(500).json({ error: 'Failed to join game' })
}
});