import { createFileRoute, useSearch } from '@tanstack/react-router'
import { QRCodeCanvas } from 'qrcode.react'

export const Route = createFileRoute('/host-lobby')({
  component: HostLobbyPage,
})

function HostLobbyPage() {
  const search = useSearch({
    from: '/host-lobby',
  })

  const joinUrl = `${import.meta.env.VITE_APP_URL}/join-game?code=${search.gameCode}`

  return (
    <div>
      <h1>🎮 Host Lobby</h1>

      <p>
        Game Code: <strong>{search.gameCode}</strong>
      </p>

      <div>
        <QRCodeCanvas value={joinUrl} size={180} />

        <p>Scan to join</p>

        <button
          onClick={() => navigator.clipboard.writeText(joinUrl)}
        >
          Copy Join Link
        </button>

        <br />
        <br />

        <button>Start Game</button>
      </div>
    </div>
  )
}