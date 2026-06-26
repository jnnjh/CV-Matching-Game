import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export const Route = createFileRoute('/create-game')({
  component: CreateGamePage,
})

function CreateGamePage() {
  const [name, setName] = useState('')
  const [gameCode, setGameCode] = useState('')
  const joinUrl = gameCode ? `http://localhost:5173/join-game?code=${gameCode}` : ''

  async function handleCreateGame() {
    const response = await fetch('http://localhost:3000/api/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    })

    const data = await response.json()
    setGameCode(data.game_code)
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

      {gameCode && (
        <div>
          <p>Game Code: {gameCode}</p>

          <QRCodeCanvas value={joinUrl} size={180} />

          <p>Scan to join</p>

          <button onClick={() => navigator.clipboard.writeText(joinUrl)}>
            Copy Join Link
          </button>
        </div>
      )}
    </div>
  )
}