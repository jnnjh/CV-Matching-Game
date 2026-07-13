const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Submit a vote for who wrote a statement
 * @param {string} gameId - The game ID
 * @param {string} statementId - The statement being voted on
 * @param {string} voterId - The player casting the vote
 * @param {string} guessedUserId - The player being guessed as the author
 * @returns {Promise} - Response from the server
 */
export async function submitVote(gameId, statementId, voterId, guessedUserId) {
  const response = await fetch(`${API_URL}/api/votes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameId, statementId, voterId, guessedUserId }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to submit vote')
  }

  return data
}

/**
 * Ask the backend about this voter and the current statement:
 * - hasVoted: keeps the vote screen locked after a page refresh
 * - isOwnStatement: the statement's author sits the round out
 *
 * Both are computed server-side so the statement's author is never
 * exposed in any other player's network traffic.
 *
 * @param {string} statementId
 * @param {string} voterId
 * @returns {Promise} - { hasVoted, isOwnStatement }
 */
export async function getVoteStatus(statementId, voterId) {
  const response = await fetch(
    `${API_URL}/api/votes/status?statementId=${statementId}&voterId=${voterId}`,
  )

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch vote status')
  }

  return data
}
