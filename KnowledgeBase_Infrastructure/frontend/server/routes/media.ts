import { Router, Request, Response } from 'express'
import multer from 'multer'
import { query } from '../db.js'
import { uploadFile, getFileData, getFileRecord, deleteFile } from '../storage.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
})

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' })
      return
    }

    const { originalname, mimetype, size, buffer } = req.file
    const sessionId = String(req.body.session_id || '')
    const description = String(req.body.description || '')
    const user = (req as any).user
    const userId = user?.id

    const stored = await uploadFile(originalname, buffer, mimetype, userId)

    if (sessionId) {
      await query(
        'UPDATE media_files SET session_id = $1, description = $2 WHERE id = $3',
        [sessionId, description, stored.id]
      )
    }

    res.json({
      id: stored.id,
      name: stored.name,
      type: stored.mimeType,
      size: stored.size,
      url: stored.url,
      sessionId,
      description,
      createdAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Media upload error:', err)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string
    const fileData = await getFileData(id)

    if (!fileData) {
      res.status(404).json({ error: 'File not found' })
      return
    }

    res.setHeader('Content-Type', fileData.mimeType)
    res.setHeader('Content-Disposition', `inline; filename="${fileData.name}"`)
    res.setHeader('Content-Length', fileData.size)
    res.send(fileData.data)
  } catch (err) {
    console.error('Media download error:', err)
    res.status(500).json({ error: 'Failed to retrieve file' })
  }
})

router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const result = await query(
      `SELECT id::text, original_name, mime_type, file_size, description, created_at
       FROM media_files WHERE session_id = $1 ORDER BY created_at DESC`,
      [sessionId]
    )

    const data = result.rows.map((row: any) => ({
      ...row,
      url: `/api/media/${row.id}/download`,
    }))

    res.json({ data })
  } catch (err) {
    console.error('Media list error:', err)
    res.status(500).json({ error: 'Failed to list media' })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const offset = (page - 1) * limit

    const countResult = user.role === 'admin'
      ? await query('SELECT COUNT(*)::int as total FROM media_files')
      : await query('SELECT COUNT(*)::int as total FROM media_files WHERE user_id = $1', [user.id])

    const total = countResult.rows[0]?.total || 0

    const dataResult = user.role === 'admin'
      ? await query(
          `SELECT id::text, original_name, mime_type, file_size, storage_type, session_id, description, created_at
           FROM media_files ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
          [limit, offset]
        )
      : await query(
          `SELECT id::text, original_name, mime_type, file_size, storage_type, session_id, description, created_at
           FROM media_files WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
          [user.id, limit, offset]
        )

    const data = dataResult.rows.map((row: any) => ({
      ...row,
      url: `/api/media/${row.id}/download`,
    }))

    res.json({ data, total, page, limit })
  } catch (err) {
    console.error('Media list error:', err)
    res.status(500).json({ error: 'Failed to list media' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleteId = req.params.id as string
    await deleteFile(deleteId)
    res.json({ success: true })
  } catch (err) {
    console.error('Media delete error:', err)
    res.status(500).json({ error: 'Failed to delete file' })
  }
})

export default router
