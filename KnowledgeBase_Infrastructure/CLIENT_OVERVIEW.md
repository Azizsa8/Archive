# Jana Holdings — Knowledge Base Infrastructure

## Project Overview

An AI-powered enterprise knowledge management platform for **Jana Holdings** (Saudi holding company). The system enables document ingestion, semantic search, conversational AI, and multi-user collaboration — accessible via web dashboard with WhatsApp as a help desk channel.

---

## Core Capabilities

### 1. Intelligent Document Ingestion
- Documents uploaded via **web interface** (drag-drop, file picker, voice notes) or **FTP**
- Scanned Arabic PDFs processed through **Stirling PDF OCR** with Arabic language support
- **Google Gemini 1.5 Pro** automatically extracts structured metadata: document type, department, key dates, entities (clients, vendors, employees), monetary values, and summaries
- Extracted data stored in PostgreSQL for full-text and vector search

### 2. Semantic Search & Retrieval (RAG)
- Documents chunked and embedded using **Gemini text-embedding-004** (768-dimensional vectors)
- **pgvector** extension enables fast cosine similarity search across document chunks
- RAG pipeline retrieves relevant context and synthesizes Arabic answers via Gemini

### 3. Multi-User Web Dashboard
- **Role-based access**: admin, operator, viewer roles
- **User accounts**: managed via admin panel (create, delete users)
- **Session management**: each user has multiple named chat sessions with full conversation context
- **Session-aware chat**: messages stored per-session, routed through n8n for processing
- **Chat interface**: voice recording, file attachments, images, video, inline media preview
- **Tool integration**: Langflow tools visible in chat (Generate Report, Video Overview, Voice Overview, Mind Map)

### 4. Session-Aware n8n Processing Pipeline
All user inquiries route through n8n:
1. User sends message + media in a session
2. BFF stores the message and calls n8n webhook with session context
3. n8n processes (RAG search + Gemini synthesis + optional Langflow tools)
4. n8n returns structured response (reply, citations, tool calls)
5. BFF stores response and frontend displays it
6. No conflicts between concurrent users — each session has isolated context

### 5. Langflow Tool Provider (via MCP)
Langflow exposes tools that n8n discovers and calls:
- **Generate Report** — structured report from documents and conversations
- **Video Overview** — video summary of selected topics
- **Voice Overview** — audio briefing / podcast-style summary
- **Mind Map** — interactive mind map from knowledge base
Tools are surfaced in the chat UI as action buttons.

### 6. WhatsApp Help Desk (Optional)
- WhatsApp retained exclusively as a **help desk / support channel**
- Users contact WhatsApp when they have issues → agent diagnoses and fixes
- Completely separate from the main n8n processing pipeline

### 7. Scalable Media Storage
- **MVP**: PostgreSQL bytea (works today, handles moderate file volume)
- **Production**: S3-compatible object storage (MinIO, Cloudflare R2, Railway Buckets)
- Storage abstraction layer auto-detects backend based on `STORAGE_TYPE` env var
- Future: Cassandra adapter if wide-column distributed storage is needed

---

## Technical Architecture

```
                          ┌──────────────────────────────────────┐
                          │    Users (Web Dashboard)             │
                          │  Login · Sessions · Chat · Tools     │
                          └────────────┬─────────────────────────┘
                                       │ JWT Auth (username + password)
                          ┌────────────▼─────────────────────────┐
                          │     BFF Server (Express)              │
                          │  Auth · Sessions · Storage · Proxy    │
                          └──┬──────────────┬──────────────┬───┬──┘
                             │              │              │   │
                     ┌───────▼───┐  ┌──────▼─────┐  ┌─────▼──▼──┐
                     │ PostgreSQL │  │   Gemini   │  │    n8n     │
                     │ + pgvector │  │    AI      │  │  Workflows │
                     │ + sessions │  │ 1.5 Pro +  │  │ (webhook   │
                     │ + users    │  │ Embeddings  │  │  router)   │
                     └────────────┘  └────────────┘  └──┬───┬────┘
                                                         │   │
                                                 ┌───────▼───▼───┐
                                                 │   Langflow    │
                                                 │ Tools via MCP │
                                                 └───────────────┘
```

