import { createFileRoute, useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/host-lobby')({
  component: HostLobbyPage,
})

function HostLobbyPage() {
  const search = useSearch({
    from: '/host-lobby',
  })

  return (
    <div>
      <h1>🎮 Host Lobby</h1>

      <p>
        Game Code: <strong>{search.gameCode}</strong>
      </p>

      <button>Start Game</button>
    </div>
  )
}