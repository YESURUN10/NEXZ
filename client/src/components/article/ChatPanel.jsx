import React, { useState, useRef, useEffect } from 'react';
import { chatWithArticle } from '../../services/api';
import { Send, X, Zap, RefreshCw, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '../../contexts/ChatContext';

const ChatOrb = React.lazy(() => import('../layout/ChatOrb'));

export default function ChatPanel() {
  const { articleContext: articleText } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: articleText 
        ? "Nexz Neural Link Active. What would you like to analyze regarding this intelligence dispatch?" 
        : "Nexz Neural Link Active. Query me on breaking dispatches, macro causal flows, or market reactions." 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([{ 
        role: 'assistant', 
        content: articleText 
          ? "Nexz Neural Link Active. What would you like to analyze regarding this intelligence dispatch?" 
          : "Nexz Neural Link Active. Query me on breaking dispatches, macro causal flows, or market reactions." 
      }]);
    }
  }, [articleText, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  const executeChat = async (userPrompt) => {
    setLoading(true);
    try {
      const res = await chatWithArticle(articleText, userPrompt);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      console.error('[AI Chat] Request failed:', err);
      let category = 'Server Error';
      let message = 'The AI service could not complete the request.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        category = 'Network Timeout';
        message = 'The AI request timed out. Please retry.';
      } else if (err.response?.data?.category) {
        category = err.response.data.category;
        message = err.response.data.message || message;
      } else if (err.response?.status === 429) {
        category = 'Quota Exceeded';
        message = err.response.data?.message || 'Daily AI rate limit reached. Please try again later.';
      } else if (err.response?.status === 401) {
        category = 'Authentication Error';
        message = err.response.data?.message || 'Authentication required. Please sign in.';
      } else if (err.response?.status === 503) {
        category = 'Provider Unavailable';
        message = 'The AI provider is experiencing high demand. Please try again shortly.';
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      }

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          isError: true,
          category,
          message,
          originalPrompt: userPrompt,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    await executeChat(userMsg);
  };

  const handleRetry = async (errorIndex) => {
    const errorMsg = messages[errorIndex];
    const originalPrompt = errorMsg?.originalPrompt || messages[errorIndex - 1]?.content;
    // Remove the error message
    setMessages(prev => prev.filter((_, idx) => idx !== errorIndex));
    if (originalPrompt) {
      await executeChat(originalPrompt);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[var(--z-index-floating)] bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] font-mono text-xs font-semibold flex items-center gap-3 shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.6)] rounded-full pl-3 pr-6 py-2.5 transition-all border border-purple-400/40 cursor-pointer"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center overflow-hidden">
          <React.Suspense fallback={<Zap className="w-4 h-4 text-white animate-pulse" />}>
            <ChatOrb className="w-full h-full" />
          </React.Suspense>
        </div>
        <span className="tracking-wider">AI INTELLIGENCE</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-index-floating)] md:hidden"
            />

            {/* Chat panel container */}
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed md:bottom-6 md:right-6 bottom-0 right-0 z-[var(--z-index-modal)] w-full md:w-[420px] h-[80vh] md:h-[560px] max-h-[90vh] glass md:rounded-2xl rounded-t-2xl rounded-b-none shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 backdrop-blur-2xl"
            >
              {/* ===== HEADER ===== */}
              <div className="bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] px-5 py-3.5 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-500/40 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-[var(--color-energy-purple)] animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold text-[var(--color-text-primary)] tracking-wider flex items-center gap-2">
                      <span>NEXZ AI TERMINAL</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-ping" />
                    </div>
                    <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {articleText ? 'DISPATCH CONTEXT ATTACHED' : 'SYNCHRONIZED GLOBAL STREAM'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  aria-label="Close chat"
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-bg-card)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ===== MESSAGES ===== */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 font-sans text-sm">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.isError ? (
                      /* Failure State */
                      <div className="w-full max-w-[92%] p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-left shadow-lg">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-red-300">
                          <Radio className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                          <span>INTELLIGENCE LINK INTERRUPTED</span>
                        </div>
                        <p className="text-xs text-red-200 mt-1 leading-relaxed font-sans">
                          {msg.message || 'The AI service could not complete the request.'}
                        </p>
                        {msg.category && (
                          <div className="text-[10px] font-mono text-red-400/80 mt-1.5 uppercase">
                            Signal Category: {msg.category}
                          </div>
                        )}
                        <button
                          onClick={() => handleRetry(i)}
                          className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>RETRY</span>
                        </button>
                      </div>
                    ) : (
                      /* Standard Message Bubble */
                      <div className={`max-w-[88%] rounded-2xl p-4 leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-[var(--color-accent)] text-white font-medium rounded-tr-sm shadow-md' 
                          : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-tl-sm shadow-sm'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="chat-markdown text-sm leading-relaxed max-w-none prose prose-invert">
                            <ReactMarkdown>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State: ANALYZING SIGNALS... */}
                {loading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-[var(--color-bg-primary)] border border-purple-500/40 rounded-2xl rounded-tl-sm p-4 shadow-md flex items-center gap-3 w-full max-w-[85%]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--color-accent)] animate-ping" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono font-semibold tracking-wider text-[var(--color-energy-purple)] flex items-center gap-2">
                          <span>ANALYZING SIGNALS...</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        </div>
                        <div className="w-full bg-[var(--color-bg-secondary)] h-1 rounded-full mt-2 overflow-hidden relative">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-purple-600 via-cyan-400 to-purple-600 rounded-full"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                            style={{ width: '60%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ===== INPUT ===== */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-primary)] shrink-0 flex items-center">
                <div className="flex items-center gap-2.5 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl pl-4 pr-1.5 py-1.5 focus-within:border-[var(--color-accent)] transition-colors">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={articleText ? "Query dispatch intelligence..." : "Query global neural feed..."} 
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none disabled:opacity-50 min-w-0"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    aria-label="Send query"
                    className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--color-accent)] text-white disabled:opacity-40 disabled:bg-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-accent-hover)] transition-all cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
