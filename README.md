# LLM API Gateway (Express.js) - Multi-Provider, RAG & AI Agents

A production-ready, provider-agnostic REST API built with **Node.js + Express** for integrating Large Language Models (LLMs). This project goes beyond basic chat by implementing advanced **Prompt Engineering**, **RAG (Retrieval-Augmented Generation)**, and **Autonomous AI Agents (Function Calling)**.

---

## ✨ Features

- 🔀 **Provider-agnostic** — switch between Groq, OpenAI, and Gemini via `.env`
- 🌊 **Streaming responses** using Server-Sent Events (SSE)
- 🧠 **Prompt Engineering** — Structured JSON extraction & AI Code Review endpoints
- 📚 **RAG Pipeline** — Ingest documents and query them using local embeddings (100% Free, no embedding API costs)
- 🤖 **Autonomous AI Agent** — Implements the ReAct (Reasoning + Acting) loop with Function Calling. The agent dynamically selects tools (Math Calculator, Time, Creative Writing) based on user intent.
- 🔁 **Automatic retry** with exponential backoff on `429` / `5xx` errors
- 🛡️ **Rate limiting** per IP (20 requests / minute by default)
- ⚙️ **Configurable** via environment variables
- 🧩 **Clean architecture** — routes / services / middleware separation
- 🆓 **Works with Groq's free tier** — no credit card required
- ⚡ **Redis Caching:** Implements Cache-Aside pattern with MD5 hashing to minimize redundant LLM API calls, reducing latency and saving costs.
- 📬 **Asynchronous Message Queue:** Integrated BullMQ (Redis-based) to handle long-running RAG document ingestion tasks in the background, preventing API timeouts and improving user experience (202 Accepted pattern).

---

## 📁 Project Structure

```
llm-api-expressjs/
├── .env.example
├── package.json
├── server.js
├── routes/
│   ├── chat.js           # Basic Chat & Prompt Engineering (Extract, Code Review)
│   ├── rag.js            # Document Upload & RAG Query
│   └── agent.js          # Autonomous AI Agent (ReAct Loop)
├── services/
│   ├── llm.js            # Multi-provider LLM client & Retry logic
│   ├── promptService.js  # System prompts for JSON extraction & Code Review
│   ├── ragService.js     # LangChain & Vector Store logic
│   ├── cacheService.js   # Redis cache
│   └── agentService.js   # Tool definitions & Execution logic
│
├── docker-compose.yml
└── middleware/
    └── rateLimit.js
```

---

## 🚀 Installation

### 1. Install Node.js
- **Node.js v20.10+** (Required for `@huggingface/transformers`)
- **Groq API Key** (Free at [console.groq.com](https://console.groq.com))

Download and install Node.js (v20 or later) from [nodejs.org](https://nodejs.org).

Verify the installation:

```bash
node -v
npm -v
```

### 2. Clone the repository

```bash
git clone https://github.com/abmrifat1/llm_api_expressJs.git
cd llm_api_expressJs
```

### 3. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 4. Configure environment variables

Copy the example env file:

```bash
cp .env.example .env
```

Then open `.env` and fill in:

| Variable         | Description                                      | Example                  |
| ---------------- | ------------------------------------------------ | -------------------------|
| `PORT`           | Server port                                      | `3000`                   |
| `PROVIDER`       | Active LLM provider (`groq`, `openai`, `gemini`) | `groq`                   |
| `GROQ_API_KEY`   | Your Groq API key                                | `gsk_xxxxxxxx`           |
| `OPENAI_API_KEY` | Your OpenAI API key (optional)                   | `sk-xxxxxxxx`            |
| `GEMINI_API_KEY` | Your Gemini API key (optional)                   | `xxxxxxxx`               |
| `MODEL`          | Model ID to use                                  | `openai/gpt-oss-120b`    |
| `MAX_TOKENS`     | Max tokens per response                          | `1024`                   |
| `REDIS_URL`      | Redis server                                     | `redis://localhost:6379` |

**Example `.env` for Groq (free tier):**

```env
PORT=3000
PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
MODEL=openai/gpt-oss-120b
MAX_TOKENS=1024
REDIS_URL=redis://localhost:6379
```

> 🔑 Get a **free Groq API key** (no credit card required) at [console.groq.com/keys](https://console.groq.com/keys).

### 5. Start Redis (Docker)
Run the following command to start Redis in the background:
```bash
docker compose up -d
```

### 6. Run the server

Development mode (auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

You should see:

```
providerName => groq
```

---

## 🧪 API Endpoints

### 1. `POST /api/chat` — Standard JSON response

Sends a chat completion request and returns the full response.

**URL:** `http://localhost:3000/api/chat`

**Method:** `POST`

**Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "My name is Khorshed Alam." },
    { "role": "assistant", "content": "Nice to meet you, Khorshed Alam!" },
    { "role": "user", "content": "What is my name?" }
  ]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "My name is Khorshed Alam." },
      { "role": "assistant", "content": "Nice to meet you, Khorshed Alam!" },
      { "role": "user", "content": "What is my name?" }
    ]
  }'
```

**Response:**

```json
{
  "reply": "Your name is Khorshed Alam.",
  "model": "openai/gpt-oss-120b",
  "usage": {
    "promptTokens": 42,
    "completionTokens": 6,
    "totalTokens": 48
  }
}
```

---

### 2. `POST /api/chat/stream` — Streaming response (SSE)

Streams the response token-by-token using Server-Sent Events. Useful for chat UIs.

**URL:** `http://localhost:3000/api/chat/stream`

