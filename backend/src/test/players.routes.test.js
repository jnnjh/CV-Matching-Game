import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';

describe('POST /api/players', () => {
  let testGameId;
  let testGameCode;

  beforeEach(async () => {
    // Create a test game
    const { rows } = await pool.query(
      `
      INSERT INTO games (game_code, password, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      RETURNING id, game_code
      `,
      ['JOIN12', 'testpass']
    );
    testGameId = rows[0].id;
    testGameCode = rows[0].game_code;
  });

  afterEach(async () => {
    // Clean up test data
    if (testGameId) {
      await pool.query('DELETE FROM games WHERE id = $1', [testGameId]);
    }
    // Clean up any users that might have been created
    await pool.query('DELETE FROM users WHERE game_id = $1', [testGameId]);
  });

  describe('Valid Joins', () => {
    it('should allow a player to join a valid game', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({
          gameCode: testGameCode,
          name: 'Alice'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.player).toBeDefined();
      expect(response.body.player.name).toBe('Alice');
      expect(response.body.player.is_host).toBe(false);
      expect(response.body.game).toBeDefined();
      expect(response.body.game.gameCode).toBe(testGameCode);
    });
  });

  describe('Invalid Joins', () => {
    it('should reject missing game code', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({
          name: 'Alice'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Game code is required');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({
          gameCode: testGameCode
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name is required');
    });

    it('should reject invalid game code', async () => {
      const response = await request(app)
        .post('/api/players')
        .send({
          gameCode: 'INVALID',
          name: 'Alice'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Game not found');
    });

    it('should reject duplicate names', async () => {
      // First join
      await request(app)
        .post('/api/players')
        .send({
          gameCode: testGameCode,
          name: 'Duplicate'
        });

      // Second join with same name
      const response = await request(app)
        .post('/api/players')
        .send({
          gameCode: testGameCode,
          name: 'Duplicate'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('A player with this name already exists in the game');
    });
  });
});