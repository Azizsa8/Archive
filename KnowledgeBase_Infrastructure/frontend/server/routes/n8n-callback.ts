import { Router, Request, Response } from 'express'
import { query } from '../db.js'

const router = Router()

router.post('/callback', async (req: Request, res: Response) => {
  try {
    console.log('n8n callback body:', JSON.stringify(req.body).substring(0, 500))
    const { session_id, reply, citations, tool_calls, context } = req.body

    if (!session_id) {
      res.status(400).json({ error: 'Missing session_id', body: JSON.stringify(req.body).substring(0, 500), type: typeof req.body, isArray: Array.isArray(req.body) })
      return
    }

    const sessionCheck = await query(
      'SELECT id FROM sessions WHERE id = $1 AND is_active = true',
      [session_id]
    )

    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const aiMsg = await query(
      `INSERT INTO session_messages (session_id, role, content, tool_calls, metadata)
       VALUES ($1, 'assistant', $2, $3, $4)
       RETURNING id, role, content, tool_calls, created_at`,
      [session_id, reply || '', tool_calls ? JSON.stringify(tool_calls) : '[]', JSON.stringify({ citations: citations || [] })]
    )

    if (context) {
      await query(
        `UPDATE sessions SET context = $1, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(context), session_id]
      )
    } else {
      await query(
        `UPDATE sessions SET updated_at = NOW() WHERE id = $1`,
        [session_id]
      )
    }

    res.json({ success: true, messageId: aiMsg.rows[0]?.id })
  } catch (err) {
    console.error('n8n callback error:', err)
    res.status(500).json({ error: 'Failed to process callback' })
  }
})

export default router
