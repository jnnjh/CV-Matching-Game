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

/**
 * Move the game to the next statement (host control)
 * @param {string} gameId - The game ID
 * @returns {Promise} - { round, status, finished }
 */
export async function nextRound(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/next-round`, {
    method: 'POST',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to advance to the next statement')
  }

  return data
}

/**
 * Get vote progress for the current statement (host screen)
 * @param {string} gameId - The game ID
 * @returns {Promise} - { round, status, votesIn, votesNeeded, allVotesIn, players: [{ id, name, hasVoted }] }
 */
export async function getVoteProgress(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/vote-progress`)

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch vote progress')
  }

  return data
}
