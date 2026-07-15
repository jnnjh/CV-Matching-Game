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

/**
 * Final results for a finished game
 */
export async function getGameResults(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/results`)

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch results')
  }

  return data
}

/**
 * End the game (host only): deletes the game and everything in it
 */
export async function deleteGame(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}`, {
    method: 'DELETE',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to end game')
  }

  return data
}

/**
 * Fetch a game's status. Returns null when the game no longer exists
 * (i.e. the host ended it) so callers can send players back home.
 */
export async function getGame(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to fetch game')
  }

  return response.json()
}