**Method:** `POST`

**Headers:** `Content-Type: application/json`

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "Count from 1 to 5." }
  ]
}
```

**cURL Example:**

```bash
curl -N -X POST http://localhost:3000/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{ "role": "user", "content": "Count from 1 to 5." }]
  }'
```

**Streaming Response:**

```
data: {"delta":"1"}

data: {"delta":","}

data: {"delta":" 2"}

data: {"delta":","}

data: {"delta":" 3"}

data: {"delta":","}

data: {"delta":" 4"}

data: {"delta":","}

data: {"delta":" 5"}

data: {"delta":"."}

data: [DONE]
```

Each line is a JSON object with a `delta` field containing a chunk of text. The stream ends with `data: [DONE]`.

---

### 3. `POST /api/chat/extract` — JSON Data Extraction

Uses strict system prompts to extract structured JSON from raw text.

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/chat/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "My name is Khorshed, I am 30 years old and I know Rect, React native, Angular, Node, NextJs, NestJs and ExpressJs."}'
```

**Response:**
```json
{
  "extractedData": {
    "name": "Khorshed",
    "age": 30,
    "skills": ["Rect", "React native", "Angular", "Node", "NextJs", "NestJs", "ExpressJs"]
  },
  "usage": { "promptTokens": 85, "completionTokens": 20, "totalTokens": 105 }
}
```
---

### 4. `POST /api/chat/review-code` — AI Code Reviewer

Uses Role Prompting and Chain-of-Thought to review code like a Senior Engineer.

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/chat/review-code \
  -H "Content-Type: application/json" \
  -d '{"code": "function add(a, b) { return a + b; }"}'
```

**Response:**
```json
{
  "review": "### Issues Found\n- No input validation.\n### Improvements\n- Add type checking.\n### Refactored Code\n```javascript\nfunction add(a, b) {\n  if (typeof a !== \"number\" || typeof b !== \"number\") throw new Error(\"Invalid input\");\n  return a + b;\n}\n```",
  "usage": { "promptTokens": 120, "completionTokens": 65, "totalTokens": 185 }
}
```
---

### 5. `POST /api/rag/upload` — Upload Document for RAG
Ingests text into the local vector store.
```bash
curl -X POST http://localhost:3000/api/rag/upload \
  -H "Content-Type: application/json" \
  -d '{"text": "Your long document text here..."}'
```

### 6. `POST /api/rag/query` — Query RAG Document
Asks a question based on the uploaded document.
```bash
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the document about?"}'
```

### 7. `POST /api/agent/chat` — Autonomous AI Agent (Function Calling)

Executes an autonomous ReAct (Reasoning + Acting) loop. The agent decides when to use external tools (Calculator, Current Time) to fulfill the user's request.

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is 15 * 4 + 10? And what is the current time?"}'
  ```
---


## 🔀 Switching Providers

Just edit `.env` and restart the server — **no code changes needed**.

**Groq (free):**
```env
PROVIDER=groq
GROQ_API_KEY=gsk_xxxx
MODEL=openai/gpt-oss-120b
```

**OpenAI (requires credits):**
```env
PROVIDER=openai
OPENAI_API_KEY=sk-xxxx
MODEL=gpt-4o-mini
```

**Google Gemini (free tier available):**
```env
PROVIDER=gemini
GEMINI_API_KEY=xxxx
MODEL=gemini-2.0-flash
```

---

## ⚠️ Notes

- **Rate limits:** Groq's free tier has per-minute and per-day token limits. If you hit them, wait a moment or switch to a smaller model.
- **Model availability:** LLM providers deprecate models periodically. If you get a `model_not_found` error, check the provider's docs for the latest model IDs.
- **Never commit `.env`** — it contains your API keys. The included `.gitignore` already excludes it.
- **Server-side only:** API keys must only live on the server. Do not expose them to the frontend.

---

## 🛠️ Tech Stack

- **Node.js & Express** — Core API
- **openai** — SDK for Groq/OpenAI/Gemini
- **LangChain** (`@langchain/*`) — RAG and AI Agent orchestration
- **@huggingface/transformers** — Local Embeddings (No API cost)
- **MemoryVectorStore** — In-memory Vector Database
- **mathjs** — Secure mathematical evaluation for Agent Tools
- **dotenv, cors, express-rate-limit**
- **Redis & Docker** — In-memory caching & containerization

---

## 🚀 Future Improvements (Production Scaling)

- **Persistent Vector Storage:** Currently uses `MemoryVectorStore` for zero-config setup. In production, this can be swapped with a production-grade vector database like `PGVectorStore` (PostgreSQL + pgvector) or Pinecone to ensure data persistence and HNSW indexing.
- **Document Parsers:** Add support for uploading PDF, DOCX, and CSV files instead of raw text.
- **User Authentication:** Add JWT-based authentication and per-user document isolation.

---

## 📄 License

MIT — feel free to use, modify, and share.

---

## 👤 Author

**Khorshed Alam**
GitHub: [@abmrifat1](https://github.com/abmrifat1)

---

## 🙏 Acknowledgements

- [Groq](https://groq.com) — fast, free LLM inference
- [OpenAI](https://openai.com) — API design & SDK
- [Google Gemini](https://ai.google.dev) — additional model access

---

**⭐ If this project helped you, please consider giving it a star!**