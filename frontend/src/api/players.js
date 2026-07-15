const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Join a game as a player
 * @param {string} gameCode - The game code
 * @param {string} name - Player's name
 * @returns {Promise} - Response from the server
 */
export async function joinGame(gameCode, name) {
  const response = await fetch(`${API_URL}/api/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameCode, name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to join game')
  }

  return data
}

/**
 * Update a player's name (only allowed before the game starts)
 * @param {number} playerId - The player's ID
 * @param {string} name - The new name
 * @returns {Promise} - Response from the server
 */
export async function updatePlayerName(playerId, name) {
  const response = await fetch(`${API_URL}/api/players/${playerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update name')
  }

  return data
}
