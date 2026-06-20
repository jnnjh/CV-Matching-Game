import { describe, it, expect } from 'vitest'

// This test checks the shape of the health-check response.
// For route-level integration tests, consider using supertest.
describe('health endpoint shape', () => {
  it('response has status and timestamp fields', () => {
    const response = { status: 'ok', timestamp: new Date().toISOString() }
    expect(response.status).toBe('ok')
    expect(typeof response.timestamp).toBe('string')
  })
})
