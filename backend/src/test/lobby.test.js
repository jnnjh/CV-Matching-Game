import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { pool } from '../db/pool.js';

describe('GET /api/games/:gameId/players', () => {
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
      ['LOBBY12', 'testpass']
    );
    testGameId = rows[0].id;
    testGameCode = rows[0].game_code;

    // Add test players
    await pool.query(
      `
      INSERT INTO users (game_id, name, is_host)
      VALUES 
        ($1, 'Alice', true),
        ($1, 'Bob', false),
        ($1, 'Charlie', false)
      `,
      [testGameId]
    );
  });

  afterEach(async () => {
    // Clean up
    await pool.query('DELETE FROM users WHERE game_id = $1', [testGameId]);
    await pool.query('DELETE FROM games WHERE id = $1', [testGameId]);
  });

  it('should return players for a valid game', async () => {
    const response = await request(app)
      .get(`/api/games/${testGameId}/players`);

    expect(response.status).toBe(200);
    expect(response.body.players).toBeDefined();
    expect(response.body.count).toBe(3);
    expect(response.body.players[0].name).toBe('Alice');
    expect(response.body.players[0].is_host).toBe(true);
  });

  it('should return 404 for invalid game', async () => {
    // Use a valid UUID format that doesn't exist
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const response = await request(app)
      .get(`/api/games/${fakeId}/players`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Game not found');
  });

  it('should return empty array for empty lobby', async () => {
    // Create a game with no players (in a separate test)
    const { rows } = await pool.query(
      `
      INSERT INTO games (game_code, password, expires_at)
      VALUES ($1, $2, NOW() + INTERVAL '24 hours')
      RETURNING id
      `,
      ['EMPTY12', 'testpass']
    );
    const emptyGameId = rows[0].id;

    const response = await request(app)
      .get(`/api/games/${emptyGameId}/players`);

    expect(response.status).toBe(200);
    expect(response.body.players).toEqual([]);
    expect(response.body.count).toBe(0);

    // Clean up
    await pool.query('DELETE FROM games WHERE id = $1', [emptyGameId]);
  });
});