import 'dotenv/config';
import express from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import app from './app.js';
import { seedDefaultPrompts } from './routes/llm.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '../client');
const PORT = process.env.PORT || 3000;

// ========================================================
// Start Standalone Server & Vite Frontend Integration
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

// Only start listening if this file is run directly (not imported as a module)
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun || !process.env.VERCEL) {
  startServer();
}

export default app;
