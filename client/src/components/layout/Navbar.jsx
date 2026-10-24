import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  TrendingUp, 
  User, 
  LogOut, 
  Shield, 
  Menu, 
  X, 
  Bookmark,
  Palette,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import BookmarksModal from '../news/BookmarksModal';
import ThemeModal from './ThemeModal';
import { getBookmarks } from '../../services/bookmarkService';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const { theme, isAutoCycling } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const searchInputRef = useRef(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [searchVal, setSearchVal] = useState('');

  // Sync bookmark count
  useEffect(() => {
    const updateCount = () => {
      setBookmarkCount(getBookmarks().length);
    };
    updateCount();
    window.addEventListener('nexz-bookmarks-updated', updateCount);
    return () => window.removeEventListener('nexz-bookmarks-updated', updateCount);
  }, []);

  // Global hotkey: press "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseMove = (e) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    navRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    navRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchVal.trim();
    if (query) {
      navigate(`/home?q=${encodeURIComponent(query)}`);
      setMobileSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <nav
        ref={navRef}
        onMouseMove={handleMouseMove}
        className="sticky top-0 z-[var(--z-index-sticky-nav)] bg-[var(--color-bg-primary)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 sm:px-6 py-3 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & Live Pill */}
          <div className="flex items-center gap-3">
            <Link 
              to={user ? "/home" : "/"} 
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[var(--color-accent)] to-[var(--color-accent-hover)] flex items-center justify-center font-black text-black font-mono shadow-sm group-hover:scale-105 transition-transform">
                N
              </div>
              <span className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)] tracking-tight font-display">
                NEXZ
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[11px] font-mono text-[var(--color-text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse" />
              <span>LIVE WIRE</span>
            </div>
          </div>

          {/* Desktop Search Bar */}
          {user && (
            <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md mx-4">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search global intelligence or topics..."
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl py-2 pl-10 pr-12 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] transition-all font-sans"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchVal ? (
                  <button
                    type="button"
                    onClick={() => setSearchVal('')}
                    className="p-1 hover:text-[var(--color-text-primary)] text-[var(--color-text-muted)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded">
                    /
                  </kbd>
                )}
              </div>
            </form>
          )}

          {/* Nav Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile search toggle */}
            {user && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)]"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Home Feed Link */}
            {user && (
              <Link 
                to="/home" 
                className={`p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors ${
                  location.pathname === '/home' 
                    ? 'text-[var(--color-accent)] bg-[var(--color-bg-secondary)] border border-[var(--color-border)]' 
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`} 
                aria-label="Intelligence Feed"
                title="Intelligence Feed"
              >
                <TrendingUp className="w-5 h-5" />
              </Link>
            )}

            {/* Bookmarks Trigger */}
            <button
              onClick={() => setBookmarksOpen(true)}
              className="relative p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] cursor-pointer"
              aria-label="Saved Articles"
              title="Saved Articles"
            >
              <Bookmark className="w-5 h-5" />
              {bookmarkCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] text-[9px] font-bold font-mono flex items-center justify-center">
                  {bookmarkCount > 9 ? '9+' : bookmarkCount}
                </span>
              )}
            </button>

            {/* Theme & Appearance Customizer Trigger */}
            <button
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className="relative p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] cursor-pointer group"
              aria-label="Theme & Appearance Customizer"
              title={`Appearance Theme: ${theme.name} (Click to customize)`}
            >
              <Palette className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span 
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm"
                style={{ backgroundColor: theme.accent }}
              />
              {isAutoCycling && (
                <span className="absolute -bottom-0.5 right-0.5 text-[8px] text-[var(--color-accent)]">
                  <RotateCw className="w-2.5 h-2.5 animate-spin" />
                </span>
              )}
            </button>

            {/* Desktop user menu */}
            {user ? (
              <div className="relative group hidden sm:block">
                <button 
                  className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)] transition-all text-xs font-mono text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer" 
                  aria-label="User menu"
                >
                  <User className="w-4 h-4 text-[var(--color-accent)]" />
                  <span className="truncate max-w-[120px]">
                    {user.displayName || (user.email ? user.email.split('@')[0] : 'Operative')}
                  </span>
                </button>
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 flex flex-col py-2 z-50">
                  <div className="px-4 py-2 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] truncate font-mono">
                    {user.email || 'Operative Node'}
                  </div>
                  {userData?.isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)] hover:text-[var(--color-accent)] transition-colors">
                      <Shield className="w-4 h-4" /> Admin Console
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-bg-card-hover)] w-full text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="btn-primary text-xs py-2 px-4 hidden sm:inline-flex rounded-xl"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar dropdown */}
        <AnimatePresence>
          {mobileSearchOpen && user && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden"
            >
              <form onSubmit={handleSearch} className="pt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => setSearchVal(e.target.value)}
                    placeholder="Search news..."
                    autoFocus
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Bookmarks Modal Drawer */}
      <BookmarksModal 
        isOpen={bookmarksOpen} 
        onClose={() => setBookmarksOpen(false)} 
      />

      {/* Theme & Appearance Modal */}
      <ThemeModal 
        isOpen={themeModalOpen} 
        onClose={() => setThemeModalOpen(false)} 
      />

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-index-modal)] sm:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 z-[calc(var(--z-index-modal)+1)] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border)] flex flex-col p-6 sm:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-[var(--color-accent)] flex items-center justify-center font-bold text-black font-mono text-sm">
                    N
                  </div>
                  <span className="font-serif font-bold text-lg text-[var(--color-text-primary)]">
                    NEXZ
                  </span>
                </div>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="text-xs text-[var(--color-text-muted)] mb-6 truncate border-b border-[var(--color-border)] pb-3 font-mono">
                  {user.email || 'Operative Node'}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link 
                  to="/home" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-card)] text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                >
                  <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" /> 
                  Intelligence Feed
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setBookmarksOpen(true);
                  }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--color-bg-card)] text-sm font-medium text-[var(--color-text-primary)] transition-colors text-left"
                >
                  <span className="flex items-center gap-3">
                    <Bookmark className="w-5 h-5 text-[var(--color-accent)]" /> 
                    Saved Stories
                  </span>
                  {bookmarkCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-accent)]">
                      {bookmarkCount}
                    </span>
                  )}
                </button>

                <button 
                  onClick={() => { setMobileMenuOpen(false); setThemeModalOpen(true); }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--color-bg-card)] text-sm font-medium text-[var(--color-text-primary)] transition-colors text-left w-full cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Palette className="w-5 h-5 text-[var(--color-accent)]" /> 
                    Appearance & Themes
                  </span>
                  <span className="w-3 h-3 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: theme.accent }} />
                </button>

                {userData?.isAdmin && (
                  <Link 
                    to="/admin" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-card)] text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                  >
                    <Shield className="w-5 h-5 text-[var(--color-accent)]" /> 
                    Admin Console
                  </Link>
                )}
              </div>

              <div className="mt-auto pt-6 border-t border-[var(--color-border)]">
                {user ? (
                  <button 
                    onClick={handleLogout} 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-card)] transition-colors text-[var(--color-error)] text-sm w-full font-medium"
                  >
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                ) : (
                  <Link 
                    to="/auth" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className="btn-primary w-full text-center py-3 block rounded-xl text-sm font-semibold"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
