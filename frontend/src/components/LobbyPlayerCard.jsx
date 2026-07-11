import styles from './LobbyPlayerCard.module.css'

export function LobbyPlayerCard({
  player,
  isCurrentPlayer = false,
  isReady = false,
}) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt={player.name}
            className={styles.avatarImage}
          />
        ) : (
          player.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className={styles.info}>
        <p className={styles.name}>
          {player.name}

          {player.is_host && (
            <span className={styles.host}> 👑 Host</span>
          )}

          {isCurrentPlayer && (
            <span className={styles.you}> (you)</span>
          )}
        </p>

        <p className={styles.status}>
          {isReady ? (
            <span className={styles.ready}>
              ✅ Ready to play
            </span>
          ) : (
            <span className={styles.waiting}>
              ⏳ Waiting for statement...
            </span>
          )}
        </p>
      </div>
    </div>
  )
}