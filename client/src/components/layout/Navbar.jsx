import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, TrendingUp, User, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const navRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleMouseMove = (e) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    navRef.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    navRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.search.value.trim();
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
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        ref={navRef}
        onMouseMove={handleMouseMove}
        className="sticky top-0 z-[var(--z-index-sticky-nav)] glass border-b border-[var(--color-border)] px-4 sm:px-6 py-3 signal-line-top"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to={user ? "/home" : "/"} className="text-2xl font-black text-[var(--color-text-primary)] tracking-wider font-serif">
            NEXZ
          </Link>

          {/* Desktop search */}
          {user && (
            <form onSubmit={handleSearch} className="hidden md:flex relative flex-1 max-w-md mx-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                name="search"
                type="text"
                placeholder="Search topics, keywords..."
                className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
              />
            </form>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile search toggle */}
            {user && (
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="md:hidden p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)]"
                aria-label="Toggle search"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            <Link to="/home" className="hidden sm:block p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" aria-label="Home">
              <TrendingUp className="w-5 h-5" />
            </Link>


            {/* Desktop user menu */}
            {user ? (
              <div className="relative group hidden sm:block">
                <button className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]" aria-label="User menu">
                  <User className="w-5 h-5" />
                </button>
                <div className="absolute right-0 mt-2 w-48 rounded-xl glass border border-[var(--color-border)] shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top-right scale-95 group-hover:scale-100 flex flex-col py-2">
                  <div className="px-4 py-2 border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] truncate">
                    {user.email}
                  </div>
                  {userData?.isAdmin && (
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-accent)] transition-colors">
                      <Shield className="w-4 h-4" /> Admin Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-error)] hover:bg-[var(--color-bg-secondary)] w-full text-left transition-colors">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/auth" className="btn-primary text-sm py-2 px-4 hidden sm:block">
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 rounded-full hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-text-secondary)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                  <input
                    name="search"
                    type="text"
                    placeholder="Search topics, keywords..."
                    autoFocus
                    className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-72 z-50 glass border-l border-[var(--color-border)] flex flex-col p-6 sm:hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-bold gradient-text">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {user && (
                <div className="text-sm text-[var(--color-text-muted)] mb-6 truncate border-b border-[var(--color-border)] pb-4">
                  {user.email}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Link to="/home" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                  <TrendingUp className="w-5 h-5 text-[var(--color-accent)]" /> Home
                </Link>
                {userData?.isAdmin && (
                  <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors">
                    <Shield className="w-5 h-5 text-[var(--color-accent)]" /> Admin Dashboard
                  </Link>
                )}
              </div>

              <div className="mt-auto">
                {user ? (
                  <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors text-[var(--color-error)] w-full">
                    <LogOut className="w-5 h-5" /> Sign Out
                  </button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="btn-primary w-full text-center py-3 block rounded-xl">
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
