import { Router, Request, Response } from 'express'
import { query } from '../db.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit
    const search = req.query.search as string | undefined

    let whereClause = ''
    const params: any[] = []
    if (search) {
      whereClause = 'WHERE filename ILIKE $1'
      params.push(`%${search}%`)
    }

    const countResult = await query(`SELECT COUNT(*)::int as total FROM documents ${whereClause}`, params)
    const total = countResult.rows[0]?.total || 0

    const dataResult = await query(
      `SELECT * FROM documents ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )

    res.json({
      data: dataResult.rows,
      total,
      page,
      limit
    })
  } catch (err) {
    console.error('Documents list error:', err)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await query('DELETE FROM document_chunks WHERE document_id = $1', [id])
    await query('DELETE FROM documents WHERE id = $1', [id])
    res.json({ success: true })
  } catch (err) {
    console.error('Document delete error:', err)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

export default router
