import { useState, useEffect, useCallback } from 'react'
import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { jsPDF } from 'jspdf'
import { getGameResults, deleteGame } from '../api/games'
import Brand from '../components/Brand'
import styles from './host-results.module.css'

export const Route = createFileRoute('/host-results/$gameId')({
  component: HostResultsPage,
})

function HostResultsPage() {
  const navigate = useNavigate()
  const { gameId } = useParams({ from: '/host-results/$gameId' })

  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [hasDownloaded, setHasDownloaded] = useState(false)
  const [ending, setEnding] = useState(false)

  const fetchResults = useCallback(async () => {
    try {
      const data = await getGameResults(gameId)
      setResults(data.results)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchResults()
  }, [fetchResults])

  const handleDownload = () => {
    const doc = new jsPDF()

    doc.setFontSize(18)
    doc.text('CVVHO — Game Results', 14, 20)

    doc.setFontSize(11)
    doc.text(`Game #${gameId} - ${new Date().toLocaleString()}`, 14, 28)

    let y = 42

    results.forEach((player, i) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(13)
      doc.text(`${i + 1}. ${player.name} - ${player.percentage}%`, 14, y)

      doc.setFontSize(10)
      doc.text(`Statement: "${player.statement || 'No statement'}"`, 18, y + 6)
      doc.text(
        `${player.correctVotes} of ${player.totalVotes} players guessed correctly`,
        18,
        y + 12,
      )

      y += 24
    })

    doc.save(`cvvho-${gameId}-results.pdf`)
    setHasDownloaded(true)
  }

  const handleEndGame = async () => {
    setEnding(true)
    setError(null)

    try {
      await deleteGame(gameId)
      navigate({ to: '/' })
    } catch (err) {
      setError(err.message)
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <p className={styles.loading}>Loading results...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Brand />
      <h1 className={styles.title}>🏆 Results</h1>
      <p className={styles.subtitle}>Here's how everyone did!</p>

      {error && <div className={styles.error}>❌ {error}</div>}

      <div className={styles.resultsWrapper}>
        {results.map((player, index) => {
          let rankClass = styles.rankDefault
          if (index === 0) rankClass = styles.rankGold
          else if (index === 1) rankClass = styles.rankSilver
          else if (index === 2) rankClass = styles.rankBronze

          return (
            <div key={player.id} className={styles.resultCard}>
              <div className={`${styles.rankBadge} ${rankClass}`}>
                {index + 1}
              </div>
              <p className={styles.playerName}>{player.name}</p>
              <p className={styles.percentage}>{player.percentage}%</p>
              <p className={styles.detail}>
                {player.correctVotes}/{player.totalVotes}
              </p>
            </div>
          )
        })}
      </div>

      <div className={styles.buttonGroup}>
        {!hasDownloaded ? (
          <button className={styles.actionButton} onClick={handleDownload}>
            ⬇ Download Results
          </button>
        ) : (
          <button
            className={`${styles.actionButton} ${styles.endButton}`}
            onClick={handleEndGame}
            disabled={ending}
          >
            {ending ? 'Ending...' : '🛑 End Game'}
          </button>
        )}
      </div>
    </div>
  )
}