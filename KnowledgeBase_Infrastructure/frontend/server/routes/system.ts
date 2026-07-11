import { Router, Request, Response } from 'express'
import { testConnection } from '../db.js'

const router = Router()

router.get('/health', async (_req: Request, res: Response) => {
  const pg = await testConnection()

  let n8n = 'unknown'
  try {
    const r = await fetch(process.env.N8N_API_URL ? `${process.env.N8N_API_URL}/healthz` : 'http://localhost:5678/healthz', {
      signal: AbortSignal.timeout(5000)
    })
    n8n = r.ok ? 'healthy' : 'degraded'
  } catch { n8n = 'down' }

  res.json({
    status: pg ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: { postgres: pg ? 'healthy' : 'down', n8n }
  })
})

export default router
