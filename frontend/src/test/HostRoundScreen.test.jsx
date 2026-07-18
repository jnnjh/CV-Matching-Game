import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HostRoundScreen from '../components/HostRoundScreen'
import * as roundsApi from '../api/rounds'

vi.mock('../components/Brand', () => ({
  default: () => <div data-testid="brand" />,
}))

vi.mock('../api/rounds')

const progress = {
  round: 1,
  status: 'started',
  votesIn: 1,
  votesNeeded: 2,
  allVotesIn: false,
  players: [
    { id: 1, name: 'Ana', hasVoted: true },
    { id: 2, name: 'Ben', hasVoted: true },
    { id: 3, name: 'Cy', hasVoted: false },
  ],
}

const round = {
  round: 1,
  status: 'started',
  statement: { id: 10, content: 'I once met a llama' },
  choices: [],
}

describe('HostRoundScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the statement, vote counter and player names', async () => {
    roundsApi.getVoteProgress.mockResolvedValue(progress)
    roundsApi.getCurrentRound.mockResolvedValue(round)

    render(<HostRoundScreen gameId="1" />)

    expect(await screen.findByText(/I once met a llama/)).toBeInTheDocument()
    expect(
      screen.getByText((_, element) => element?.textContent === 'Votes in: 1 / 2')
    ).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Cy')).toBeInTheDocument()
  })

  it('disables Next Statement until all votes are in', async () => {
    roundsApi.getVoteProgress.mockResolvedValue(progress)
    roundsApi.getCurrentRound.mockResolvedValue(round)

    render(<HostRoundScreen gameId="1" />)

    const button = await screen.findByRole('button', { name: /waiting for votes/i })
    expect(button).toBeDisabled()
  })

  it('advances the round when all votes are in', async () => {
    roundsApi.getVoteProgress.mockResolvedValue({
      ...progress,
      votesIn: 2,
      allVotesIn: true,
      players: progress.players.map((p) => ({ ...p, hasVoted: true })),
    })
    roundsApi.getCurrentRound.mockResolvedValue(round)
    roundsApi.nextRound.mockResolvedValue({ round: 2, status: 'started', finished: false })

    render(<HostRoundScreen gameId="1" />)

    const button = await screen.findByRole('button', { name: /next statement/i })
    await userEvent.click(button)

    await waitFor(() => expect(roundsApi.nextRound).toHaveBeenCalledWith('1'))
  })

  it('shows the finished screen when statements run out', async () => {
    roundsApi.getVoteProgress.mockResolvedValue({ ...progress, status: 'finished' })

    render(<HostRoundScreen gameId="1" />)

    expect(await screen.findByText(/all statements done/i)).toBeInTheDocument()
  })
})
