import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { showToast } from '../components/layout/Toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, googleSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/home');
      } else {
        await signup(email, password);
        // AuthContext will detect new user and show PreferencesForm, then redirect happens via AuthContext check
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await googleSignIn();
      navigate('/home');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="glass p-8 rounded-xl w-full max-w-md shadow-2xl border border-[var(--color-border)] relative z-10 backdrop-blur-2xl bg-[var(--color-bg-primary)]/40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black font-serif tracking-tight mb-2">
            {isLogin ? 'Welcome Back' : 'Join Nexz'}
          </h2>
          <p className="text-[var(--color-text-muted)]">
            {isLogin ? 'Enter your details to access your feed.' : 'Create an account to personalize your news.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Email</label>
            <input 
              id="email"
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Password</label>
            <input 
              id="password"
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--color-accent)] transition-colors"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="my-6 flex items-center text-[var(--color-text-muted)] text-sm before:flex-1 before:border-t before:border-[var(--color-border)] before:mr-4 after:flex-1 after:border-t after:border-[var(--color-border)] after:ml-4">
          OR
        </div>

        <button 
          onClick={handleGoogle}
          className="w-full glass py-3 rounded-xl flex items-center justify-center gap-3 hover:bg-[var(--color-bg-card-hover)] transition-colors border border-[var(--color-border)]"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[var(--color-accent)] hover:underline font-medium"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
