import { createFileRoute } from '@tanstack/react-router'
import HostRoundScreen from '../components/HostRoundScreen'

export const Route = createFileRoute('/host-round/$gameId')({
  component: HostRoundPage,
})

function HostRoundPage() {
  const { gameId } = Route.useParams()

  return <HostRoundScreen gameId={gameId} />
}
