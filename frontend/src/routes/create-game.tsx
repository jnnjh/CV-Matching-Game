import { useState } from 'react'
import { createGame } from '../api/games'

export default function CreateGamePage() {
  const [password, setPassword] = useState('')
  const [gameCode, setGameCode] = useState('')

  async function handleCreateGame() {
    try {
      const game = await createGame(password)
      setGameCode(game.game_code)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <h1>Create Game</h1>

      <input
        type="password"
        placeholder="Enter game password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleCreateGame}>Create Game</button>

      {gameCode && (
        <div>
          <h2>Game Code:</h2>
          <p>{gameCode}</p>
        </div>
      )}
    </div>
  )
}