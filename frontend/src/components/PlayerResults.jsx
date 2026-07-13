import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getGameResults, getGame } from '../api/games'
import styles from './PlayerResults.module.css'

const POLL_INTERVAL_MS = 4000
const PASS_THRESHOLD = 51

const MOTIVATIONAL_MESSAGES = [
  'Your story shines through! Keep being unmistakably you. 🌟',
  'People really know you. That is a superpower! 💪',
  'Great statements leave a mark, and yours clearly did! 🔥',
  'Authenticity wins games. Well played! 🏅',
  'You made an impression that stuck. Amazing job! 🎉',
]

const MENTOR_MESSAGES = [
  'Your story deserves to be heard louder. Book a session with a mentor to sharpen it! 📚',
  'A little coaching goes a long way. Book with a mentor and level up your personal statement! 🚀',
  'Not everyone guessed you this time. A mentor can help your story stand out. Book a session! 🤝',
  'Time to polish that personal brand. Book with a mentor and make it unforgettable! ✨',
]

function pickRandom(messages) {
  return messages[Math.floor(Math.random() * messages.length)]
}

/**
 * What a player sees once the game is finished: their own statement,
 * the percentage of players that guessed them correctly, and either a
 * motivational card (51%+) or a "book a mentor" card (below 51%).
 * Polls the game and sends the player back to the very first screen
 * when the host ends it (the API starts returning 404).
 */
export default function PlayerResults({ gameId, playerName }) {
  const navigate = useNavigate()

  const [myResult, setMyResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Picked once so the message doesn't change on every poll/render
  const messageRef = useRef(null)

  const fetchResults = useCallback(async () => {
    try {
      const data = await getGameResults(gameId)
      const mine = data.results.find((r) => r.name === playerName)

      if (mine && messageRef.current === null) {
        messageRef.current = pickRandom(
          mine.percentage >= PASS_THRESHOLD ? MOTIVATIONAL_MESSAGES : MENTOR_MESSAGES,
        )
      }

      setMyResult(mine || null)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, playerName])

  // Watch the game itself: once the host ends it, the game returns
  // 404 and the player goes back to the join screen.
  const checkGameStillExists = useCallback(async () => {
    try {
      const game = await getGame(gameId)

      if (game === null) {
        navigate({ to: '/' })
      }
    } catch {
      // Network hiccup: try again on the next poll
    }
  }, [gameId, navigate])

  useEffect(() => {
    fetchResults()

    const interval = setInterval(checkGameStillExists, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [fetchResults, checkGameStillExists])

  if (loading) {
    return (
      <div className={styles.container}>
        <p>Loading your result...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchResults}>Try Again</button>
      </div>
    )
  }

  if (!myResult) {
    return (
      <div className={styles.container}>
        <p>Could not find your result in this game.</p>
      </div>
    )
  }

  const passed = myResult.percentage >= PASS_THRESHOLD

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🎉 Game Over!</h1>

      <div className={styles.scoreCard}>
        {myResult.statement && <p className={styles.statement}>"{myResult.statement}"</p>}
        <p className={styles.percentage}>{myResult.percentage}%</p>
        <p className={styles.detail}>
          {myResult.correctVotes} of {myResult.totalVotes} players guessed you correctly
        </p>
      </div>

      <div className={passed ? styles.motivationCard : styles.mentorCard}>{messageRef.current}</div>

      <p className={styles.waiting}>Waiting for the host to end the game...</p>
    </div>
  )
}
