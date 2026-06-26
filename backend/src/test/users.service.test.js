import { describe, it, expect } from 'vitest'
import { getAllUsers } from '../services/users.js'

describe('Users Service', () => {
  it('should return an array', async () => {
    const users = await getAllUsers()

    expect(Array.isArray(users)).toBe(true)
  })
})