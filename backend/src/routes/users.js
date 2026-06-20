import { Router } from 'express'
import { getAllUsers, getUserById } from '../services/users.js'

// Router files only handle HTTP concerns (parsing, status codes, responses).
// All business logic lives in services/.
export const userRoutes = Router()

userRoutes.get('/', async (_req, res) => {
  try {
    const users = await getAllUsers()
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

userRoutes.get('/:id', async (req, res) => {
  try {
    const user = await getUserById(Number(req.params.id))
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})
