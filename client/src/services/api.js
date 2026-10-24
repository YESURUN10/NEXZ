import axios from 'axios';
import { auth } from './firebase';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  // If empty or pointing to a non-accessible localhost port, use relative '/api'
  if (!envUrl || envUrl.includes('localhost:') || envUrl.includes('127.0.0.1:')) {
    return '/api';
  }
  return envUrl;
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 30000,
});

// Attach Firebase token to every request
api.interceptors.request.use(async (config) => {
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Token fetch failed — let the request proceed without auth
  }
  return config;
});

// Response interceptor for quota warnings
api.interceptors.response.use(
  (response) => {
    if (response.headers['x-quota-warning']) {
      window.dispatchEvent(new CustomEvent('quota-warning'));
    }
    if (response.headers['x-quota-exhausted']) {
      window.dispatchEvent(new CustomEvent('quota-exhausted'));
    }
    return response;
  },
  (error) => {
    if (error.response?.data?.error === 'quota_exceeded') {
      window.dispatchEvent(new CustomEvent('quota-exhausted'));
    }
    return Promise.reject(error);
  }
);

// ── News API ──────────────────────────────────────────
export const fetchTopNews = (params) =>
  api.get('/news/top', { params }).then((r) => r.data);

export const searchNews = (params) =>
  api.get('/news/search', { params }).then((r) => r.data);

export const resolveArticle = (hash) =>
  api.get(`/news/resolve/${hash}`).then((r) => r.data);

export const getCorroboration = (headline) =>
  api.post('/news/corroboration', { headline }).then((r) => r.data);

// ── LLM API ───────────────────────────────────────────
export const chatWithArticle = (articleText, question, config = {}) =>
  api.post('/llm/chat', { articleText, question }, { timeout: 60000, ...config }).then((r) => r.data);

export const getExplanation = (articleText, level, config = {}) =>
  api.post('/llm/explain', { articleText, level }, { timeout: 60000, ...config }).then((r) => r.data);

// ── Admin API ─────────────────────────────────────────
// These return the full response shape from the server
// e.g. { status: 'ok', usage: [...], limits: {...} }
export const getAdminUsage = () =>
  api.get('/admin/usage').then((r) => r.data);

export const getAdminLogs = (params) =>
  api.get('/admin/logs', { params }).then((r) => r.data);

export const getAdminPrompts = () =>
  api.get('/admin/prompts').then((r) => r.data);

// FIX: Server expects { text } not { prompt }
export const updateAdminPrompt = (feature, text) =>
  api.put(`/admin/prompts/${feature}`, { text }).then((r) => r.data);

export default api;
