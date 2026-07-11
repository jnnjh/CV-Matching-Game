const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Submit a CV statement
 * @param {string} gameCode
 * @param {string} playerName
 * @param {string} content
 * @returns {Promise}
 */
export async function submitStatement(gameCode, playerName, content) {
  const response = await fetch(`${API_URL}/api/statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameCode, playerName, content }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit statement')
  }

  return data
}

/**
 * Check whether a player has submitted their statement
 * @param {string} gameCode
 * @param {string} playerName
 * @returns {Promise}
 */
export async function getPlayerSubmissionStatus(gameCode, playerName) {
  const response = await fetch(
    `${API_URL}/api/statements/status?gameCode=${gameCode}&playerName=${playerName}`
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch submission status')
  }

  return data
}