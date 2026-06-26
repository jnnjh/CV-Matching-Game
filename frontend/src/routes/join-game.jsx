import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/join-game')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/join-game"!</div>
}
