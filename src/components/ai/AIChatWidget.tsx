import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Trash2, Copy } from 'lucide-react';
import { askMedarion } from '../../services/ai';
import ConfirmModal from '../ui/ConfirmModal';
import { useTheme } from '../../contexts/ThemeContext';

const AIChatWidget: React.FC = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    setHistory(prev => [...prev, { role: 'user', text: q }]);
    setQuery('');
    setLoading(true);
    try {
      const res = await askMedarion(q);
      setHistory(prev => [...prev, { role: 'assistant', text: res.answer || 'No answer' }]);
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', text: 'There was an error processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (history.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setHistory([]);
    setShowClearConfirm(false);
    inputRef.current?.focus();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000]">
      {open && (
        <div className="mb-3 w-[20rem] sm:w-[24rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '70vh', height: '500px' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-[var(--color-text-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">Medarion AI</span>
            </div>
            <div className="flex items-center gap-1">
              {history.length > 0 && (
                <>
                  <button
                    onClick={handleClearChat}
                    className="p-1.5 hover:bg-red-500/10 rounded transition-colors"
                    title="Clear chat"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300 hover:text-red-500" />
                  </button>
                </>
              )}
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <X className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {history.length === 0 && (
              <div className="text-xs text-gray-600 dark:text-gray-400 py-4">
                Ask about companies, investors, deals, regulations, or market signals. Example: "Summarize Kenya digital health trends in 2024."
              </div>
            )}
            {history.map((m, idx) => (
              <div key={idx} className={`${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] ${m.role === 'user' ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white') : 'bg-[var(--color-background-surface)] text-[var(--color-text-primary)]'}`} style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(m.text)}
                      className="mt-1 text-xs text-[var(--color-text-primary)] hover:opacity-80 flex items-center gap-1"
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-700 text-gray-500">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-2 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? handleAsk() : undefined}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--color-background-default)] border border-[var(--color-divider-gray)] text-[var(--color-text-primary)] focus:ring-2 focus:ring-[var(--color-text-primary)] focus:border-transparent disabled:opacity-50"
            />
            <button
              onClick={handleAsk}
              disabled={!query.trim() || loading}
              className={`p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                theme === 'dark' 
                  ? 'bg-white text-black border-white/30 hover:opacity-90' 
                  : 'bg-black text-white border-black/30 hover:opacity-90'
              }`}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className={`h-12 w-12 rounded-full shadow-lg border flex items-center justify-center transition-colors ${
          theme === 'dark' 
            ? 'bg-white text-black border-white/30 hover:opacity-90' 
            : 'bg-black text-white border-black/30 hover:opacity-90'
        }`}
        title="Open Medarion AI"
      >
        <MessageSquare className="h-5 w-5" />
      </button>

      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearChat}
        title="Clear Chat History"
        message="Are you sure you want to clear all chat messages? This action cannot be undone."
        confirmText="Clear Chat"
        cancelText="Cancel"
        variant="theme"
      />
    </div>
  );
};

export default AIChatWidget; 