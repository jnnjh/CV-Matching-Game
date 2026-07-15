import { useState } from 'react'
import styles from './LobbyPlayerCard.module.css'

export function LobbyPlayerCard({
  player,
  isCurrentPlayer = false,
  isReady = false,
  canEdit = false,
  onRename,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(player.name)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  const handleSave = async () => {
    const trimmed = newName.trim()

    if (!trimmed || trimmed === player.name) {
      setIsEditing(false)
      setEditError(null)
      return
    }

    try {
      setSaving(true)
      setEditError(null)
      await onRename(trimmed)
      setIsEditing(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setNewName(player.name)
    setIsEditing(false)
    setEditError(null)
  }

  return (
    <div className={styles.card}>
      <div className={styles.avatar}>
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className={styles.avatarImage} />
        ) : (
          player.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className={styles.info}>
        {isEditing ? (
          <div className={styles.editRow}>
            <input
              className={styles.editInput}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={30}
              disabled={saving}
              autoFocus
            />
            <button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancel} disabled={saving}>
              Cancel
            </button>
          </div>
        ) : (
          <p className={styles.name}>
            {player.name}

            {player.is_host && <span className={styles.host}> 👑 Host</span>}

            {isCurrentPlayer && <span className={styles.you}> (you)</span>}

            {canEdit && isCurrentPlayer && (
              <button className={styles.editButton} onClick={() => setIsEditing(true)}>
                ✏️ Edit
              </button>
            )}
          </p>
        )}

        {editError && <p className={styles.editError}>❌ {editError}</p>}

        <p className={styles.status}>
          {isReady ? (
            <span className={styles.ready}>✅ Ready to play</span>
          ) : (
            <span className={styles.waiting}>⏳ Waiting for statement...</span>
          )}
        </p>
      </div>
    </div>
  )
}