## Deployed Services (Railway, EU West)

| Service | Status | Purpose |
|---|---|---|
| **Frontend + BFF** | Online | React + Express: UI, auth, sessions, media (https://frontend-production-642e.up.railway.app) |
| **n8n** | Online | Workflow automation, session-aware chat processing (https://n8n-production-0304.up.railway.app) |
| **WAHA** *(help desk)* | Online | WhatsApp HTTP API for support (https://waha-production-239fa.up.railway.app) |
| **PostgreSQL** | Online | Database with pgvector + sessions + users (48 GB volume) |
| **Stirling PDF** | Local Docker | Arabic OCR processing |

## Database Schema

- **`users`** — User accounts: username, password_hash, display_name, role (admin/operator/viewer), is_active
- **`sessions`** — User sessions: title, context (JSONB), per-user ownership
- **`session_messages`** — Messages per session: role, content, media_ids, tool_calls, metadata
- **`tools`** — Tool registry: name, description, icon, tool_type, endpoint, config
- **`documents`** — Document metadata with Gemini-extracted fields
- **`document_embeddings`** — Text chunks with 768-d vector embeddings for semantic search
- **`media_files`** — Uploaded files with storage abstraction (bytea or S3 key)

## Env Vars Required

| Variable | Purpose |
|---|---|
| `ADMIN_PASSWORD` | Initial admin password (fallback if no user in DB) |
| `JWT_SECRET` | JWT signing secret |
| `N8N_CHAT_WEBHOOK_ID` | n8n webhook ID for chat message processing |
| `N8N_API_KEY` | n8n API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `LANGFLOW_API_KEY` | Langflow API key (for tool execution) |
| `LANGFLOW_BASE_URL` | Langflow base URL |
| `STORAGE_TYPE` | `database` (bytea) or `s3` (S3-compatible) |
| `S3_BUCKET` | S3 bucket name (if STORAGE_TYPE=s3) |
| `S3_ENDPOINT` | S3 endpoint URL |
| `S3_ACCESS_KEY` | S3 access key |
| `S3_SECRET_KEY` | S3 secret key |

## API Endpoints

### Auth
- `POST /api/auth/login` — Login with username + password → JWT
- `GET /api/auth/me` — Get current user info from token

### Sessions
- `GET /api/sessions` — List user's active sessions
- `POST /api/sessions` — Create new session
- `GET /api/sessions/:id` — Get session with messages
- `PUT /api/sessions/:id` — Update session (title, context)
- `DELETE /api/sessions/:id` — Soft-delete session
- `POST /api/sessions/:id/messages` — Send message → n8n → receive response

### Media
- `POST /api/media/upload` — Upload file (multipart, 100 MB limit)
- `GET /api/media` — List all media (admin) or user's media
- `GET /api/media/:id/download` — Download file inline
- `GET /api/media/session/:sessionId` — List media for a session
- `DELETE /api/media/:id` — Delete file

### Tools
- `GET /api/tools` — List available tools
- `POST /api/tools/:id/execute` — Execute a tool via Langflow

### Users (admin only)
- `GET /api/users` — List users
- `POST /api/users` — Create user
- `DELETE /api/users/:id` — Delete user

## Infrastructure Migration

- **WhatsApp Trigger** → **Web-first dashboard, WhatsApp as help desk only**
- **OpenAI (GPT-4o-mini)** → **Google Gemini 1.5 Pro**
- **OpenAI Embeddings** → **Gemini text-embedding-004**
- **MongoDB + Atlas Vector Search** → **PostgreSQL + pgvector**
- **Single-page chat** → **Multi-route admin dashboard with BFF**
- **Single admin password** → **Multi-user accounts with roles and sessions**
- **Direct chat** → **n8n-webhook chat pipeline with session routing**
- **PG bytea only** → **Abstracted storage (bytea or S3-compatible)**

## Security Notes

- JWT-based authentication required for all API routes (except login)
- Role-based access control (admin/operator/viewer)
- File uploads limited to 100 MB per file
- n8n endpoints use API key authentication
- Password hashing with bcryptjs (10 salt rounds)
- Default admin user seeded in DB, password set via `ADMIN_PASSWORD` env var
