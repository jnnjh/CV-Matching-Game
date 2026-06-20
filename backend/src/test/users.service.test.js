import { describe, it, expect, vi, beforeEach } from 'vitest'

// When testing services that use the DB, we mock the pool
// so tests run without a real database connection.
vi.mock('../db/pool.js', () => ({
  pool: {
    query: vi.fn(),
  },
}))

import { pool } from '../db/pool.js'
import { getAllUsers, getUserById } from '../services/users.js'

const MOCK_USERS = [
  { id: 1, name: 'Alice García', role: 'Frontend Developer' },
  { id: 2, name: 'Bob Mwangi', role: 'Backend Developer' },
]

describe('users service (with mocked DB)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('getAllUsers returns rows from the database', async () => {
    pool.query.mockResolvedValueOnce({ rows: MOCK_USERS })

    const users = await getAllUsers()
    expect(users).toHaveLength(2)
    expect(users[0].name).toBe('Alice García')
  })

  it('getUserById returns the correct user', async () => {
    pool.query.mockResolvedValueOnce({ rows: [MOCK_USERS[0]] })

    const user = await getUserById(1)
    expect(user?.id).toBe(1)
    expect(user?.name).toBe('Alice García')
  })

  it('getUserById returns null when not found', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    const user = await getUserById(999)
    expect(user).toBeNull()
  })
})
