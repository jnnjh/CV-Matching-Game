export async function fetchUsers() {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

fetch(`${API_URL}/api/users`)

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}