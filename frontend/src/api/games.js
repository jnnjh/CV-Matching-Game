export async function createGame(password) {
  const response = await fetch('http://localhost:3001/api/games', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  })

  if (!response.ok) {
    throw new Error('Failed to create game')
  }

  return response.json()
}
