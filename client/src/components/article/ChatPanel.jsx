import React, { useState, useRef, useEffect } from 'react';
import { chatWithArticle } from '../../services/api';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useChatContext } from '../../contexts/ChatContext';

const ChatOrb = React.lazy(() => import('../layout/ChatOrb'));

export default function ChatPanel() {
  const { articleContext: articleText } = useChatContext();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: articleText ? 'Hi! I\'m Nexz AI. What would you like to know about this article?' : 'Hi! I\'m Nexz AI. Ask me anything about current events and news.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Update welcome message when context changes
  useEffect(() => {
    if (messages.length <= 1) {
      setMessages([{ 
        role: 'assistant', 
        content: articleText ? 'Hi! I\'m Nexz AI. What would you like to know about this article?' : 'Hi! I\'m Nexz AI. Ask me anything about current events and news.' 
      }]);
    }
  }, [articleText, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await chatWithArticle(articleText, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: res.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[var(--z-index-floating)] bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] font-semibold flex items-center gap-3 shadow-2xl rounded-full pl-3 pr-6 py-2.5 transition-all"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center overflow-hidden">
          <React.Suspense fallback={<MessageSquare className="w-5 h-5" />}>
            <ChatOrb className="w-full h-full" />
          </React.Suspense>
        </div>
        <span>Ask AI</span>
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
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[var(--z-index-floating)] md:hidden"
            />

            {/* Chat panel container */}
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed md:bottom-6 md:right-6 bottom-0 right-0 z-[var(--z-index-modal)] w-full md:w-96 h-[75vh] md:h-[500px] max-h-[85vh] glass md:rounded-2xl rounded-t-2xl rounded-b-none shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border)]"
            >
              {/* ===== HEADER ===== */}
              <div className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-5 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 font-semibold">
                  <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center overflow-hidden rounded-full">
                    <React.Suspense fallback={<Bot className="w-5 h-5 text-[var(--color-accent)]" />}>
                      <ChatOrb isTyping={loading} className="w-full h-full" />
                    </React.Suspense>
                  </div>
                  <span>Nexz AI Chat</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-[var(--color-bg-card)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ===== MESSAGES ===== */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* Message bubble */}
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)] font-medium rounded-tr-sm shadow-md' 
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-tl-sm shadow-sm'
                    }`}>
                      {/* Markdown content (assistant) or plain text (user) */}
                      {msg.role === 'assistant' ? (
                        <div className="chat-markdown text-sm leading-relaxed max-w-none">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                    {msg.isError && (
                      <button
                        onClick={() => {
                          setMessages(prev => prev.filter((_, idx) => idx !== i));
                          setInput(messages[i - 1]?.content || '');
                        }}
                        className="text-xs text-[var(--color-accent)] hover:underline mt-1 ml-2"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex justify-start w-full">
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-[var(--color-text-muted)] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* ===== INPUT ===== */}
              <form onSubmit={handleSubmit} className="px-5 py-4 border-t border-[var(--color-border)] bg-[var(--color-bg-card)] shrink-0 flex items-center">
                <div className="flex items-center gap-3 w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full pl-4 pr-2 py-1.5 focus-within:border-[var(--color-accent)] transition-colors">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={articleText ? "Ask about this article..." : "Ask about the news..."} 
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm focus:outline-none disabled:opacity-50 min-w-0"
                  />
                  <button 
                    type="submit" 
                    disabled={!input.trim() || loading}
                    className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--color-accent)] text-[var(--color-bg-primary)] disabled:opacity-50 disabled:bg-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-accent-hover)] transition-colors"
                  >
                    <Send className="w-4 h-4" />
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
