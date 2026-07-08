# Archive — Jana Holdings Knowledge Base Infrastructure

AI-powered Retrieval-Augmented Generation (RAG) system for document management, semantic search, and conversational Q&A in Arabic.

## Architecture

```
[WhatsApp Users] <--WAHA--> [n8n Workflows] <---> [PostgreSQL + pgvector]
                                      |
                                 [Gemini AI]
                                      |
                               [Stirling PDF OCR]
                                      |
                               [FTP Scanner Input]
```

## Components

| Service | Description |
|---|---|
| **n8n** | Workflow automation — RAG pipelines, ingestion, WhatsApp bots |
| **PostgreSQL + pgvector** | Vector database with 768-dim Gemini embeddings |
| **Frontend** | React + Vite Arabic chat UI (port 5173) |
| **WAHA** | WhatsApp HTTP API wrapper for WhatsApp Business |
| **Stirling PDF** | OCR pipeline for Arabic scanned documents |
| **FTP Server** | Scanner document intake |

## Key Workflows

- **Jana-LM Retrieval API** — Webhook-based semantic search + Gemini answer synthesis
- **WAHA LangChain Workflow** — WhatsApp chat bot with Knowledge Base Agent, Postgres vector search, and Simple Memory
- **Ingestion & OCR Pipeline** — Scans PDFs → OCR → Gemini metadata extraction → PostgreSQL

## Tech Stack

- **AI**: Google Gemini 1.5 Pro (chat), text-embedding-004 (embeddings)
- **Database**: PostgreSQL 16 + pgvector
- **Messaging**: WAHA (WhatsApp HTTP API)
- **Automation**: n8n
- **Frontend**: React 19, Vite 8, Lucide React
- **Infrastructure**: Docker Compose, Railway

## Deployment

Deployed on Railway. The n8n instance is accessible at the configured MCP/webhook endpoints.
