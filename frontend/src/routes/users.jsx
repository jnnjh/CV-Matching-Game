import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { UserCard } from '../components/UserCard'

// users.tsx → "/users"
// This page fetches data from the backend – a common real-world pattern.
export const Route = createFileRoute('/users')({
  component: UsersPage,
})

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/users')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch users')
        return res.json()
      })
      .then((data) => {
        setUsers(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading users…</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h1>👥 Users</h1>
      <p>
        Fetched from <code>GET /api/users</code>
      </p>
      {users.map((user) => (
        <UserCard key={user.id} name={user.name} role={user.role} />
      ))}
    </div>
  )
}
