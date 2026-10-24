import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Route imports
import newsRouter from './routes/news.js';
import llmRouter from './routes/llm.js';
import adminRouter from './routes/admin.js';

// ========================================================
// Firebase Admin SDK Initialization (Idempotent for Serverless & Dev)
// ========================================================
export function initializeFirebase() {
  if (getApps().length > 0) {
    return;
  }

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
  console.warn('[Firebase]   Place serviceAccountKey.json in the server directory or set FIREBASE_SERVICE_ACCOUNT env var.');
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

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(err.status || 500).json({
    status: 'error',
    error: 'internal_server_error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message,
  });
});

export default app;
