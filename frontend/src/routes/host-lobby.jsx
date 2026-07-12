import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { QRCodeCanvas } from 'qrcode.react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getLobbyPlayers } from '../api/lobby'
import { startGame } from '../api/games'
import { getSubmissionStatusMap } from '../utils/getSubmissionStatusMap'
import { LobbyPlayerCard } from '../components/LobbyPlayerCard'

const MIN_PLAYERS = 3
const MAX_PLAYERS = 10

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

  //Guards the auto-start so it only ever fires once,
  // even though the lobby polls every 5 seconds
  const autoStartTriggered = useRef(false)

  const fetchPlayers = useCallback(async () => {
    try {
      const data = await getLobbyPlayers(search.gameId)

      setPlayers(data.players)

      const statusMap = await getSubmissionStatusMap(search.gameCode, data.players)

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

  const handleStartGame = useCallback(async () => {
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
      setStarting(false)
    }
  }, [navigate, search.gameId, search.gameCode])

  // Auto-start: when the lobby is full (10 players) and everyone has
  // submitted their statement, the game starts without the host clicking
  const allReady = players.length > 0 && players.every((player) => submissionStatusMap[player.id])

  useEffect(() => {
    if (players.length === MAX_PLAYERS && allReady && !autoStartTriggered.current && !starting) {
      autoStartTriggered.current = true
      handleStartGame()
    }
  }, [players.length, allReady, starting, handleStartGame])

  const canStart = players.length >= MIN_PLAYERS && !starting

  return (
    <div>
      <h1>🎮 Host Lobby</h1>

      <p>
        Game Code: <strong>{search.gameCode}</strong>
      </p>

      <QRCodeCanvas value={joinUrl} size={180} />

      <p>Scan to join</p>

      <button onClick={() => navigator.clipboard.writeText(joinUrl)}>Copy Join Link</button>

      <hr />

      <h2>
        Players ({players.length} / {MAX_PLAYERS})
      </h2>

      <div>
        {players.map((player) => (
          <LobbyPlayerCard
            key={player.id}
            player={player}
            isReady={submissionStatusMap[player.id]}
          />
        ))}
      </div>
      {players.length === MAX_PLAYERS && (
        <p>
          Lobby is full! The game will start automatically once everyone has submitted their
          statement.
        </p>
      )}

      <button onClick={handleStartGame} disabled={!canStart}>
        {starting ? 'Starting...' : 'Start Game'}
      </button>
    </div>
  )
}
