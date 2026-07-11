export interface Document {
  id: string
  filename: string
  source_type: string
  status: string
  file_size: number | null
  page_count: number | null
  created_at: string
  updated_at: string
}

export interface DocumentListResponse {
  data: Document[]
  total: number
  page: number
  limit: number
}
