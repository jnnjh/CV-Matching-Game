import express from 'express'
import { userRoutes } from './routes/users.js'
import { gameRoutes } from './routes/games.js'
import { playerRoutes } from './routes/players.js'
import { lobbyRoutes } from './routes/lobby.js'
import { statementRoutes } from './routes/statements.js'
import { voteRoutes } from './routes/votes.js'

export const app = express()

app.use(express.json())

// CORS - Allow all origins for development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT,PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')

  // Handle preflight immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

app.use('/api/users', userRoutes)
app.use('/api/games', gameRoutes)
app.use('/api/players', playerRoutes)
app.use('/api/games', lobbyRoutes)
app.use('/api/statements', statementRoutes)
app.use('/api/votes', voteRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})
