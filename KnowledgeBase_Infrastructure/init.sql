-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Table: users
-- Multi-tenant user accounts
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(200),
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (id, username, password_hash, display_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    -- default password hash for 'admin' (set via env, updated at first login)
    '$2b$10$placeholder_for_admin_password',
    'Administrator',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- =============================================
-- Table: sessions
-- Active user sessions with context
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'New Chat',
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

-- =============================================
-- Table: session_messages
-- Per-session conversation messages with media + tool references
-- =============================================
CREATE TABLE IF NOT EXISTS session_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT,
    media_ids UUID[] DEFAULT '{}',
    tool_calls JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_messages_session ON session_messages(session_id);

-- =============================================
-- Table: tools
-- Registry of available tools (Langflow etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'Wrench',
    tool_type VARCHAR(50) DEFAULT 'langflow',
    endpoint VARCHAR(500),
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tools (name, description, icon, tool_type, config) VALUES
    ('Generate Report', 'Create a structured report from your documents and conversations', 'FileText', 'langflow', '{"method":"POST","inputs":{"query":"string","format":"string"}}'),
    ('Video Overview', 'Generate a video summary of selected documents or topics', 'Video', 'langflow', '{"method":"POST","inputs":{"topic":"string","style":"string"}}'),
    ('Voice Overview', 'Create an audio briefing or podcast-style summary', 'Headphones', 'langflow', '{"method":"POST","inputs":{"topic":"string","voice":"string"}}'),
    ('Mind Map', 'Build an interactive mind map from your knowledge base', 'GitBranch', 'langflow', '{"method":"POST","inputs":{"query":"string","depth":"integer"}}')
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- Table: documents
-- Metadata extracted by Gemini LLM
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    department VARCHAR(100),
    key_dates JSONB,
    entities JSONB,
    monetary_values JSONB,
    summary TEXT,
    full_text TEXT,
    file_path VARCHAR(500),
    file_storage_key VARCHAR(500),
    status VARCHAR(50) DEFAULT 'processed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- Table: document_embeddings
-- Vector embeddings for semantic search (768d Gemini)
-- =============================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content_chunk TEXT,
    embedding vector(768)
);

-- =============================================
-- Table: media_files
-- User-uploaded media with storage abstraction
-- =============================================
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    original_name VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_data BYTEA,
    storage_key VARCHAR(500),
    storage_type VARCHAR(20) DEFAULT 'database',
    session_id UUID REFERENCES sessions(id),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_files_user ON media_files(user_id);
CREATE INDEX IF NOT EXISTS idx_media_files_session ON media_files(session_id);

-- =============================================
-- Function: match_documents_with_sources
-- Used by n8n for similarity search
-- =============================================
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
