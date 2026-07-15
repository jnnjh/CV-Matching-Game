import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useParams, useSearch, useNavigate } from '@tanstack/react-router'
import { updatePlayerName } from '../api/players'
import { getLobbyPlayers } from '../api/lobby'
import { getSubmissionStatusMap } from '../utils/getSubmissionStatusMap'
import { LobbyPlayerCard } from '../components/LobbyPlayerCard'
import StatementForm from '../components/StatementForm'
import styles from './lobby.module.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const Route = createFileRoute('/lobby/$gameId')({
  component: LobbyPage,
})

function LobbyPage() {
  const navigate = useNavigate()

  const { gameId } = useParams({ from: '/lobby/$gameId' })
  const search = useSearch({ from: '/lobby/$gameId' })

  const gameCode = search?.gameCode || ''
  const playerName = search?.playerName || ''

  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [, setCheckingStatus] = useState(true)
  const [submissionStatusMap, setSubmissionStatusMap] = useState({})

  const checkSubmissionStatus = useCallback(async () => {
    if (!gameCode || !playerName) return

    try {
      const response = await fetch(
        `${API_URL}/api/statements/status?gameCode=${gameCode}&playerName=${encodeURIComponent(playerName)}`,
      )

      const data = await response.json()

      setHasSubmitted(data.submitted || false)
    } catch (err) {
      console.error(err)
    } finally {
      setCheckingStatus(false)
    }
  }, [gameCode, playerName])

  const checkGameStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/games/${gameId}`)

      if (!response.ok) return

      const game = await response.json()

      if (game.status === 'started') {
        navigate({
          to: '/vote/$gameId',
          params: { gameId: String(gameId) },
          search: { gameCode, playerName },
        })
      }
    } catch (err) {
      console.error(err)
    }
  }, [gameId, navigate, gameCode, playerName])

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true)

      const data = await getLobbyPlayers(gameId)

      setPlayers(data.players)

      const statusMap = await getSubmissionStatusMap(gameCode, data.players)

      setSubmissionStatusMap(statusMap)

      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, gameCode])

  useEffect(() => {
    fetchPlayers()
    checkSubmissionStatus()
    checkGameStatus()

    const interval = setInterval(() => {
      fetchPlayers()
      checkGameStatus()
    }, 5000)

    return () => clearInterval(interval)
  }, [fetchPlayers, checkSubmissionStatus, checkGameStatus])

  const handleStatementSuccess = () => {
    setHasSubmitted(true)

    setSubmissionStatusMap((prev) => {
      const currentPlayer = players.find((p) => p.name === playerName)

      if (!currentPlayer) return prev

      return {
        ...prev,
        [currentPlayer.id]: true,
      }
    })
  }

  const handleRename = async (newName) => {
    const currentPlayer = players.find((p) => p.name === playerName)

    if (!currentPlayer) {
      throw new Error('Could not find your player in the lobby')
    }

    await updatePlayerName(currentPlayer.id, newName)

    navigate({
      to: '/lobby/$gameId',
      params: { gameId: String(gameId) },
      search: { gameCode, playerName: newName },
      replace: true,
    })
  }

  if (loading && players.length === 0) {
    return (
      <div className={styles.container}>
        <p>Loading lobby...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>

        <button onClick={fetchPlayers}>Try Again</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎮 Waiting Room</h1>

      <div className={styles.gameInfo}>
        <p>
          Game Code: <strong>{gameCode || gameId}</strong>
        </p>

        <p className={styles.playerCount}>
          👥 {players.length} player{players.length !== 1 ? 's' : ''} in lobby
        </p>
      </div>

      <div className={styles.playerList}>
        {players.map((player) => (
          <LobbyPlayerCard
            key={player.id}
            player={player}
            isCurrentPlayer={player.name === playerName}
            isReady={submissionStatusMap[player.id] || false}
            canEdit={player.name === playerName}
            onRename={handleRename}
          />
        ))}
      </div>

      {players.length === 0 && (
        <div className={styles.empty}>
          <p>No players have joined yet.</p>
          <p>Share the game code to invite others!</p>
        </div>
      )}

      {gameCode && playerName && !hasSubmitted && (
        <StatementForm
          gameCode={gameCode}
          playerName={playerName}
          onSuccess={handleStatementSuccess}
        />
      )}

      {gameCode && playerName && hasSubmitted && (
        <div className={styles.submittedMessage}>
          ✅ You've submitted your statement! Waiting for others...
        </div>
      )}

      <div className={styles.waitingMessage}>
        <p>⏳ Waiting for host to start the game...</p>
      </div>
    </div>
  )
}
