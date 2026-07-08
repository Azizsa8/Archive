# Jana Holdings — Knowledge Base Infrastructure

## Project Overview

An AI-powered enterprise knowledge management platform designed for **Jana Holdings**. The system enables organizations to ingest, store, semantically search, and interact with their documents through a conversational Arabic-language interface — accessible via web chat and WhatsApp.

---

## Core Capabilities

### 1. Intelligent Document Ingestion
- Documents are uploaded via **FTP**, web interface, or WhatsApp
- Scanned Arabic PDFs are processed through **Stirling PDF OCR** with Arabic language support
- **Google Gemini 1.5 Pro** automatically extracts structured metadata: document type, department, key dates, entities (clients, vendors, employees), monetary values, and summaries
- Extracted data is stored in PostgreSQL for full-text and vector search

### 2. Semantic Search & Retrieval (RAG)
- Documents are chunked and embedded using **Gemini text-embedding-004** (768-dimensional vectors)
- **pgvector** extension enables fast cosine similarity search across millions of document chunks
- The RAG pipeline retrieves the most relevant document context for any query
- Results are synthesized by **Gemini 1.5 Pro** into coherent, cited Arabic answers

### 3. Multi-Channel Access
- **Web Chat Interface** — React-based Arabic RTL chat UI (branded as "Jana Holdings")
- **WhatsApp Integration** — Users can ask questions via WhatsApp using the **WAHA** (WhatsApp HTTP API) integration
- **API Endpoints** — Webhook-based retrieval API for external integrations

### 4. Workflow Automation (n8n)
The system uses **n8n** as its workflow engine with the following pipelines:

| Workflow | Purpose |
|---|---|
| **WAHA Chat Flow** | Handles incoming WhatsApp messages → routes by type (text, audio, image, document) → searches knowledge base → returns AI-generated response |
| **Retrieval API** | Webhook endpoint for programmatic semantic search + answer synthesis |
| **Ingestion & OCR Pipeline** | Monitors FTP for new PDFs → OCR → metadata extraction → stores in PostgreSQL |
| **Document Ingestion** | Manual trigger for fetching and embedding documents into the vector store |

### 5. AI Stack
- **Chat Model:** Google Gemini 1.5 Pro — professional Arabic responses
- **Embeddings:** Gemini text-embedding-004 — 768-dimension vector representations
- **Prompt Configuration:** System prompts in Arabic, persona as "Jana-LM — the advanced Arabic AI assistant for Jana Holdings"
- **Session Memory:** n8n Simple Memory node for per-conversation context

---

## Technical Architecture

```
                    ┌──────────────────────────────┐
                    │     WhatsApp Users            │
                    └──────────┬───────────────────┘
                               │ WAHA API
                    ┌──────────▼───────────────────┐
                    │     n8n Workflows             │
                    │  ┌─────────────────────────┐ │
                    │  │ Chat Flow  │  Ingestion  │ │
                    │  │ Retrieval  │  OCR        │ │
                    │  └──────┬──────────────────┘ │
                    └─────────┼────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
  ┌───────▼───────┐  ┌───────▼───────┐  ┌────────▼────────┐
  │  PostgreSQL    │  │    Gemini     │  │   Stirling PDF  │
  │  + pgvector    │  │     AI        │  │   OCR Engine    │
  │  (768d vectors)│  │ (1.5 Pro +   │  │  (Arabic OCR)   │
  │                │  │  Embeddings)  │  │                 │
  └────────────────┘  └───────────────┘  └─────────────────┘
```

## Deployed Services

All services are deployed on **Railway** (EU West region):

| Service | Status | Purpose |
|---|---|---|
| **n8n** | Online | Workflow automation (https://n8n-production-0304.up.railway.app) |
| **Frontend** | Online | React web chat UI (https://frontend-production-642e.up.railway.app) |
| **WAHA** | Online | WhatsApp HTTP API (https://waha-production-239fa.up.railway.app) |
| **PostgreSQL** | Online | Database with pgvector (48 GB volume) |
| **Stirling PDF** | Local Docker | Arabic OCR processing |

## Data Model

The database schema uses two core tables:

- **`documents`** — Stores document metadata: title, type, department, key dates, entities, monetary values, summary, full text, file path
- **`document_embeddings`** — Stores text chunks with 768-dimensional vector embeddings, linked to source documents

A PostgreSQL function `match_documents_with_sources()` handles similarity search with cosine distance and optional source filtering.

## Key Files

| File | Purpose |
|---|---|
| `docker-compose.yml` | Local development orchestration (6 services) |
| `init.sql` | Database schema with pgvector and search functions |
| `n8n_workflows/` | Workflow JSON definitions for all automation pipelines |
| `frontend/` | React + Vite Arabic chat interface |
| `waha/Dockerfile` | WAHA WhatsApp API container |
| `fix_n8n_json.py` | Migration script (WhatsApp → WAHA, OpenAI → Gemini, MongoDB → PostgreSQL) |
| `generate_n8n_json.py` | Standalone workflow JSON generator |

## Infrastructure Migration

The system was migrated from:
- **WhatsApp Trigger** → **WAHA Webhook** (WhatsApp HTTP API)
- **OpenAI (GPT-4o-mini)** → **Google Gemini 1.5 Pro**
- **OpenAI Embeddings** → **Gemini text-embedding-004**
- **MongoDB + Atlas Vector Search** → **PostgreSQL + pgvector**

## Security Notes

- WAHA API and n8n endpoints require authentication tokens
- FTP server uses credentials (`scanner/scanner123`)
- Production n8n instance uses MCP authentication
- Document ingestion and retrieval are internal service operations
