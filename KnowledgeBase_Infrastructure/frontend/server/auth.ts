import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { User } from './types.js'

const JWT_SECRET = process.env.JWT_SECRET || 'jana-lm-dev-secret-change-in-production'
const JWT_EXPIRES_IN = '24h'

export function generateToken(user: User): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): User {
  return jwt.verify(token, JWT_SECRET) as User
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' })
    return
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    res.status(401).json({ error: 'Missing token' })
    return
  }

  try {
    const user = verifyToken(token)
    ;(req as any).user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as any).user as User | undefined
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}
