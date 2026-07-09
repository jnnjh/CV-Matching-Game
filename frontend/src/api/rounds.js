const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Get the current round for a game
 * @param {string} gameId - The game ID
 * @returns {Promise} - { round, statement: { id, content }, choices: [{ id, name }] }
 */
export async function getCurrentRound(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/current-round`)

  if (!response.ok) {
    const data = await response.json()
    throw new Error(data.error || 'Failed to fetch current round')
  }

  return response.json()
}
