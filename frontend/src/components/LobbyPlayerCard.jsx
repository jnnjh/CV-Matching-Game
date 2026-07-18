import { useState } from 'react'
import styles from './LobbyPlayerCard.module.css'

export function LobbyPlayerCard({
  player,
  isCurrentPlayer,
  isReady,
  canEdit,
  onRename,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(player.name)

  async function handleRename() {
    const trimmedName = newName.trim()

    if (!trimmedName || trimmedName === player.name) {
      setIsEditing(false)
      return
    }

    await onRename(trimmedName)
    setIsEditing(false)
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleRename()
    }
  }

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
          <div className={styles.avatarPlaceholder}>
            {player.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.info}>
        <div className={styles.nameRow}>
          {isEditing && canEdit ? (
            <input
              type="text"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className={styles.nameInput}
            />
          ) : (
            <p className={styles.name}>
              {player.name}
              {player.is_host && (
                <span className={styles.hostBadge}>👑 Host</span>
              )}
              {isCurrentPlayer && (
                <span className={styles.youBadge}> (you)</span>
              )}
            </p>
          )}
        </div>

        <p className={styles.status}>
          {isReady ? (
            <span className={styles.statusReady}>✅ Ready</span>
          ) : (
            <span className={styles.statusWaiting}>
              <span className={styles.hourglass}>⏳</span>
              {' '}
              Waiting for statement
            </span>
          )}
        </p>
      </div>

      {canEdit && !isEditing && (
        <button
          type="button"
          className={styles.editButton}
          onClick={() => setIsEditing(true)}
          aria-label="Edit name"
        >
          ✏️
        </button>
      )}
    </div>
  )
}