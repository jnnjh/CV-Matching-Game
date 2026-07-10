import request from 'supertest'
import { app } from '../app.js'

describe('GET /api/health', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('ok')
  })
})
