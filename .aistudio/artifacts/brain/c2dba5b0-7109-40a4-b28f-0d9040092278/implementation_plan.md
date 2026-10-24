# NEXZ — Complete Technical Architecture & System Documentation Plan

A comprehensive architectural blueprint detailing the tech stack, component hierarchies, backend pipelines, file types, methodologies, and design patterns powering NEXZ (Next-Gen Intelligence News Terminal).

## User Review & Critical Decisions

> [!IMPORTANT]
> Based on your preferences:
> - **Format & Depth**: Full Technical Architecture and Documentation Report.
> - **Delivery**: Complete, detailed in-chat response accompanied by a permanent `ARCHITECTURE.md` reference file in the project repository.
> 
> Review the implementation plan below and click **Proceed** to generate the documentation.

- **Confirmed Decision 1**: Structure the report into clear technological domains (Frontend, Backend, AI/LLM Pipeline, Data & Persistence, Security, and File Types & Methodologies).
- **Confirmed Decision 2**: Persist the documentation directly into `/ARCHITECTURE.md` in the project root for continuous reference, while delivering the full structured breakdown in chat.

---

### 1. Overview & Core Concept

- **What It Does**: NEXZ is an intelligence-grade, real-time news monitoring terminal and cognitive reading platform. It aggregates global headlines from multiple wire services, calculates cross-source corroboration and credibility metrics, and provides an interactive AI layer for conversational deep-dives and adaptive reading levels (ELI5 to Expert).
- **Target Audience / Persona**: Analysts, researchers, developers, and information professionals who require synthesized news, factual verification, and rapid contextual analysis without clickbait or algorithmic noise.
- **Key Value**: Real-time multi-feed aggregation, multi-tier AI model cascade with zero single-point-of-failure fallbacks, interactive 3D knowledge visualization, and instant multi-level readability transformation.

---

### 2. User Experience & Visual Design

- **Visual Identity & Aesthetic**: Cybernetic terminal and Bloomberg-style intelligence dashboard. Dark theme (`#08090C`, `#0E1117`) accented with electric emerald (`#10B981`), cobalt blue (`#3B82F6`), amber alerts (`#F59E0B`), and cyber crimson (`#EF4444`).
- **Typography & Layout**: Monospaced data tags and telemetry headers paired with clean sans-serif editorial typography for optimal long-form reading density.
- **Key Interactive Flows**:
  - *Intelligence Feed*: Real-time category filtering (World, Tech, Business, Science, Crypto, AI), state/country region switching, search queries, and live ticker tape.
  - *Article Analysis View*: Deep reading mode featuring credibility scores, cross-source corroboration badges, and related coverage graphs.
  - *Adaptive Explainer*: Multi-tier slider instantly transforming complex stories into ELI5 (5-year-old), Teen, or High-Level Expert summaries.
  - *AI Research Orb & Chat*: Interactive query console allowing readers to question the specific article context with cited quotes and verified facts.
  - *3D Spatial Visualizers*: Three.js / React Three Fiber interactive globe and knowledge cluster representations.

---

### 3. Key Architectural Decisions & Methodologies

- **Multi-Tier AI Engine Cascade**:
  - *Primary*: Gemini 3.1 Flash Lite (`@google/genai`) for sub-second, cost-effective inference.
  - *Secondary*: Gemini 3.8 Flash for high-reasoning tasks.
  - *Tertiary*: Groq SDK (Llama 3 / Mixtral) as an external fallback when quotas or neural networks experience peak load.
  - *Resilience*: Strict timeout handling (60s), categorized status codes (429 Quota Exceeded, 503 Provider Unavailable, 504 Network Timeout), and exponential backoff.
- **Full-Stack Hybrid Monorepo**:
  - Unified npm workspace orchestrating an Express 4.21 backend with an embedded Vite dev server in development, and high-performance static asset hosting in production.
- **Data Fetching & Caching Strategy**:
  - Multi-wire news scraper/aggregator utilizing in-memory TTL caching with MD5 content hashing for deterministic URL-safe indexing and zero-redundancy deduplication.
- **State Management & Persistence**:
  - React Contexts for cross-cutting global concerns (`AuthContext`, `ChatContext`, `ThemeContext`), coupled with local/cloud hybrid synchronization for bookmarks and reading history.

---

