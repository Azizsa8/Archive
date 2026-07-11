import { Router, Request, Response } from 'express'
import { query } from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, description, icon, tool_type, config, is_active
       FROM tools WHERE is_active = true
       ORDER BY name ASC`
    )

    res.json({ data: result.rows })
  } catch (err) {
    console.error('Tools list error:', err)
    res.status(500).json({ error: 'Failed to fetch tools' })
  }
})

router.post('/:id/execute', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const user = (req as any).user
    const { input } = req.body

    const toolResult = await query(
      `SELECT id, name, tool_type, endpoint, config FROM tools WHERE id = $1 AND is_active = true`,
      [id]
    )

    if (toolResult.rows.length === 0) {
      res.status(404).json({ error: 'Tool not found or inactive' })
      return
    }

    const tool = toolResult.rows[0]

    let output = ''
    let error: string | null = null

    switch (tool.tool_type) {
      case 'langflow': {
        const langflowApiKey = process.env.LANGFLOW_API_KEY
        const langflowBase = process.env.LANGFLOW_BASE_URL || 'https://api.langflow.astra.datastax.com'

        if (langflowApiKey && tool.endpoint) {
          try {
            const lfRes = await fetch(`${langflowBase}${tool.endpoint}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${langflowApiKey}`,
              },
              body: JSON.stringify({
                input_value: input?.query || input?.topic || '',
                ...input,
                user_id: user.id,
              }),
              signal: AbortSignal.timeout(60000),
            })

            if (lfRes.ok) {
              const lfData: any = await lfRes.json()
              output = lfData.output || lfData.result || JSON.stringify(lfData)
            } else {
              const errBody = await lfRes.text().catch(() => '')
              error = `Langflow error: ${lfRes.status} ${errBody}`
            }
          } catch (fetchErr: any) {
            error = `Langflow request failed: ${fetchErr.message}`
          }
        } else {
          error = 'Langflow is not configured. Set LANGFLOW_API_KEY and LANGFLOW_BASE_URL.'
        }
        break
      }

      default:
        error = `Unknown tool type: ${tool.tool_type}`
    }

    await query(
      `INSERT INTO session_messages (session_id, role, content, tool_calls, metadata)
       VALUES ('00000000-0000-0000-0000-000000000000', 'tool', $1, $2, $3)
       RETURNING id`,
      [
        `Tool "${tool.name}" executed`,
        JSON.stringify([{ tool_id: id, tool_name: tool.name, input }]),
        JSON.stringify({ output, error, user_id: user.id }),
      ]
    )

    res.json({ success: !error, output, error })
  } catch (err) {
    console.error('Execute tool error:', err)
    res.status(500).json({ error: 'Failed to execute tool' })
  }
})

export default router
