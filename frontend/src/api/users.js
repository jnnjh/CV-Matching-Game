export async function fetchUsers() {
  const response = await fetch('http://localhost:3000/api/users')

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}