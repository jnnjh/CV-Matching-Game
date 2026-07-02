const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Submit a CV statement
 * @param {string} gameCode - The game code
 * @param {string} playerName - The player's name
 * @param {string} content - The CV statement
 * @returns {Promise} - Response from the server
 */
export async function submitStatement(gameCode, playerName, content) {
  const response = await fetch(`${API_URL}/api/statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameCode, playerName, content }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit statement');
  }

  return data;
}