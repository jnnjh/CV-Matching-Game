import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentRound } from '../api/rounds'
import { submitVote, getVoteStatus } from '../api/votes'
import Brand from './Brand'
import styles from './VoteScreen.module.css'

const POLL_INTERVAL_MS = 3000

export default function VoteScreen({ gameId, playerName, onVoteSuccess, onGameFinished }) {
  const [round, setRound] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isOwnStatement, setIsOwnStatement] = useState(false)
  const [finished, setFinished] = useState(false)

  const lastRoundRef = useRef(null)

  const fetchRound = useCallback(async () => {
    try {
      const data = await getCurrentRound(gameId)

      if (data.status === 'finished') {
        setFinished(true)
        if (onGameFinished) onGameFinished()
        return
      }

      setRound(data)
      setError(null)

      const isNewRound = lastRoundRef.current !== null && lastRoundRef.current !== data.round

      if (isNewRound) {
        setHasVoted(false)
        setSelectedId(null)
        setSubmitError(null)
        setIsOwnStatement(false)
      }

      if ((lastRoundRef.current === null || isNewRound) && data.statement) {
        const me = data.choices?.find((p) => p.name === playerName)

        if (me) {
          try {
            const status = await getVoteStatus(data.statement.id, me.id)
            if (status.hasVoted) setHasVoted(true)
            setIsOwnStatement(Boolean(status.isOwnStatement))
          } catch {
            // Non-fatal
          }
        }
      }

      lastRoundRef.current = data.round
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, playerName, onGameFinished])

  useEffect(() => {
    fetchRound()

    const interval = setInterval(fetchRound, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchRound])

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
      if (err.message === 'You have already voted on this statement') {
        setHasVoted(true)
      } else {
        setSubmitError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (finished) {
    return null
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading round...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Brand />
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchRound}>Try Again</button>
      </div>
    )
  }

  const options = round.choices.filter((p) => p.name !== playerName)

  return (
    <div className={styles.container}>
      <Brand />
      <h1 className={styles.title}>🕵️ Who wrote this?</h1>
      <p className={styles.roundLabel}>Round {round.round}</p>

      <blockquote className={styles.statement}>{round.statement.content}</blockquote>

      {isOwnStatement ? (
        <div className={styles.ownStatement}>
          ✨ This is your statement, time to test who knows you best!
        </div>
      ) : hasVoted ? (
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