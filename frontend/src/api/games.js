const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Create a new game
 */
export async function createGame(name) {
  const response = await fetch(`${API_URL}/api/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to create game')
  }

  return data
}

/**
 * Start an existing game
 */
export async function startGame(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/start`, {
    method: 'POST',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to start game')
  }

  return data
}