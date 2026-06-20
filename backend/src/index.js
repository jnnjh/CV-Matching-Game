import express from 'express'
import { userRoutes } from './routes/users.js'
import { pool } from './db/pool.js'

const app = express()
const PORT = Number(process.env.PORT) || 3000

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json())

// Allow requests from the frontend dev server
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// Never let the browser cache API responses — avoids stale data after DB resets
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

// ── Routes ──────────────────────────────────────────────────────────────────
// Mount route files here. Keep index.ts clean – one line per feature.
app.use('/api/users', userRoutes)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
  // Check DB connection on startup
  try {
    const client = await pool.connect()
    console.log('🐘 PostgreSQL connected')
    client.release()
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err)
  }
})
