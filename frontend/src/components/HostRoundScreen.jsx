import { useState, useEffect, useCallback } from 'react'
import { getCurrentRound, nextRound, getVoteProgress } from '../api/rounds'
import styles from './HostRoundScreen.module.css'
import { removePlayer } from '../api/players'

const POLL_INTERVAL_MS = 3000

/**
 * The host's view during the game. The host is not a player: they don't
 * submit statements or vote. They see the current statement, live vote
 * progress (players who haven't voted stay greyed out), and a Next
 * Statement button that unlocks once every vote is in.
 */
export default function HostRoundScreen({ gameId, onGameFinished }) {
  const [round, setRound] = useState(null)
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [advancing, setAdvancing] = useState(false)
  const [finished, setFinished] = useState(false)
  const [removingId, setRemovingId] = useState(null)

  const fetchData = useCallback(async () => {
    try {
      const progressData = await getVoteProgress(gameId)
      setProgress(progressData)

      if (progressData.status === 'finished') {
        setFinished(true)
        if (onGameFinished) onGameFinished()
        return
      }

      const roundData = await getCurrentRound(gameId)
      setRound(roundData)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, onGameFinished])

  useEffect(() => {
    fetchData()

    const interval = setInterval(fetchData, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchData])

  const handleNextStatement = async () => {
    setAdvancing(true)
    setError(null)

    try {
      const result = await nextRound(gameId)

      if (result.finished) {
        setFinished(true)
        if (onGameFinished) onGameFinished()
      } else {
        await fetchData()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setAdvancing(false)
    }
  }

  const handleRemovePlayer = async (player) => {
    const confirmed = window.confirm(
      `Remove ${player.name} from the game? Their statement and votes will be deleted.`,
    )

    if (!confirmed) return

    setRemovingId(player.id)
    setError(null)

    try {
      const result = await removePlayer(player.id)

      if (result.status === 'finished') {
        setFinished(true)
        if (onGameFinished) onGameFinished()
      } else {
        await fetchData()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRemovingId(null)
    }
  }

  if (finished) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>🏁 All statements done!</h1>
        <p>Calculating the results...</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading round...</p>
      </div>
    )
  }

  if (error && !progress) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchData}>Try Again</button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎤 Host View</h1>
      <p className={styles.roundLabel}>Statement {progress?.round}</p>

      {round?.statement && (
        <blockquote className={styles.statement}>"{round.statement.content}"</blockquote>
      )}

      <p className={styles.votesCounter}>
        Votes in: {progress?.votesIn} / {progress?.votesNeeded}
      </p>

      <div className={styles.players}>
        {progress?.players?.map((player) => (
          <div
            key={player.id}
            className={player.hasVoted ? `${styles.player} ${styles.playerVoted}` : styles.player}
          >
            <span className={styles.playerAvatar}>{player.name.charAt(0).toUpperCase()}</span>
            <span className={styles.playerName}>{player.name}</span>
            {player.hasVoted && <span className={styles.check}>✓</span>}
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => handleRemovePlayer(player)}
              disabled={removingId !== null}
              aria-label={`Remove ${player.name}`}
              title={`Remove ${player.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <button
        type="button"
        className={styles.nextButton}
        onClick={handleNextStatement}
        disabled={advancing || !progress?.allVotesIn}
      >
        {advancing
          ? 'Loading...'
          : progress?.allVotesIn
            ? 'Next Statement →'
            : 'Waiting for votes...'}
      </button>
    </div>
  )
}
