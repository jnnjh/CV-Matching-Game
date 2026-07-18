const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(url) {
  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch lobby players')
  }

  return data
}

/**
 * Get all players in a game lobby
 */
export function getLobbyPlayers(gameId) {
  return request(`${API_URL}/api/games/${gameId}/players`)
}