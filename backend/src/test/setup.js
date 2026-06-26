import { beforeEach, afterAll } from 'vitest'
import { clearDatabase, closeDatabase } from './test-db.js'

beforeEach(async () => {
  await clearDatabase()
})

afterAll(async () => {
  await closeDatabase()
})