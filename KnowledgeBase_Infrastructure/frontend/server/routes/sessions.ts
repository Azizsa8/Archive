import { Router, Request, Response } from 'express'
import { query } from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.use(authMiddleware)

const N8N_BASE = process.env.N8N_BASE_URL || 'https://n8n-production-0304.up.railway.app'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const N8N_CHAT_WEBHOOK_PATH = process.env.N8N_CHAT_WEBHOOK_PATH || 'chat-bff'

router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const { title } = req.body

    const result = await query(
      `INSERT INTO sessions (user_id, title, context)
       VALUES ($1, $2, '{}')
       RETURNING id, title, created_at`,
      [user.id, title || 'New Chat']
    )

    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('Create session error:', err)
    res.status(500).json({ error: 'Failed to create session' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user

    const result = await query(
      `SELECT id, title, context, is_active, created_at, updated_at
       FROM sessions WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC`,
      [user.id]
    )

    res.json({ data: result.rows })
  } catch (err) {
    console.error('Sessions list error:', err)
    res.status(500).json({ error: 'Failed to fetch sessions' })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    const session = await query(
      `SELECT id, title, context, is_active, created_at, updated_at
       FROM sessions WHERE id = $1 AND user_id = $2`,
      [id, user.id]
    )

    if (session.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    const messages = await query(
      `SELECT id, role, content, media_ids, tool_calls, metadata, created_at
       FROM session_messages WHERE session_id = $1
       ORDER BY created_at ASC`,
      [id]
    )

    res.json({ session: session.rows[0], messages: messages.rows })
  } catch (err) {
    console.error('Get session error:', err)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user
    const { title, context } = req.body

    const result = await query(
      `UPDATE sessions SET title = COALESCE($1, title), context = COALESCE($2, context), updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, title, context, updated_at`,
      [title, context ? JSON.stringify(context) : null, id, user.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update session error:', err)
    res.status(500).json({ error: 'Failed to update session' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user

    const result = await query(
      `UPDATE sessions SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, user.id]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Session not found' })
      return
    }

    res.json({ success: true })
  } catch (err) {
    console.error('Delete session error:', err)
    res.status(500).json({ error: 'Failed to delete session' })
  }
})

router.post('/:id/messages', async (req: Request, res: Response) => {
  try {
    const { id: sessionId } = req.params
    const user = (req as any).user
    const { content, mediaIds } = req.body

    const sessionCheck = await query(
      'SELECT id, context FROM sessions WHERE id = $1 AND user_id = $2 AND is_active = true',
      [sessionId, user.id]
    )

    if (sessionCheck.rows.length === 0) {
      res.status(404).json({ error: 'Session not found or inactive' })
      return
    }

    const userMsg = await query(
      `INSERT INTO session_messages (session_id, role, content, media_ids)
       VALUES ($1, 'user', $2, $3)
       RETURNING id, role, content, media_ids, created_at`,
      [sessionId, content || '', mediaIds || []]
    )

    res.json({
      userMessage: userMsg.rows[0],
      status: 'processing',
    })

    const recentMessages = await query(
      `SELECT role, content, media_ids FROM session_messages
       WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [sessionId]
    )

    const contextMessages = recentMessages.rows.reverse().map((m: any) => ({
      role: m.role,
      content: m.content,
      mediaIds: m.media_ids || [],
    }))

    let mediaDetails: any[] = []
    if (mediaIds && mediaIds.length > 0) {
      const mediaResult = await query(
        `SELECT id::text, original_name, mime_type, file_size FROM media_files
         WHERE id = ANY($1::uuid[])`,
        [mediaIds]
      )
      mediaDetails = mediaResult.rows
    }

    const n8nPayload = {
      session_id: sessionId,
      user_id: user.id,
      message: content || '',
      media: mediaDetails,
      response_url: `${process.env.BFF_PUBLIC_URL || 'https://frontend-production-642e.up.railway.app'}/api/n8n/callback`,
      context: { recent_messages: contextMessages },
    }

    fetch(`${N8N_BASE}/webhook/${N8N_CHAT_WEBHOOK_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {}),
      },
      body: JSON.stringify(n8nPayload),
    }).catch((err) => console.error('n8n webhook trigger failed:', err.message))
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json({ error: 'Failed to process message' })
  }
})

export default router
