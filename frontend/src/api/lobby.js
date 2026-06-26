const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get all players in a game lobby
 * @param {string} gameId - The game ID
 * @returns {Promise} - Players list
 */
export async function getLobbyPlayers(gameId) {
  const response = await fetch(`${API_URL}/api/games/${gameId}/players`);
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to fetch lobby players');
  }
  
  return response.json();
}