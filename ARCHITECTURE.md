# NEXZ — Complete Technical Architecture & System Documentation

```
███╗   ██╗███████╗██╗  ██╗███████╗
████╗  ██║██╔════╝╚██╗██╔╝╚══███╔╝
██╔██╗ ██║█████╗   ╚███╔╝   ███╔╝ 
██║╚██╗██║██╔══╝   ██╔██╗  ███╔╝  
██║ ╚████║███████╗██╔╝ ██╗███████╗
╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝╚══════╝
Next-Generation Intelligence News Terminal
```

---

## 1. Executive Summary

**NEXZ** is a real-time, intelligence-grade news monitoring terminal and cognitive reading platform. Designed for analysts, researchers, and information professionals, NEXZ shifts news consumption from algorithmic clickbait to analytical intelligence. It aggregates global headlines from multiple wire services, analyzes cross-source corroboration and credibility, visualizes relational topic clusters in interactive 3D space, and provides an integrated, multi-tier AI cognitive assistant for custom reading depths (ELI5 to Expert).

---

## 2. Technology Stack Breakdown: What Tech is Used for What

### 2.1. Frontend Tier (Client Application)

| Technology / Library | Version | Specific Purpose & Implementation Role |
| :--- | :--- | :--- |
| **React** | `v19.2.7` | Core UI library powering component lifecycle, declarative rendering, and interactive state management. |
| **Vite** | `v8.1.1` | Next-generation frontend build tooling and HMR dev server; optimized bundling with code splitting. |
| **Tailwind CSS** | `v4.3.2` | Zero-runtime CSS framework utilizing `@tailwindcss/vite` and CSS custom variables for the dark terminal aesthetic. |
| **React Router DOM** | `v7.18.1` | Declarative client-side routing (`/`, `/feed`, `/article/:hash`, `/auth`, `/admin`). |
| **Three.js** | `v0.185.1` | Low-level WebGL graphics engine for rendering 3D mathematical meshes and geospatial projections. |
| **@react-three/fiber** | `v9.6.1` | React reconciler for Three.js, embedding 3D canvas objects into the declarative React tree. |
| **@react-three/drei** | `v10.7.7` | Helper utilities for Three.js scenes (`OrbitControls`, `Sphere`, `Float`, procedural geometry). |
| **Framer Motion** | `v12.42.2` | Production-grade motion and physics library driving page transitions, sliding drawer trays, and ticker tapes. |
| **Lucide React** | `v1.23.0` | Comprehensive iconography system optimized for terminal aesthetics and UI telemetry icons. |
| **Axios** | `v1.18.1` | Promise-based HTTP client with interceptors, request timeout guards (60s), and categorized error mapping. |
| **React Markdown** | `v10.1.0` | Markdown parser and renderer for formatting rich LLM AI responses and structured bulleted summaries. |
| **Firebase Client SDK** | `v12.15.0` | Client-side user authentication (Google, Email/Password) and Firestore profile synchronization. |
| **MD5 (`md5`)** | `v2.3.0` | Cryptographic hashing utility for converting canonical article URLs into deterministic, safe route identifiers. |

---

### 2.2. Backend Tier (Server & API Services)

| Technology / Library | Version | Specific Purpose & Implementation Role |
| :--- | :--- | :--- |
| **Node.js** | `v20+` | Server runtime executing asynchronous I/O, feed parsing, and AI model orchestration. |
| **Express** | `v4.21.0` | Web application framework handling API routing, body parsing, CORS policies, and error handling. |
| **Vite Middleware** | `v8.1.1` | Embedded inside `server.js` during development to proxy frontend requests and serve HMR over port 3000. |
| **@google/genai** | `v2.23.0` | Official Google GenAI SDK powering Gemini 3.1 Flash Lite and Gemini 3.8 Flash inference. |
| **Groq SDK** | `v0.5.0` | Ultra-fast inference SDK serving Llama-3-70b/8b as an instant third-tier failover. |
| **Firebase Admin SDK**| `v12.0.0` | Secure server-side credential verification, user record management, and cloud database administration. |
| **Axios (Server)** | `v1.7.0` | Server-to-server HTTP client fetching RSS feeds and external wire services with configurable timeouts. |
| **Cors & Dotenv** | `^2.8.5` / `^16.4.0` | Cross-Origin Resource Sharing control and environment variable hydration. |

