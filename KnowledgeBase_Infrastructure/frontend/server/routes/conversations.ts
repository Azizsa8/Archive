import { Router, Request, Response } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const countResult = await query('SELECT COUNT(*)::int as total FROM conversations')
    const total = countResult.rows[0]?.total || 0

    const dataResult = await query(
      'SELECT * FROM conversations ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    )

    res.json({
      data: dataResult.rows,
      total,
      page,
      limit
    })
  } catch (err) {
    console.error('Conversations list error:', err)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

export default router
