import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { getGameResults, getGame } from '../api/games'
import Brand from './Brand'
import styles from './PlayerResults.module.css'

const POLL_INTERVAL_MS = 4000
const PASS_THRESHOLD = 51

const MOTIVATIONAL_MESSAGES = [
  '🌟 Your story shines through! Keep being unmistakably you.',
  '💪 People really know you — that is a superpower!',
  '🔥 Great statements leave a mark. Yours clearly did!',
  '🏅 Authenticity wins games. Well played!',
  '🎉 You made an impression that stuck. Amazing job!',
  '👏 You told your story and everyone recognized it. That is real presence!',
  '🙌 Memorable, genuine, unmistakably you. Keep it up!',
  '📣 Your voice comes through loud and clear. Never lose that!',
  '🏆 The room knows who you are. That is how a strong personal story works!',
  '🚀 You did not just play the game — you owned your story!',
]

const MENTOR_MESSAGES = [
  '📚 Your story deserves to be heard louder. Book a session with a mentor to sharpen it!',
  '🚀 A little coaching goes a long way. Book a session with a mentor to level up your personal statement!',
  '🤝 Not everyone guessed you this time. A mentor can help your story stand out.',
  '✨ Time to polish that personal brand. Book a session with a mentor to make it unforgettable!',
  '💡 Your story has potential — it just needs a spotlight. A mentor can help you find it.',
  '💎 Hidden gems need a little polish. Book a session with a mentor and let yours shine!',
  '🛬 Flying under the radar? A mentor can help your story land.',
  '✏️ Every great story gets an editor. Book a session with a mentor to sharpen yours!',
  '🎯 You have a story worth telling. A mentor can help you tell it better.',
  '🌱 Blending in is easy. Standing out is a skill. Learn it with a mentor!',
]

function pickRandom(messages) {
  return messages[Math.floor(Math.random() * messages.length)]
}

export default function PlayerResults({ gameId, playerName }) {
  const navigate = useNavigate()

  const [myResult, setMyResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const messageRef = useRef(null)
  const cardColorRef = useRef(null) // ← Track which color to use

  const fetchResults = useCallback(async () => {
    try {
      const data = await getGameResults(gameId)
      const mine = data.results.find((r) => r.name === playerName)

      if (mine && messageRef.current === null) {
        const passed = mine.percentage >= PASS_THRESHOLD
        const isZero = mine.percentage === 0

        // Pick message based on threshold (green vs yellow/red)
        messageRef.current = passed 
          ? pickRandom(MOTIVATIONAL_MESSAGES) 
          : pickRandom(MENTOR_MESSAGES)

        // Pick card color based on score
        if (passed) {
          cardColorRef.current = 'green'
        } else if (isZero) {
          cardColorRef.current = 'red'
        } else {
          cardColorRef.current = 'yellow'
        }
      }

      setMyResult(mine || null)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId, playerName])

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
        <p className={styles.loading}>Loading your result...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Brand />
        <div className={styles.error}>❌ {error}</div>
        <button onClick={fetchResults}>Try Again</button>
      </div>
    )
  }

  if (!myResult) {
    return (
      <div className={styles.container}>
        <Brand />
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>
          Could not find your result in this game.
        </p>
      </div>
    )
  }

  const passed = myResult.percentage >= PASS_THRESHOLD

  // Determine card class
  let cardClass = styles.motivationCard
  if (!passed && myResult.percentage === 0) {
    cardClass = styles.redCard
  } else if (!passed) {
    cardClass = styles.mentorCard
  }

  return (
    <div className={styles.container}>
      <Brand />
      <h1 className={styles.title}>🎉 Game Over!</h1>

      <div className={styles.scoreCard}>
        {myResult.statement && <p className={styles.statement}>"{myResult.statement}"</p>}
        <p className={styles.percentage}>{myResult.percentage}%</p>
        <p className={styles.detail}>
          {myResult.correctVotes} of {myResult.totalVotes} players guessed you correctly
        </p>
      </div>

      <div className={cardClass}>
        {messageRef.current}
        {!passed && (
          <a
            href="https://pairscheduling.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mentorLink}
          >
            👉 Book a session with a mentor
          </a>
        )}
      </div>

      <p className={styles.waiting}>Waiting for the host to end the game...</p>
    </div>
  )
}