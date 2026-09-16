import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { readFileSync, existsSync } from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';

// Route imports
import newsRouter from './routes/news.js';
import llmRouter, { seedDefaultPrompts } from './routes/llm.js';
import adminRouter from './routes/admin.js';

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
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
];
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser with 10mb limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ========================================================
// Route Mounting
// ========================================================
app.use('/api/news', newsRouter);
app.use('/api/llm', llmRouter);
app.use('/api/admin', adminRouter);

// ========================================================
// Health Check
// ========================================================
app.get('/', (req, res) => {
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
// Global Error Handler
// ========================================================
app.use((err, req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    status: 'error',
    error: 'internal_server_error',
    message: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message,
  });
});

// ========================================================
// Start Server
// ========================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Nexz API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/`);
  console.log(`   News API:     http://localhost:${PORT}/api/news`);
  console.log(`   LLM API:      http://localhost:${PORT}/api/llm`);
  console.log(`   Admin API:    http://localhost:${PORT}/api/admin\n`);

  // Seed default prompts to Firestore after server starts
  seedDefaultPrompts().catch((err) => {
    console.error('[Server] Failed to seed default prompts:', err.message);
  });
});

export default app;
