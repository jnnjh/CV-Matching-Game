import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { QRCodeCanvas } from 'qrcode.react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { getLobbyPlayers } from '../api/lobby'
import { startGame } from '../api/games'
import { getSubmissionStatusMap } from '../utils/getSubmissionStatusMap'
import { LobbyPlayerCard } from '../components/LobbyPlayerCard'
import Brand from '../components/Brand'
import styles from './host-lobby.module.css'

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
        to: '/host-round/$gameId',
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

  const allReady = players.length > 0 && players.every((player) => submissionStatusMap[player.id])

  useEffect(() => {
    if (players.length === MAX_PLAYERS && allReady && !autoStartTriggered.current && !starting) {
      autoStartTriggered.current = true
      handleStartGame()
    }
  }, [players.length, allReady, starting, handleStartGame])

  const canStart = players.length >= MIN_PLAYERS && !starting

  return (
    <div className={styles.container}>
      <Brand />

      <h1 className={styles.title}>👑 Host Lobby</h1>

      {/* Game Code & QR Section */}
      <div className={styles.gameInfo}>
        <div className={styles.gameCodeSection}>
          <p className={styles.codeLabel}>Game Code</p>
          <p className={styles.gameCode}>{search.gameCode}</p>
        </div>

        <div className={styles.qrSection}>
          <QRCodeCanvas value={joinUrl} size={140} />
          <p className={styles.qrLabel}>Scan to join</p>
          <button
            onClick={() => navigator.clipboard.writeText(joinUrl)}
            className={styles.copyButton}
          >
            📋 Copy Join Link
          </button>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Players Section */}
      <div className={styles.playersSection}>
        <h2 className={styles.playersTitle}>
          Players ({players.length} / {MAX_PLAYERS})
        </h2>

        <div className={styles.playerList}>
          {players.map((player) => (
            <LobbyPlayerCard
              key={player.id}
              player={player}
              isReady={submissionStatusMap[player.id]}
            />
          ))}
        </div>

        {players.length < MIN_PLAYERS && (
          <p className={styles.waitingMessage}>
            ⏳ Waiting for players... at least {MIN_PLAYERS} are needed to start.
          </p>
        )}

        {players.length === MAX_PLAYERS && (
          <p className={styles.fullMessage}>
            🎉 Lobby is full! The game will start automatically once everyone is ready.
          </p>
        )}

        <button
          onClick={handleStartGame}
          disabled={!canStart}
          className={styles.startButton}
        >
          {starting ? 'Starting...' : '🚀 Start Game'}
        </button>
      </div>
    </div>
  )
}