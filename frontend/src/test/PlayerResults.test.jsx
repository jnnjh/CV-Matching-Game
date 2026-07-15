import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PlayerResults from '../components/PlayerResults'
import * as gamesApi from '../api/games'

vi.mock('../api/games')
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

const results = {
  gameId: 1,
  status: 'finished',
  results: [
    {
      id: 1,
      name: 'June',
      statement: 'I once met a llama',
      totalVotes: 4,
      correctVotes: 3,
      percentage: 75,
    },
    {
      id: 2,
      name: 'Alex',
      statement: 'I hate coriander',
      totalVotes: 4,
      correctVotes: 1,
      percentage: 25,
    },
  ],
}

describe('PlayerResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    gamesApi.getGameResults.mockResolvedValue(results)
    gamesApi.getGame.mockResolvedValue({ id: 1, status: 'finished' })
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the player statement and percentage with a motivational card at 51%+', async () => {
    render(<PlayerResults gameId="1" playerName="June" />)

    expect(await screen.findByText(/I once met a llama/)).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    // Motivational cards never mention a mentor
    expect(screen.queryByText(/mentor/i)).not.toBeInTheDocument()
  })

  it('shows a book-a-mentor card below 51%', async () => {
    render(<PlayerResults gameId="1" playerName="Alex" />)

    expect(await screen.findByText('25%')).toBeInTheDocument()
    expect(screen.getByText(/mentor/i)).toBeInTheDocument()
  })

  it('shows only the current player result, not other players', async () => {
    render(<PlayerResults gameId="1" playerName="June" />)

    await screen.findByText('75%')
    expect(screen.queryByText(/coriander/)).not.toBeInTheDocument()
    expect(screen.queryByText('25%')).not.toBeInTheDocument()
  })
})
