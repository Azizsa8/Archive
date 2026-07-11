import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken } from '../auth.js'
import { query } from '../db.js'

const router = Router()

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' })
    return
  }

  try {
    if (username === 'admin') {
      if (password === ADMIN_PASSWORD) {
        const user = { id: '00000000-0000-0000-0000-000000000001', username: 'admin', displayName: 'Administrator', role: 'admin' as const }
        const token = generateToken(user)
        res.json({ token, user })
        return
      }

      const result = await query(
        'SELECT id, username, password_hash, display_name, role FROM users WHERE username = $1 AND is_active = true',
        [username]
      )

      if (result.rows.length === 0) {
        res.status(401).json({ error: 'Invalid username or password' })
        return
      }

      const dbUser = result.rows[0]
      const valid = await bcrypt.compare(password, dbUser.password_hash)

      if (!valid) {
        res.status(401).json({ error: 'Invalid username or password' })
        return
      }

      const user = { id: dbUser.id, username: dbUser.username, displayName: dbUser.display_name, role: dbUser.role as 'admin' | 'operator' | 'viewer' }
      const token = generateToken(user)

      res.json({ token, user })
      return
    }

    const result = await query(
      'SELECT id, username, password_hash, display_name, role FROM users WHERE username = $1 AND is_active = true',
      [username]
    )

    if (result.rows.length === 0) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const dbUser = result.rows[0]
    const valid = await bcrypt.compare(password, dbUser.password_hash)

    if (!valid) {
      res.status(401).json({ error: 'Invalid username or password' })
      return
    }

    const user = { id: dbUser.id, username: dbUser.username, displayName: dbUser.display_name, role: dbUser.role as 'admin' | 'operator' | 'viewer' }
    const token = generateToken(user)

    res.json({ token, user })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  try {
    const { verifyToken } = await import('../auth.js')
    const user = verifyToken(authHeader.split(' ')[1])
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

export default router
