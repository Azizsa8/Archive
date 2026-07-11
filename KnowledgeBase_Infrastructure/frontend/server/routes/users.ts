import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { query } from '../db.js'
import { authMiddleware, requireRole } from '../auth.js'

const router = Router()

router.use(authMiddleware, requireRole('admin'))

const SALT_ROUNDS = 10

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, username, display_name, role, is_active, created_at
       FROM users ORDER BY created_at DESC`
    )
    res.json({ data: result.rows })
  } catch (err) {
    console.error('Users list error:', err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, password, displayName, role } = req.body

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' })
      return
    }

    const existing = await query('SELECT id FROM users WHERE username = $1', [username])
    if (existing.rows.length > 0) {
      res.status(409).json({ error: 'Username already exists' })
      return
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
    const result = await query(
      `INSERT INTO users (username, password_hash, display_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, role, created_at`,
      [username, passwordHash, displayName || username, role || 'user']
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    if (id === '00000000-0000-0000-0000-000000000001') {
      res.status(403).json({ error: 'Cannot delete the admin user' })
      return
    }

    await query('DELETE FROM users WHERE id = $1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

export default router
