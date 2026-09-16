import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import Navbar from './components/layout/Navbar';
import Toast from './components/layout/Toast';
import QuotaWarning from './components/layout/QuotaWarning';
import ErrorBoundary from './components/layout/ErrorBoundary';
import ChatPanel from './components/article/ChatPanel';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';

// Lazy-loaded routes for code splitting
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin"></div>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, userData, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (adminOnly && !userData?.isAdmin) return <Navigate to="/home" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/home" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <QuotaWarning />
      <Navbar />
      <Toast />
      <main className="flex-1 relative z-10">{children}</main>
      <ChatPanel />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <Router>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public routes - no navbar */}
                <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
                <Route path="/auth" element={<PublicOnlyRoute><AuthPage /></PublicOnlyRoute>} />

                {/* Protected routes - with navbar */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <AppLayout><HomePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/article/:hash" element={
                  <ProtectedRoute>
                    <AppLayout><ArticlePage /></AppLayout>
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AppLayout><AdminPage /></AppLayout>
                  </ProtectedRoute>
                } />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
