const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(url, options = {}) {
  const response = await fetch(url, options)

  if (response.status === 404) {
    return null
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

/**
 * Create a new game
 */
export function createGame(name) {
  return request(`${API_URL}/api/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })
}

/**
 * Start an existing game
 */
export function startGame(gameId) {
  return request(`${API_URL}/api/games/${gameId}/start`, {
    method: 'POST',
  })
}

/**
 * Final results for a finished game
 */
export function getGameResults(gameId) {
  return request(`${API_URL}/api/games/${gameId}/results`)
}

/**
 * End the game (host only)
 */
export function deleteGame(gameId) {
  return request(`${API_URL}/api/games/${gameId}`, {
    method: 'DELETE',
  })
}

/**
 * Fetch a game's status.
 * Returns null when the game no longer exists.
 */
export function getGame(gameId) {
  return request(`${API_URL}/api/games/${gameId}`)
}