-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: documents
-- This houses the highly detailed and insightful metadata extracted by the Gemini LLM
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    department VARCHAR(100),
    key_dates JSONB,           -- E.g., {"creation_date": "2025-01-01", "expiry_date": "2026-01-01"}
    entities JSONB,            -- E.g., {"clients": ["Acme Corp"], "vendors": ["Steel Supply"], "employees": ["John Doe"]}
    monetary_values JSONB,     -- E.g., {"total_amount": 142000, "currency": "USD"}
    summary TEXT,
    full_text TEXT,
    file_path VARCHAR(500),    -- Path to the file in the shared storage
    status VARCHAR(50) DEFAULT 'processed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: document_embeddings
-- Houses the vector embeddings for semantic search
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content_chunk TEXT,
    -- Gemini models (like text-embedding-004) use 768 dimensions
    embedding vector(768) 
);

-- Function: match_documents_with_sources
-- Used by n8n to perform similarity search based on the query embedding and selected sources
CREATE OR REPLACE FUNCTION match_documents_with_sources (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  selected_source_ids jsonb DEFAULT '[]'::jsonb
)
RETURNS TABLE (
  document_id UUID,
  title VARCHAR,
  summary TEXT,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id AS document_id,
    d.title,
    d.summary,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  JOIN documents d ON d.id = de.document_id
  WHERE 1 - (de.embedding <=> query_embedding) > match_threshold
    AND (jsonb_array_length(selected_source_ids) = 0 OR d.id::text IN (SELECT jsonb_array_elements_text(selected_source_ids)))
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
$$;
