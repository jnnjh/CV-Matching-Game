import { app } from './app.js'
import { pool } from './db/pool.js'
import { gameRoutes } from './routes/games.js'

const PORT = Number(process.env.PORT) || 3000

app.use('/api/games', gameRoutes)

app.listen(PORT, async () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)

  try {
    const client = await pool.connect()
    console.log('🐘 PostgreSQL connected')
    client.release()
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err)
  }
})