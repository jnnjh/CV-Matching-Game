import express from 'express'
import { userRoutes } from './routes/users.js'
import { gameRoutes } from './routes/games.js'

export const app = express()

app.use(express.json())

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

app.use('/api/users', userRoutes)

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/games', gameRoutes)
