import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/create-game')({
  component: CreateGamePage,
})

function CreateGamePage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')

  async function handleCreateGame() {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
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
  }

  return (
    <div>
      <h1>Create Game</h1>

      <input
        type="text"
        placeholder="Enter host name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button onClick={handleCreateGame}>Create Game</button>
    </div>
  )
}