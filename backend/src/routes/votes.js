import { Router } from 'express'
import { saveVote } from '../services/votes.js'

export const voteRoutes = Router()

/**
 * POST /api/votes
 * Save a player's vote for who wrote a statement
 *
 * Request body:
 * {
 *   "gameId": "uuid",
 *   "statementId": "uuid",
 *   "voterId": "uuid",
 *   "guessedUserId": "uuid"
 * }
 */
voteRoutes.post('/', async (req, res) => {
  try {
    const { gameId, statementId, voterId, guessedUserId } = req.body

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' })
    }
    if (!statementId) {
      return res.status(400).json({ error: 'Statement ID is required' })
    }
    if (!voterId) {
      return res.status(400).json({ error: 'Voter ID is required' })
    }
    if (!guessedUserId) {
      return res.status(400).json({ error: 'Guessed user ID is required' })
    }

    const vote = await saveVote(gameId, statementId, voterId, guessedUserId)

    res.status(201).json({
      success: true,
      vote,
    })
  } catch (error) {
    console.error('Error saving vote:', error)

    if (error.message === 'You cannot vote on your own statement') {
      return res.status(400).json({ error: error.message })
    }
    if (error.message === 'You have already voted on this statement') {
      return res.status(409).json({ error: error.message })
    }

    res.status(500).json({ error: 'Failed to save vote' })
  }
})
