import { createFileRoute, useNavigate } from '@tanstack/react-router'
import styles from './index.module.css'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className={styles.container}>
      {/* Floating question marks */}
      <div className={styles.questionMark} style={{ top: '12%', left: '12%', fontSize: '2.5rem', animationDelay: '0s' }}>❓</div>
      <div className={styles.questionMark} style={{ top: '18%', right: '15%', fontSize: '2rem', animationDelay: '1s' }}>❓</div>
      <div className={styles.questionMark} style={{ bottom: '25%', left: '18%', fontSize: '3rem', animationDelay: '2s' }}>❓</div>
      <div className={styles.questionMark} style={{ bottom: '30%', right: '12%', fontSize: '1.8rem', animationDelay: '0.5s' }}>❓</div>
      <div className={styles.questionMark} style={{ top: '45%', left: '6%', fontSize: '1.5rem', animationDelay: '1.5s' }}>❓</div>
      <div className={styles.questionMark} style={{ top: '40%', right: '6%', fontSize: '2.2rem', animationDelay: '2.5s' }}>❓</div>

      <img 
        src="/icon.png" 
        alt="CVVHO icon" 
        className={styles.icon}
      />

      <h1 className={styles.title}>
        C<span className={styles.vvOverlap}>VV</span>HO
      </h1>

      <p className={styles.subtitle}>
        See who wrote it. 🕵️
      </p>

      <div className={styles.divider} />

      <div className={styles.buttonGroup}>
        <button
          className={styles.hostButton}
          onClick={() => navigate({ to: '/create-game' })}
        >
          👑 Create Game (Host)
        </button>

        <button
          className={styles.playerButton}
          onClick={() => navigate({ to: '/join' })}
        >
          🚪 Join Game (Player)
        </button>
      </div>
    </div>
  )
}