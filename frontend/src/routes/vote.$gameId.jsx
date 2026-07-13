import { useState } from 'react'
import { createFileRoute, useParams, useSearch } from '@tanstack/react-router'
import VoteScreen from '../components/VoteScreen'
import PlayerResults from '../components/PlayerResults'

export const Route = createFileRoute('/vote/$gameId')({
  component: VotePage,
})

function VotePage() {
  const { gameId } = useParams({ from: '/vote/$gameId' })
  const search = useSearch({ from: '/vote/$gameId' })

  const playerName = search?.playerName || ''

  // Once the game is finished the vote screen swaps to the player's
  // personal results (ticket 24)
  const [finished, setFinished] = useState(false)

  if (finished) {
    return <PlayerResults gameId={gameId} playerName={playerName} />
  }

  return (
    <VoteScreen gameId={gameId} playerName={playerName} onGameFinished={() => setFinished(true)} />
  )
}
