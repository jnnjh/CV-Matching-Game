import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { fetchUsers } from '../api/users'

export const Route = createFileRoute('/users')({
  component: UsersPage,
})

function UsersPage() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await fetchUsers()
        setUsers(data)
      } catch (error) {
        console.error(error)
      }
    }

    loadUsers()
  }, [])

  return (
    <div>
      <h1>Users</h1>

      {users.length === 0 ? (
        <p>No users found</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}