### 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (SPA)                              │
│                                                                        │
│  React 19 + Vite 8 + Tailwind CSS v4 + React Router DOM 7             │
│                                                                        │
│  ┌───────────────────────────┬──────────────────────────────────────┐  │
│  │   Pages & Routing         │   Contexts & State                   │  │
│  │   - HomePage              │   - AuthContext (Firebase)           │  │
│  │   - ArticlePage           │   - ChatContext (AI Dialogue)        │  │
│  │   - LandingPage           │   - ThemeContext (Terminal UI)       │  │
│  │   - AdminPage             │                                      │  │
│  └─────────────┬─────────────┴──────────────────┬───────────────────┘  │
│                │                                │                      │
│  ┌─────────────▼─────────────────────────────┐  │                      │
│  │   Interactive Components                  │  │                      │
│  │   - ChatPanel & ChatOrb (AI Assistant)    │  │                      │
│  │   - ExplainSlider (ELI5 -> Expert)        │  │                      │
│  │   - NewsGrid, NewsCard, BookmarksModal    │  │                      │
│  │   - HeroGlobe & KnowledgeNetwork (Three)  │  │                      │
│  │   - CredibilityMeter, TrendingTicker      │  │                      │
│  └─────────────────────┬─────────────────────┘  │                      │
│                        │                        │                      │
│  ┌─────────────────────▼────────────────────────▼───────────────────┐  │
│  │   Client Services Layer (Axios instance, 30-60s timeouts)        │  │
│  │   - api.js, newsService.js, bookmarkService.js, firebase.js      │  │
│  └─────────────────────────────────┬────────────────────────────────┘  │
└────────────────────────────────────┼───────────────────────────────────┘
                                     │ HTTP / REST (/api/*)
┌────────────────────────────────────▼───────────────────────────────────┐
│                          SERVER (Node.js / Express)                    │
│                                                                        │
│  server.js (Vite Middleware in dev / Static server in prod)           │
│                                                                        │
│  ┌─────────────────┬──────────────────┬─────────────────────────────┐  │
│  │  /api/news      │  /api/llm        │  /api/admin                 │  │
│  │  - Feed fetch   │  - /chat         │  - System metrics           │  │
│  │  - Search       │  - /explain      │  - Cache inspection         │  │
│  │  - Category     │  - Corroboration │  - Provider health          │  │
│  └────────┬────────┴────────┬─────────┴──────────────┬──────────────┘  │
│           │                 │                        │                 │
│  ┌────────▼──────────┐ ┌────▼─────────────────┐ ┌────▼──────────────┐  │
│  │ Wire Service      │ │ AI Engine Cascade    │ │ In-Memory Cache   │  │
│  │ - Multi-source RSS│ │ - Gemini 3.1 Lite    │ │ - TTL Storage     │  │
│  │ - MD5 Hash Engine │ │ - Gemini 3.8 Flash   │ │ - LRU Eviction    │  │
│  │ - Deduplication   │ │ - Groq (Llama-3)     │ │ - Deduplication   │  │
│  └───────────────────┘ └──────────────────────┘ └───────────────────┘  │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Firebase Admin (Auth verification & Cloud synchronization)       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 5. File Types & Methodologies Breakdown

| File Type / Extension | Primary Role in NEXZ | Key Methodologies & Conventions |
| :--- | :--- | :--- |
| **`.jsx` / `.tsx`** | UI views, layouts, and components | Functional React 19 components with hooks, atomic design, strict separation of concerns, Framer Motion animations. |
| **`.js` / `.mjs`** | Backend server, API routes, utilities | ES Modules (`import`/`export`), Express middleware pipelines, centralized async error handlers, structured logging. |
| **`.css`** | Global styling and visual tokens | Tailwind CSS v4 (`@import "tailwindcss";`), custom color variables, dark-mode terminal overrides, custom scrollbars. |
| **`.json`** | Configuration & metadata | Workspace manifests (`package.json`), build and lint setups, platform capability declarations (`metadata.json`). |
| **`.md`** | Documentation & Architecture | System architecture manuals, API specifications, and operational runbooks. |

---

### 6. Execution Steps Upon Approval

1. **Create Repository Documentation File (`/ARCHITECTURE.md`)**:
   - Write a self-contained, publication-grade architectural document covering system topology, directory map, API endpoints, error handling protocols, dependencies matrix, and deployment instructions.
2. **Deliver Complete In-Chat Breakdown**:
   - Provide the complete, structured analysis directly in chat covering all user queries (technologies used for what, methodologies, file types, architecture diagrams, and operational guides).
3. **Compile & Lint Verification**:
   - Validate that all application checks pass with zero syntax or build errors.
