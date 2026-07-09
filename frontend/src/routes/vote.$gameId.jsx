import { createFileRoute, useParams, useSearch } from '@tanstack/react-router'
import VoteScreen from '../components/VoteScreen'

export const Route = createFileRoute('/vote/$gameId')({
  component: VotePage,
})

function VotePage() {
  const { gameId } = useParams({ from: '/vote/$gameId' })
  const search = useSearch({ from: '/vote/$gameId' })

  const playerName = search?.playerName || ''

  return <VoteScreen gameId={gameId} playerName={playerName} />
}
