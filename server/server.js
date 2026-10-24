import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert } from 'firebase-admin/app';
import { createServer as createViteServer } from 'vite';

// Route imports
import newsRouter from './routes/news.js';
import llmRouter, { seedDefaultPrompts } from './routes/llm.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '../client');

// ========================================================
// Firebase Admin SDK Initialization
// ========================================================
function initializeFirebase() {
  const serviceAccountPath = './serviceAccountKey.json';

  // Option 1: Service account key file
  if (existsSync(serviceAccountPath)) {
    try {
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
      global.FIREBASE_FIRESTORE_ENABLED = true;
      console.log('[Firebase] Initialized with service account key file.');
      return;
    } catch (error) {
      console.error('[Firebase] Failed to read service account file:', error.message);
    }
  }

  // Option 2: Service account from environment variable (JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
      global.FIREBASE_FIRESTORE_ENABLED = true;
      console.log('[Firebase] Initialized with FIREBASE_SERVICE_ACCOUNT env var.');
      return;
    } catch (error) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT:', error.message);
    }
  }

  // Option 3: Fallback with project ID only (limited functionality)
  console.warn('[Firebase] ⚠ No service account found. Initializing with projectId only.');
  console.warn('[Firebase]   Auth verification and Firestore will NOT work.');
  console.warn('[Firebase]   Place serviceAccountKey.json in the server directory.');
  global.FIREBASE_FIRESTORE_ENABLED = false;
  initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'nexz-c24d9',
  });
}

initializeFirebase();

// ========================================================
// Express App Setup
// ========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Body parser with 10mb limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================================
// Route Mounting (both /api/prefix and direct prefix)
// ========================================================
app.use('/api/news', newsRouter);
app.use('/api/llm', llmRouter);
app.use('/api/admin', adminRouter);

app.use('/news', newsRouter);
app.use('/llm', llmRouter);
app.use('/admin-api', adminRouter);

// ========================================================
// Health Check
// ========================================================
app.get(['/api', '/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Nexz API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      news: '/api/news',
      llm: '/api/llm',
      admin: '/api/admin',
    },
  });
});

// ========================================================
// Start Server & Vite Frontend Integration
// ========================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: clientRoot,
      configFile: path.resolve(clientRoot, 'vite.config.js'),
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);

    // SPA fallback: transform and serve index.html for page navigation
    app.use(async (req, res, next) => {
      if (req.method !== 'GET' || req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/news') || req.originalUrl.startsWith('/llm')) {
        return next();
      }
      try {
        const indexPath = path.resolve(clientRoot, 'index.html');
        let template = readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(clientRoot, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err, req, res, _next) => {
    console.error('[Server] Unhandled error:', err.message);
    res.status(err.status || 500).json({
      status: 'error',
      error: 'internal_server_error',
      message: err.message,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Nexz Server running on http://0.0.0.0:${PORT}`);
    console.log(`   Health check: http://0.0.0.0:${PORT}/api/health`);
    console.log(`   News API:     http://0.0.0.0:${PORT}/api/news`);
    console.log(`   LLM API:      http://0.0.0.0:${PORT}/api/llm`);
    console.log(`   Admin API:    http://0.0.0.0:${PORT}/api/admin\n`);

    // Seed default prompts to Firestore after server starts
    seedDefaultPrompts().catch((err) => {
      console.error('[Server] Failed to seed default prompts:', err.message);
    });
  });
}

startServer();

export default app;
