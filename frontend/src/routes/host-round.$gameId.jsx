import { createFileRoute, useNavigate } from '@tanstack/react-router'
import HostRoundScreen from '../components/HostRoundScreen'

export const Route = createFileRoute('/host-round/$gameId')({
  component: HostRoundPage,
})

function HostRoundPage() {
  const { gameId } = Route.useParams()
  const navigate = useNavigate()

  // When the statements run out the game flips to finished and the
  // host moves on to the results screen (ticket 24)
  const handleGameFinished = () => {
    navigate({ to: '/host-results/$gameId', params: { gameId } })
  }

  return <HostRoundScreen gameId={gameId} onGameFinished={handleGameFinished} />
}
