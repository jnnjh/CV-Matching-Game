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
 * Submit a CV statement
 */
export function submitStatement(gameCode, playerName, content) {
  return request(`${API_URL}/api/statements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      gameCode,
      playerName,
      content,
    }),
  })
}

/**
 * Check whether a player has submitted their statement
 */
export function getPlayerSubmissionStatus(gameCode, playerName) {
  const params = new URLSearchParams({
    gameCode,
    playerName,
  })

  return request(
    `${API_URL}/api/statements/status?${params.toString()}`,
  )
}