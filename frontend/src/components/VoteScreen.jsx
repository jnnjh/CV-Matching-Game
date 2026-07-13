import { useState, useEffect, useCallback, useRef } from 'react'
import { getCurrentRound } from '../api/rounds'
import { submitVote, getVoteStatus } from '../api/votes'
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

  // Tracks which round we're on so we can reset the screen
  // when the host advances to the next statement
  const lastRoundRef = useRef(null)

  const fetchRound = useCallback(async () => {
    try {
      const data = await getCurrentRound(gameId)

      // Statements ran out: hand off to the parent immediately.
      // No game over screen — the route swaps to the results page.
      if (data.status === 'finished') {
        setFinished(true)
        if (onGameFinished) onGameFinished()
        return
      }

      setRound(data)
      setError(null)

      const isNewRound = lastRoundRef.current !== null && lastRoundRef.current !== data.round

      // New statement: unlock the screen so the player can vote again
      if (isNewRound) {
        setHasVoted(false)
        setSelectedId(null)
        setSubmitError(null)
        setIsOwnStatement(false)
      }

      // On first load (or a page refresh) and on every new round, ask the
      // backend two things about this player and the current statement:
      // did they already vote (keeps the lock refresh-proof), and is the
      // statement their own (they sit that round out). Both flags are
      // computed server-side so the author is never exposed to other
      // players' browsers.
      if ((lastRoundRef.current === null || isNewRound) && data.statement) {
        const me = data.choices?.find((p) => p.name === playerName)

        if (me) {
          try {
            const status = await getVoteStatus(data.statement.id, me.id)
            if (status.hasVoted) setHasVoted(true)
            setIsOwnStatement(Boolean(status.isOwnStatement))
          } catch {
            // Non-fatal: worst case the backend still rejects a duplicate or self vote
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
      // If the backend says we already voted, lock the screen too
      if (err.message === 'You have already voted on this statement') {
        setHasVoted(true)
      } else {
        setSubmitError(err.message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Game finished: render nothing. The parent route unmounts this
  // component and shows the results screen (ticket 24) in its place.
  if (finished) {
    return null
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
