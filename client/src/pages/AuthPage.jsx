import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw, Zap, Shield, ArrowLeft, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import KnowledgeNetwork from '../components/layout/KnowledgeNetwork';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const { login, signup, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const handleCopyCurrentDomain = () => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      const hostname = window.location.hostname;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(hostname);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = hostname;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/home');
      } else {
        await signup(email, password);
        navigate('/home');
      }
    } catch (err) {
      setAuthError({
        title: isLogin ? 'Sign-In Failed' : 'Registration Failed',
        message: err.message || 'Unable to authenticate with provided credentials.',
        code: err.code,
        action: 'credentials',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setAuthError(null);
    setLoading(true);
    try {
      await googleSignIn();
      navigate('/home');
    } catch (err) {
      let title = 'Authentication Failed';
      if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
        title = 'Invalid Firebase API Key';
      } else if (err.code === 'auth/unauthorized-domain') {
        title = 'Unauthorized Domain';
      } else if (err.code === 'auth/popup-blocked') {
        title = 'Popup Window Blocked';
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        title = 'Sign-In Cancelled';
      } else if (err.code === 'auth/network-request-failed') {
        title = 'Network Connection Error';
      } else if (err.code === 'auth/operation-not-allowed') {
        title = 'Google Auth Not Enabled';
      }

      setAuthError({
        title,
        message: err.message || "We couldn't establish your Google session.",
        detail: err.originalError?.message && err.originalError.message !== err.message ? err.originalError.message : null,
        code: err.code,
        action: 'google',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[var(--color-bg-primary)]">
      {/* 3D Intelligence Network Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <KnowledgeNetwork />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RETURN TO OVERVIEW</span>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[10px] font-mono text-[var(--color-energy)]">
            <Zap className="w-3 h-3 text-[var(--color-accent)] animate-pulse" />
            <span>SECURE LINK</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="glass p-8 sm:p-9 rounded-2xl shadow-2xl border border-[var(--color-border)] backdrop-blur-2xl bg-[var(--color-bg-secondary)]/80 relative overflow-hidden">
          {/* Subtle electric top line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-80" />

          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] mb-4 text-[var(--color-accent)] shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-[var(--color-text-primary)] mb-2">
              {isLogin ? 'Access Intelligence' : 'Create Operative Node'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
              {isLogin
                ? 'Authenticate your terminal to synchronize real-time intelligence.'
                : 'Register your secure credentials to tailor analytical streams.'}
            </p>
          </div>

          {/* Structured Error State Banner */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-left"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-red-200 tracking-wide font-mono">
                        {authError.title}
                      </div>
                      {authError.code && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">
                          {authError.code}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-red-300 mt-1 leading-relaxed">
                      {authError.message}
                    </div>
                    {authError.detail && authError.detail !== authError.message && (
                      <div className="text-[11px] font-mono text-red-400/80 mt-1.5 break-words">
                        {authError.detail}
                      </div>
                    )}

                    {authError.code === 'auth/unauthorized-domain' && typeof window !== 'undefined' && (
                      <div className="mt-3 p-2.5 rounded-lg bg-red-900/30 border border-red-500/30 text-xs">
                        <div className="text-[11px] font-mono text-red-300 font-medium mb-1.5">
                          Domain to add in Firebase Console:
                        </div>
                        <div className="flex items-center justify-between gap-2 p-1.5 rounded bg-black/40 border border-red-500/20 font-mono text-[11px] text-red-200 break-all">
                          <span>{window.location.hostname}</span>
                          <button
                            type="button"
                            onClick={handleCopyCurrentDomain}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/40 text-[10px] font-mono font-semibold text-red-200 shrink-0 transition-colors"
                          >
                            {copiedDomain ? (
                              <>
                                <Check className="w-3 h-3 text-green-400" />
                                <span className="text-green-300">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Domain</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="mt-2 text-[10px] text-red-300/80 leading-normal">
                          In Firebase Console → <strong>Authentication</strong> → <strong>Settings</strong> → <strong>Authorized domains</strong> → click <strong>Add domain</strong> and paste the domain above.
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={authError.action === 'google' ? handleGoogle : () => setAuthError(null)}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Try Again</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider"
              >
                Operative Email
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@nexz.io"
                disabled={loading}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all font-sans"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-mono font-medium text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider"
              >
                Key / Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all font-sans"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-xl mt-2 font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30 hover:shadow-purple-700/40"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>SYNCHRONIZING...</span>
                </>
              ) : isLogin ? (
                <span>Authenticate Terminal</span>
              ) : (
                <span>Create Operative Profile</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center text-[var(--color-text-muted)] text-xs font-mono before:flex-1 before:border-t before:border-[var(--color-border)] before:mr-4 after:flex-1 after:border-t after:border-[var(--color-border)] after:ml-4">
            FEDERATED AUTH
          </div>

          {/* Google Authentication Button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-card-hover)] transition-all border border-[var(--color-border)] hover:border-[var(--color-accent)] text-[var(--color-text-primary)] text-sm font-medium shadow-sm cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Toggle Login / Register */}
          <p className="mt-7 text-center text-xs text-[var(--color-text-muted)]">
            {isLogin ? "Need a new account? " : "Already authenticated? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setAuthError(null);
              }}
              className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-semibold transition-colors cursor-pointer"
            >
              {isLogin ? 'Register Node' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