---

### 2.3. Tooling & Development Ecosystem

- **Oxlint (`oxlint`)**: Next-generation Rust-based linter ensuring zero syntax regressions, unhandled exceptions, or malformed React hooks with sub-100ms execution times.
- **NPM Workspaces**: Monorepo orchestration linking the `client` and `server` packages under a unified root repository.

---

## 3. High-Level System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT WORKSPACE                              │
│                                                                              │
│  React 19 SPA (Port 3000)                                                    │
│  ┌─────────────────────────┬─────────────────────────┬────────────────────┐  │
│  │   Pages                 │   Components            │   Global Contexts  │  │
│  │   - LandingPage         │   - NewsGrid & Cards    │   - AuthContext    │  │
│  │   - HomePage (Feed)     │   - ExplainSlider       │   - ChatContext    │  │
│  │   - ArticlePage         │   - ChatPanel & ChatOrb │   - ThemeContext   │  │
│  │   - AdminPage           │   - HeroGlobe (3D)      │                    │  │
│  └────────────┬────────────┴────────────┬────────────┴──────────┬─────────┘  │
│               │                         │                       │            │
│  ┌────────────▼─────────────────────────▼───────────────────────▼─────────┐  │
│  │   Client Services Layer (Axios with 60s timeout & error categorizer)   │  │
│  │   - api.js: Central Axios instance                                     │  │
│  │   - newsService.js: Article querying & pagination                      │  │
│  │   - bookmarkService.js: LocalStorage + Cloud synced bookmarks          │  │
│  │   - firebase.js: Auth & Firestore client init                          │  │
│  └──────────────────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────────────────┼────────────────────────────────────┘
                                          │ HTTP REST Requests (/api/*)
┌─────────────────────────────────────────▼────────────────────────────────────┐
│                                SERVER WORKSPACE                              │
│                                                                              │
│  Express 4.21 Application (server/server.js)                                 │
│                                                                              │
│  ┌────────────────────┬──────────────────────┬────────────────────────────┐  │
│  │  /api/news         │  /api/llm            │  /api/admin                │  │
│  │  - GET /           │  - POST /chat        │  - GET /metrics            │  │
│  │  - GET /search     │  - POST /explain     │  - GET /cache              │  │
│  │  - GET /categories │  - POST /corroborate │  - POST /cache/purge       │  │
│  └─────────┬──────────┴──────────┬───────────┴──────────────┬─────────────┘  │
│            │                     │                          │                │
│  ┌─────────▼───────────┐ ┌───────▼─────────────────┐ ┌──────▼──────────────┐ │
│  │ Wire Service Engine │ │ Multi-Tier AI Cascade   │ │ In-Memory Cache     │ │
│  │ - RSS Multi-Feed    │ │ 1. Gemini 3.1 Flash Lite│ │ - TTL Expiration    │ │
│  │ - HTML Parser       │ │ 2. Gemini 3.8 Flash     │ │ - MD5 Key Indexing  │ │
│  │ - Hash Deduplicator │ │ 3. Groq (Llama-3-70b)   │ │ - LRU Eviction      │ │
│  └─────────────────────┘ └─────────────────────────┘ └─────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │ Firebase Admin Verification & Identity Shield                          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Methodologies & Engineering Patterns

### 4.1. The Resilient AI Cascade Methodology
To guarantee 99.99% cognitive availability and prevent UI lockups from API rate limits (HTTP 429), the LLM routing subsystem in `server/utils/aiEngine.js` uses a resilient fallback chain:

1. **Tier 1 (Default)**: `gemini-3.1-flash-lite` via `@google/genai`
   - Ultra-fast response time (~1.5s - 2.5s)
   - High daily request quota
   - Ideal for summarization, entity extraction, and conversational Q&A
2. **Tier 2 (Failover)**: `gemini-3.8-flash` via `@google/genai`
   - Invoked if Tier 1 experiences model-specific transient errors or if deeper analytical depth is requested
3. **Tier 3 (External Fallover)**: `groq-sdk` with `llama-3.3-70b-versatile` or `mixtral-8x7b-32768`
   - Independent infrastructure fallback if Google API rate limits or network issues occur
4. **Diagnostic Telemetry**:
   - Every AI request logs timestamps, candidate model transitions, duration in milliseconds, and status codes while masking authorization keys.

### 4.2. Article Ingestion, Deduplication & Hashing
- **Deterministic Hashing**: When news items are fetched from wire services, their canonical URL is hashed using MD5 (`md5(url)`).
- **URL-Safe Navigation**: Instead of passing unwieldy, special-character-laden external URLs through client routes, the application uses `/article/:hash`.
- **In-Memory LRU & TTL Caching**: The server cache stores articles with a 15-minute Time-To-Live (TTL). Identical news requests within the TTL window resolve in sub-millisecond time without making redundant outbound HTTP requests.
- **Corroboration Scoring**: Articles across distinct outlets are matched using headline cosine similarity and keyword overlap to compute a 0–100% corroboration score.

### 4.3. Adaptive Cognitive Explainer (Multi-Tier Reading)
The explain engine supports 3 calibrated reading depths:
- **ELI5 (Explain Like I'm 5)**: Analogies, simple metaphors, zero industry jargon.
- **Teen**: Conversational, accessible, practical context without losing core technological facts.
- **Expert**: High-density executive briefing focusing on market impact, technical specifications, and strategic implications.

### 4.4. Defensive Frontend-Backend Protocol
- **Timeout Alignment**: Frontend Axios instances are configured with a generous 60,000ms timeout to accommodate deep LLM inference, preventing premature `ECONNABORTED` client exceptions.
- **Categorized Error Objects**: The server rejects failed calls with structured JSON payloads containing both technical error codes and user-friendly explanations (`category: "Quota Exceeded" | "Network Timeout" | "Bad Request"`).

---

## 5. File Types & Role Mapping

| Extension | Subdirectory | Purpose & Engineering Responsibility |
| :--- | :--- | :--- |
| **`.jsx`** | `/client/src/pages/` | Top-level routing views (`HomePage.jsx`, `ArticlePage.jsx`, `LandingPage.jsx`, `AdminPage.jsx`). |
| **`.jsx`** | `/client/src/components/article/` | Article-level widgets (`ChatPanel.jsx`, `ExplainSlider.jsx`, `CredibilityMeter.jsx`, `RelatedNews.jsx`). |
| **`.jsx`** | `/client/src/components/news/` | Feed components (`NewsGrid.jsx`, `NewsCard.jsx`, `CategoryTabs.jsx`, `TrendingTicker.jsx`, `BookmarksModal.jsx`). |
| **`.jsx`** | `/client/src/components/layout/` | Shell components (`Navbar.jsx`, `ChatOrb.jsx`, `HeroGlobe.jsx`, `KnowledgeNetwork.jsx`, `ErrorBoundary.jsx`). |
| **`.jsx`** | `/client/src/contexts/` | Global state providers (`AuthContext.jsx`, `ChatContext.jsx`, `ThemeContext.jsx`). |
| **`.js`** | `/client/src/services/` | API abstraction modules (`api.js`, `newsService.js`, `bookmarkService.js`, `firebase.js`). |
| **`.js`** | `/server/routes/` | Express route controllers (`news.js`, `llm.js`, `admin.js`). |
| **`.js`** | `/server/utils/` | Core logic modules (`aiEngine.js`, `wireService.js`, `cache.js`, `logger.js`, `groq.js`). |
| **`.css`** | `/client/src/` | Styling rules (`index.css` importing Tailwind v4, custom theme variables, cyber-terminal scrollbars). |
| **`.json`** | Project Roots | Workspace manifests, package dependency trees, and platform metadata. |
| **`.md`** | Project Root | System specifications and operational architectural references (`ARCHITECTURE.md`). |

---

## 6. Directory Structure & Code Map

```
/
├── package.json                   # Root monorepo workspace manifest
├── metadata.json                   # Applet configuration & permissions
├── ARCHITECTURE.md                 # Complete system architecture specification
├── client/                         # Frontend Application (React 19 + Vite 8)
│   ├── index.html                 # HTML entry point with telemetry meta tags
│   ├── package.json               # Client dependencies & scripts
│   ├── vite.config.js             # Vite configuration with React & Tailwind plugins
│   └── src/
│       ├── main.jsx               # React DOM bootstrap
│       ├── App.jsx                # Router definition & layout shell
│       ├── index.css              # Tailwind CSS v4 root stylesheet
│       ├── components/
│       │   ├── article/           # ChatPanel, ExplainSlider, CredibilityMeter
│       │   ├── auth/              # AuthModal, ProfileDropdown
│       │   ├── layout/            # Navbar, HeroGlobe (3D), ChatOrb, KnowledgeNetwork
│       │   └── news/              # NewsGrid, NewsCard, CategoryTabs, TrendingTicker
│       ├── contexts/              # AuthContext, ChatContext, ThemeContext
│       ├── hooks/                 # Custom React hooks (useNews, useBookmarks)
│       ├── pages/                 # HomePage, ArticlePage, LandingPage, AdminPage
│       └── services/              # api.js, newsService.js, bookmarkService.js
└── server/                         # Backend Application (Node.js + Express 4.21)
    ├── server.js                  # Server entry point, Vite dev middleware & static server
    ├── package.json               # Server dependencies & scripts
    ├── middleware/                # Auth token validation, rate limiters, logging
    ├── routes/
    │   ├── news.js                # Aggregated feed, search, and categorization APIs
    │   ├── llm.js                 # Chat, Explain (ELI5/Expert), and Analysis APIs
    │   └── admin.js               # Diagnostics, cache metrics, and provider status
    └── utils/
        ├── aiEngine.js            # Multi-tier AI engine (Gemini Flash Lite -> Flash -> Groq)
        ├── wireService.js         # Multi-feed RSS scraper and deduplication engine
        ├── cache.js               # High-performance in-memory TTL cache
        ├── logger.js              # Structured diagnostic and error logger
        └── groq.js                # Groq SDK client wrapper
```

---

## 7. Key API Endpoints Specification

### 7.1. News Endpoints (`/api/news`)
- **`GET /api/news`**: Query news feeds by category (`tech`, `world`, `business`, `science`, `crypto`), country code, and page number. Returns paginated article objects with MD5 hashes.
- **`GET /api/news/search?q=:query`**: Perform full-text search across cached and live wire feeds.
- **`GET /api/news/categories`**: Retrieve list of active news channels and item counts.

### 7.2. Cognitive AI Endpoints (`/api/llm`)
- **`POST /api/llm/chat`**:
  - *Payload*: `{ "question": string, "articleText"?: string, "context"?: object }`
  - *Behavior*: Answers queries contextualized to the active article or general news intelligence.
  - *Response*: `{ "status": "ok", "answer": string, "provider": string }`
- **`POST /api/llm/explain`**:
  - *Payload*: `{ "articleText": string, "level": "eli5" | "teen" | "expert" }`
  - *Behavior*: Transforms article into calibrated reading levels using prompt-engineered directives.
  - *Response*: `{ "status": "ok", "summary": string, "level": string, "provider": string }`

### 7.3. Administration & Diagnostics (`/api/admin`)
- **`GET /api/admin/metrics`**: Uptime, total memory usage, cache hit ratio, active model provider.
- **`POST /api/admin/cache/purge`**: Clear server-side in-memory news and LLM response caches.

---

## 8. Development & Deployment Procedures

### 8.1. Running Locally
```bash
# Install all root, client, and server dependencies
npm install

# Start unified development server (Express + Vite on Port 3000)
npm run dev
```

### 8.2. Linting & Verification
```bash
# Run ultra-fast Rust-based Oxlint
npm run lint
```

### 8.3. Production Build
```bash
# Build production client bundle
npm run build

# Start production server
npm start
```
