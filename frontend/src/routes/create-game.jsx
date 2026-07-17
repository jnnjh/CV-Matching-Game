import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import Brand from '../components/Brand'
import styles from './create-game.module.css'

export const Route = createFileRoute('/create-game')({
  component: CreateGamePage,
})

function CreateGamePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleCreateGame() {
    if (!name.trim()) {
      alert('Please enter a host name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        alert('Failed to create game')
        return
      }

      const data = await response.json()

      navigate({
        to: '/host-lobby',
        search: {
          gameId: data.id,
          gameCode: data.game_code,
        },
      })
    } catch (error) {
      alert('Failed to create game. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <Brand />
      <h1 className={styles.title}>🎮 Create a Game</h1>
      <p className={styles.subtitle}>Enter your name to host a new game</p>

      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="hostName" className={styles.label}>
            Host Name <span className={styles.required}>*</span>
          </label>
          <input
            id="hostName"
            type="text"
            placeholder="Enter host name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
        </div>

        <button 
          onClick={handleCreateGame} 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Creating...' : '🚀 Create Game'}
        </button>
      </div>

      <p className={styles.footer}>
        Players will join using the game code you'll receive.
      </p>
    </div>
  )
}