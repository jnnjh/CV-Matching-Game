import { Router } from 'express'
import { saveVote, getVoteStatus } from '../services/votes.js'

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

/**
 * GET /api/votes/status?statementId=1&voterId=2
 * Whether a voter has already voted on a statement
 */
voteRoutes.get('/status', async (req, res) => {
  try {
    const { statementId, voterId } = req.query

    if (!statementId || !voterId) {
      return res.status(400).json({ error: 'statementId and voterId are required' })
    }

    const status = await getVoteStatus(statementId, voterId)

    res.status(200).json(status)
  } catch (error) {
    console.error('Error fetching vote status:', error)
    res.status(500).json({ error: 'Failed to fetch vote status' })
  }
})
