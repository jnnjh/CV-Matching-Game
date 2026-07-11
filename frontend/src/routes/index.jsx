import { createFileRoute, useNavigate } from '@tanstack/react-router'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>CV Matching Game</h1>

      <p className={styles.subtitle}>
        Match each anonymous personal statement to the correct player.
      </p>

      <button
        className={styles.primaryButton}
        onClick={() => navigate({ to: '/create-game' })}
      >
        🎮 Create Game
      </button>

      <button
        className={styles.secondaryButton}
        onClick={() => navigate({ to: '/join' })}
      >
        🚪 Join Game
      </button>
    </div>
  )
}