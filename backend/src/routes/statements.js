import { Router } from 'express';
import { pool } from '../db/pool.js';
import { saveStatement } from '../services/statements.js';

export const statementRoutes = Router();

/**
 * POST /api/statements
 * Save a player's CV statement
 * 
 * Request body:
 * {
 *   "gameCode": "ABC123",
 *   "playerName": "Alice",
 *   "content": "I am a React developer..."
 * }
 */
statementRoutes.post('/', async (req, res) => {
  try {
    const { gameCode, playerName, content } = req.body;

    // Validate required fields
    if (!gameCode) {
      return res.status(400).json({ error: 'Game code is required' });
    }
    if (!playerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Statement content is required' });
    }

    // Find the game
    const gameResult = await pool.query(
      `
      SELECT id FROM games WHERE game_code = $1 AND expires_at > NOW()
      `,
      [gameCode]
    );

    if (gameResult.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found or expired' });
    }

    const gameId = gameResult.rows[0].id;

    // Find the player
    const playerResult = await pool.query(
      `
      SELECT id FROM users WHERE game_id = $1 AND name ILIKE $2
      `,
      [gameId, playerName]
    );

    if (playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found in this game' });
    }

    const userId = playerResult.rows[0].id;

    // Save the statement
    const statement = await saveStatement(gameId, userId, content.trim());

    res.status(201).json({
      success: true,
      statement,
    });
  } catch (error) {
    console.error('Error saving statement:', error);
    
    if (error.message === 'You have already submitted a statement for this game') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Failed to save statement' });
  }
});