import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { QRCodeCanvas } from 'qrcode.react'
import { useState, useEffect, useCallback } from 'react'
import { getLobbyPlayers } from '../api/lobby'
import { startGame } from '../api/games'
import { getSubmissionStatusMap } from '../utils/getSubmissionStatusMap'
import { LobbyPlayerCard } from '../components/LobbyPlayerCard'

export const Route = createFileRoute('/host-lobby')({
  component: HostLobbyPage,
})

function HostLobbyPage() {
  const navigate = useNavigate()

  const search = useSearch({
    from: '/host-lobby',
  })

  const joinUrl = `${import.meta.env.VITE_APP_URL}/join-game?code=${search.gameCode}`

  const [players, setPlayers] = useState([])
  const [submissionStatusMap, setSubmissionStatusMap] = useState({})
  const [starting, setStarting] = useState(false)

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await getLobbyPlayers(search.gameId)

      setPlayers(data.players)

      const statusMap = await getSubmissionStatusMap(
        search.gameCode,
        data.players
      )

      setSubmissionStatusMap(statusMap)
    } catch (err) {
      console.error('Failed to fetch players:', err)
    }
  }, [search.gameId, search.gameCode])

  useEffect(() => {
    fetchPlayers()

    const interval = setInterval(fetchPlayers, 5000)

    return () => clearInterval(interval)
  }, [fetchPlayers])

  async function handleStartGame() {
    try {
      setStarting(true)

      await startGame(search.gameId)

      navigate({
        to: '/vote/$gameId',
        params: {
          gameId: String(search.gameId),
        },
        search: {
          gameCode: search.gameCode,
        },
      })
    } catch (err) {
      alert(err.message)
    } finally {
      setStarting(false)
    }
  }

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

      <div>
        {players.map((player) => (
          <LobbyPlayerCard
            key={player.id}
            player={player}
            isReady={submissionStatusMap[player.id]}
          />
        ))}
      </div>

      <button
        onClick={handleStartGame}
        disabled={starting}
      >
        {starting ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  )
}