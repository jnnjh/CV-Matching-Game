import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useState, useCallback } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { getLobbyPlayers } from '../api/lobby'
import { LobbyPlayerCard } from '../components/LobbyPlayerCard'

export const Route = createFileRoute('/host-lobby')({
  component: HostLobbyPage,
})

function HostLobbyPage() {
  const search = useSearch({
    from: '/host-lobby',
  })

  const [players, setPlayers] = useState([])

  const joinUrl = `${import.meta.env.VITE_APP_URL}/join-game?code=${search.gameCode}`

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await getLobbyPlayers(search.gameId)
      setPlayers(data.players)
    } catch (err) {
      console.error('Failed to fetch players:', err)
    }
  }, [search.gameId])

  useEffect(() => {
    fetchPlayers()

    const interval = setInterval(fetchPlayers, 5000)

    return () => clearInterval(interval)
  }, [fetchPlayers])

  return (
    <div>
      <h1>🎮 Host Lobby</h1>

      <p>
        Game Code: <strong>{search.gameCode}</strong>
      </p>

      <QRCodeCanvas value={joinUrl} size={180} />

      <p>Scan to join</p>

      <button onClick={() => navigator.clipboard.writeText(joinUrl)}>
        Copy Join Link
      </button>

      <hr />

      <h2>Players ({players.length})</h2>

      {players.length === 0 ? (
        <p>No players have joined yet.</p>
      ) : (
        <div>
          {players.map((player) => (
            <LobbyPlayerCard
              key={player.id}
              player={player}
              isReady={player.is_ready}
            />
          ))}
        </div>
      )}

      <br />

      <button>Start Game</button>
    </div>
  )
}