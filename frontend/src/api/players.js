const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(url, options = {}) {
  const response = await fetch(url, options)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

/**
 * Join a game as a player
 * @param {string} gameCode - The game code
 * @param {string} name - Player's name
 * @returns {Promise}
 */
export function joinGame(gameCode, name) {
  return request(`${API_URL}/api/players`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gameCode,
      name,
    }),
  })
}

/**
 * Update a player's name (only allowed before the game starts)
 * @param {number} playerId - The player's ID
 * @param {string} name - The new name
 * @returns {Promise}
 */
export function updatePlayerName(playerId, name) {
  return request(`${API_URL}/api/players/${playerId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
    }),
  })
}

/**
 * Remove a player from a game together with their statement and votes
 * @param {number} playerId
 * @returns {Promise}
 */
export function removePlayer(playerId) {
  return request(`${API_URL}/api/players/${playerId}`, {
    method: 'DELETE',
  })
}