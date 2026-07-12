import { createFileRoute } from '@tanstack/react-router'
import HostRoundScreen from '../components/HostRoundScreen'

export const Route = createFileRoute('/host-round/$gameID')({
  component: RouteComponent,
})

function RouteComponent() {
  const { gameId } = useParams({ from: '/host-round/$gameId' })
  return <HostRoundScreen gameId={gameId} />
}
