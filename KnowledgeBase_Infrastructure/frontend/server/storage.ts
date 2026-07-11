import { query } from './db.js'

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'database'

export interface StoredFile {
  id: string
  name: string
  mimeType: string
  size: number
  url: string
  storageKey: string
}

interface StorageBackend {
  upload(filename: string, data: Buffer, mimeType: string, userId?: string): Promise<string>
  getDownloadUrl(key: string, mimeType: string, name: string): string
  delete(key: string): Promise<void>
}

class PgStorageBackend implements StorageBackend {
  async upload(filename: string, data: Buffer, mimeType: string): Promise<string> {
    const result = await query(
      `INSERT INTO media_files (original_name, mime_type, file_size, file_data, storage_type)
       VALUES ($1, $2, $3, $4, 'database')
       RETURNING id::text`,
      [filename, mimeType, data.length, data]
    )
    return result.rows[0].id
  }

  getDownloadUrl(key: string, _mimeType: string, _name: string): string {
    return `/api/media/${key}/download`
  }

  async delete(key: string): Promise<void> {
    await query('DELETE FROM media_files WHERE id = $1', [key])
  }
}

class S3StorageBackend implements StorageBackend {
  private bucket: string
  private endpoint: string
  private accessKey: string
  private secretKey: string
  private region: string

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'jana-media'
    this.endpoint = process.env.S3_ENDPOINT || ''
    this.accessKey = process.env.S3_ACCESS_KEY || ''
    this.secretKey = process.env.S3_SECRET_KEY || ''
    this.region = process.env.S3_REGION || 'auto'
  }

  async upload(filename: string, data: Buffer, mimeType: string): Promise<string> {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${filename}`
    const url = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`

    const headers: Record<string, string> = {
      'Content-Type': mimeType,
      'Content-Length': String(data.length),
    }

    if (this.accessKey && this.secretKey) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64')}`
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: data,
    })

    if (!res.ok) {
      throw new Error(`S3 upload failed: ${res.status} ${res.statusText}`)
    }

    const result = await query(
      `INSERT INTO media_files (original_name, mime_type, file_size, storage_key, storage_type)
       VALUES ($1, $2, $3, $4, 's3')
       RETURNING id::text`,
      [filename, mimeType, data.length, key]
    )

    return result.rows[0].id
  }

  getDownloadUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`
  }

  async delete(key: string): Promise<void> {
    const result = await query(
      'SELECT storage_key FROM media_files WHERE id = $1',
      [key]
    )
    if (result.rows.length === 0) return

    const storageKey = result.rows[0].storage_key
    if (!storageKey) return

    const url = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${storageKey}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storageKey}`

    const headers: Record<string, string> = {}
    if (this.accessKey && this.secretKey) {
      headers['Authorization'] = `Basic ${Buffer.from(`${this.accessKey}:${this.secretKey}`).toString('base64')}`
    }

    await fetch(url, { method: 'DELETE', headers }).catch(() => {})
    await query('DELETE FROM media_files WHERE id = $1', [key])
  }
}

let backend: StorageBackend | null = null

function getBackend(): StorageBackend {
  if (!backend) {
    backend = STORAGE_TYPE === 's3' ? new S3StorageBackend() : new PgStorageBackend()
  }
  return backend
}

export async function uploadFile(
  filename: string,
  data: Buffer,
  mimeType: string,
  userId?: string
): Promise<StoredFile> {
  const id = await getBackend().upload(filename, data, mimeType)
  const url = getBackend().getDownloadUrl(id, mimeType, filename)
  return { id, name: filename, mimeType, size: data.length, url, storageKey: id }
}

export async function getFileRecord(id: string): Promise<StoredFile | null> {
  const result = await query(
    `SELECT id::text, original_name, mime_type, file_size, file_data, storage_key, storage_type
     FROM media_files WHERE id = $1`,
    [id]
  )
  if (result.rows.length === 0) return null

  const row = result.rows[0]
  const url = getBackend().getDownloadUrl(id, row.mime_type, row.original_name)
  return {
    id: row.id,
    name: row.original_name,
    mimeType: row.mime_type,
    size: row.file_size,
    url,
    storageKey: row.storage_key || row.id,
  }
}

export async function getFileData(id: string): Promise<{ data: Buffer; mimeType: string; name: string; size: number } | null> {
  const result = await query(
    `SELECT original_name, mime_type, file_data, storage_key, storage_type, file_size
     FROM media_files WHERE id = $1`,
    [id]
  )
  if (result.rows.length === 0) return null

  const row = result.rows[0]

  if (row.storage_type === 's3' && row.storage_key) {
    const backendInstance = getBackend()
    const url = backendInstance instanceof S3StorageBackend
      ? (backendInstance as S3StorageBackend).getDownloadUrl(row.storage_key)
      : ''

    if (url) {
      const res = await fetch(url)
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      return { data: buf, mimeType: row.mime_type, name: row.original_name, size: row.file_size }
    }
  }

  if (row.file_data) {
    return { data: row.file_data, mimeType: row.mime_type, name: row.original_name, size: row.file_size }
  }

  return null
}

export async function deleteFile(id: string): Promise<void> {
  await getBackend().delete(id)
}
