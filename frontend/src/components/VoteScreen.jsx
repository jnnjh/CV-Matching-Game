import { useState, useEffect, useCallback } from 'react'
import { getCurrentRound } from '../api/rounds'
import { submitVote } from '../api/votes'
import styles from './VoteScreen.module.css'

export default function VoteScreen({ gameId, playerName, onVoteSuccess }) {
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)

  const fetchRound = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getCurrentRound(gameId)
      setRound(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchRound()
  }, [fetchRound])

  // The current player's id comes from matching their name in the choices list
  const currentPlayer = round?.choices?.find((p) => p.name === playerName)

  const handleSubmit = async () => {
    if (!selectedId) {
      setSubmitError('👆 Pick a player first!')
      return
    }

    if (!currentPlayer) {
      setSubmitError('Could not find you in this game.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const result = await submitVote(gameId, round.statement.id, currentPlayer.id, selectedId)
      setHasVoted(true)

      if (onVoteSuccess) {
        onVoteSuccess(result)
      }
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading round...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchRound}>Try Again</button>
      </div>
    )
  }

  // Players can't vote for themselves, so hide the current player from options
  const options = round.choices.filter((p) => p.name !== playerName)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🕵️ Who wrote this?</h1>
      <p className={styles.roundLabel}>Round {round.round}</p>

      <blockquote className={styles.statement}>"{round.statement.content}"</blockquote>

      {hasVoted ? (
        <div className={styles.success}>✅ Vote submitted! Waiting for other players...</div>
      ) : (
        <>
          <div className={styles.options}>
            {options.map((player) => (
              <button
                key={player.id}
                type="button"
                className={
                  selectedId === player.id
                    ? `${styles.option} ${styles.optionSelected}`
                    : styles.option
                }
                onClick={() => setSelectedId(player.id)}
                disabled={submitting}
              >
                <span className={styles.optionAvatar}>{player.name.charAt(0).toUpperCase()}</span>
                {player.name}
              </button>
            ))}
          </div>

          {submitError && <div className={styles.error}>{submitError}</div>}

          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={submitting || !selectedId}
          >
            {submitting ? 'Submitting...' : 'Submit Vote'}
          </button>
        </>
      )}
    </div>
  )
}
