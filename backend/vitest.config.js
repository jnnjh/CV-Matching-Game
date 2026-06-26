import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.js'],
    pool: 'forks',  // Add this to prevent parallel execution
    isolate: true,  // Add this to isolate tests
  },
})
