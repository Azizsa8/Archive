import { Router, Request, Response } from 'express'
import { query, testConnection } from '../db.js'
import { DashboardStats, SystemHealth } from '../types.js'

const router = Router()

const N8N_API_URL = process.env.N8N_API_URL || 'https://n8n-production-0304.up.railway.app'
const N8N_API_KEY = process.env.N8N_API_KEY || ''
const WAHA_API_URL = process.env.WAHA_API_URL || 'https://waha-production-239fa.up.railway.app'
const WAHA_API_KEY = process.env.WAHA_API_KEY || ''
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

async function checkN8n(): Promise<'healthy' | 'degraded' | 'down'> {
  if (!N8N_API_KEY) return 'degraded'
  try {
    const res = await fetch(`${N8N_API_URL}/healthz`, { signal: AbortSignal.timeout(5000) })
    return res.ok ? 'healthy' : 'degraded'
  } catch {
    return 'down'
  }
}

async function checkWaha(): Promise<'healthy' | 'degraded' | 'down'> {
  if (!WAHA_API_KEY) return 'degraded'
  try {
    const res = await fetch(`${WAHA_API_URL}/api/health`, {
      headers: { Authorization: `Bearer ${WAHA_API_KEY}` },
      signal: AbortSignal.timeout(5000)
    })
    return res.ok ? 'healthy' : 'degraded'
  } catch {
    return 'down'
  }
}

async function checkGemini(): Promise<'healthy' | 'degraded' | 'down'> {
  if (!GEMINI_API_KEY) return 'degraded'
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    )
    return res.ok ? 'healthy' : 'degraded'
  } catch {
    return 'down'
  }
}

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const pgOk = await testConnection()

    if (!pgOk) {
      const systemHealth: SystemHealth = {
        postgres: 'down',
        n8n: await checkN8n(),
        waha: await checkWaha(),
        gemini: await checkGemini()
      }

      const mockStats: DashboardStats = {
        totalDocuments: 0,
        conversationsToday: 0,
        queriesThisWeek: 0,
        activeSources: 0,
        recentActivity: [],
        queriesByDay: [],
        systemHealth
      }

      res.json(mockStats)
      return
    }

    const [docCount, convToday, convWeek, sources, queriesByDay, recent] = await Promise.all([
      query('SELECT COUNT(*)::int as count FROM documents'),
      query("SELECT COUNT(*)::int as count FROM conversations WHERE created_at >= CURRENT_DATE"),
      query("SELECT COUNT(*)::int as count FROM conversations WHERE created_at >= CURRENT_DATE - INTERVAL '7 days' AND role = 'user'"),
      query("SELECT COUNT(*)::int as count FROM (SELECT DISTINCT source_type FROM documents) sub"),
      query(`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM conversations
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `),
      query(`
        (SELECT 'document_uploaded' as type, filename as description, created_at as timestamp
         FROM documents ORDER BY created_at DESC LIMIT 5)
        UNION ALL
        (SELECT 'conversation' as type, LEFT(content, 100) as description, created_at as timestamp
         FROM conversations WHERE role = 'user' ORDER BY created_at DESC LIMIT 5)
        ORDER BY timestamp DESC LIMIT 10
      `)
    ])

    const [n8n, waha, gemini] = await Promise.all([checkN8n(), checkWaha(), checkGemini()])

    const stats: DashboardStats = {
      totalDocuments: docCount.rows[0]?.count || 0,
      conversationsToday: convToday.rows[0]?.count || 0,
      queriesThisWeek: convWeek.rows[0]?.count || 0,
      activeSources: sources.rows[0]?.count || 0,
      recentActivity: recent.rows.map((r: any) => ({
        id: 0,
        type: r.type === 'document_uploaded' ? 'document_uploaded' as const : 'conversation' as const,
        description: r.description,
        timestamp: r.timestamp
      })),
      queriesByDay: queriesByDay.rows.map((r: any) => ({
        date: r.date.toISOString().split('T')[0],
        count: r.count
      })),
      systemHealth: { postgres: 'healthy', n8n, waha, gemini }
    }

    res.json(stats)
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

export default router
