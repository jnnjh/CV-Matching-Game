import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import VoteScreen from '../components/VoteScreen'
import { getCurrentRound } from '../api/rounds'
import { submitVote } from '../api/votes'

vi.mock('../api/rounds')
vi.mock('../api/votes')

const mockRound = {
  round: 1,
  statement: { id: 'statement-1', content: 'I once debugged code at 2am' },
  choices: [
    { id: 'player-1', name: 'June' },
    { id: 'player-2', name: 'Joanne' },
    { id: 'player-3', name: 'Alex' },
  ],
}

describe('VoteScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCurrentRound.mockResolvedValue(mockRound)
  })

  // The project's vitest config doesn't enable globals, so
  // testing-library's auto-cleanup never runs. Do it manually.
  afterEach(() => {
    cleanup()
  })

  it('renders the statement and player options', async () => {
    render(<VoteScreen gameId="game-1" playerName="June" />)

    // Statement is displayed
    expect(await screen.findByText(/I once debugged code at 2am/)).toBeInTheDocument()

    // Other players show up as options
    expect(screen.getByRole('button', { name: /Joanne/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Alex/ })).toBeInTheDocument()

    // The current player can't vote for themselves
    expect(screen.queryByRole('button', { name: /June/ })).not.toBeInTheDocument()
  })

  it('submits a vote with the selected player', async () => {
    submitVote.mockResolvedValue({ success: true, vote: { id: 'vote-1' } })
    const user = userEvent.setup()

    render(<VoteScreen gameId="game-1" playerName="June" />)

    // Pick Joanne and submit
    await user.click(await screen.findByRole('button', { name: /Joanne/ }))
    await user.click(screen.getByRole('button', { name: /Submit Vote/ }))

    await waitFor(() => {
      expect(submitVote).toHaveBeenCalledWith(
        'game-1', // gameId
        'statement-1', // statementId
        'player-1', // voterId (June)
        'player-2', // guessedUserId (Joanne)
      )
    })

    // Confirmation appears
    expect(await screen.findByText(/Vote submitted/)).toBeInTheDocument()
  })
})
