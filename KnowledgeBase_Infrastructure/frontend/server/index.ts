import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware } from './auth.js'
import loginRoutes from './routes/login.js'
import dashboardRoutes from './routes/dashboard.js'
import documentsRoutes from './routes/documents.js'
import conversationsRoutes from './routes/conversations.js'
import systemRoutes from './routes/system.js'
import mediaRoutes from './routes/media.js'
import usersRoutes from './routes/users.js'
import sessionsRoutes from './routes/sessions.js'
import toolsRoutes from './routes/tools.js'
import n8nCallbackRoutes from './routes/n8n-callback.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || '3001')
const isProduction = process.env.NODE_ENV === 'production'

app.use(cors())
app.use(express.json({ limit: '10mb' }))

if (isProduction) {
  const distPath = path.resolve(__dirname, '..', '..', 'dist')
  app.use(express.static(distPath))
}

app.use('/api/auth', loginRoutes)
app.use('/api/system', systemRoutes)
app.use('/api/dashboard', authMiddleware, dashboardRoutes)
app.use('/api/documents', authMiddleware, documentsRoutes)
app.use('/api/conversations', authMiddleware, conversationsRoutes)
app.use('/api/media', authMiddleware, mediaRoutes)
app.use('/api/users', authMiddleware, usersRoutes)
app.use('/api/sessions', authMiddleware, sessionsRoutes)
app.use('/api/tools', authMiddleware, toolsRoutes)
app.use('/api/n8n', express.raw({ type: '*/*', limit: '10mb' }), (req: any, res, next) => {
  const raw = req.body
  if (raw instanceof Buffer) {
    const text = raw.toString('utf8')
    console.log('n8n raw body:', text.substring(0, 500))
    try {
      req.body = JSON.parse(text)
    } catch (e: any) {
      res.status(400).json({ error: 'Invalid JSON: ' + e.message })
      return
    }
  }
  next()
}, n8nCallbackRoutes)

if (isProduction) {
  const distPath = path.resolve(__dirname, '..', '..', 'dist')
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Jana-LM BFF server listening on port ${PORT} (${isProduction ? 'production' : 'development'})`)
})
