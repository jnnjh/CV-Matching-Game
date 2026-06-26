import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '../db/pool.js';
import { validateGameCode, addPlayerToGame } from '../services/players.js';

describe('Players Service', () => {
  let testGameId;
  let testGameCode;

  beforeEach(async () => {
    try {
      console.log('🔍 Setting up test...');
      
      // Create a test game
      const { rows } = await pool.query(
        `
        INSERT INTO games (game_code, password, expires_at)
        VALUES ($1, $2, NOW() + INTERVAL '24 hours')
        RETURNING id, game_code
        `,
        ['TEST12', 'testpass']
      );
      
      testGameId = rows[0].id;
      testGameCode = rows[0].game_code;
      
      console.log('✅ Test game created:', testGameCode, 'with ID:', testGameId);
      
    } catch (error) {
      console.error('❌ Failed to create test game:', error.message);
      throw error;
    }
  });

  afterEach(async () => {
    try {
      // Clean up test data
      if (testGameId) {
        await pool.query('DELETE FROM games WHERE id = $1', [testGameId]);
        console.log('✅ Test game cleaned up');
      }
    } catch (error) {
      console.error('❌ Failed to clean up test game:', error.message);
    }
  });

  it('should validate a valid game code', async () => {
    const result = await validateGameCode(testGameCode);
    expect(result.valid).toBe(true);
    expect(result.game).toBeDefined();
    expect(result.game.game_code).toBe(testGameCode);
  });

  it('should reject an invalid game code', async () => {
    const result = await validateGameCode('INVALID');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid game code');
  });

  it('should add a player to the game', async () => {
    const player = await addPlayerToGame(testGameId, 'Test Player');
    
    expect(player).toBeDefined();
    expect(player.name).toBe('Test Player');
    expect(player.is_host).toBe(false);
    expect(player.game_id).toBe(testGameId);
  });
});