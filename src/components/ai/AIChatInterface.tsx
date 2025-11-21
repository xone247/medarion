import React, { useState, useRef, useEffect } from 'react';
import { askMedarion } from '../../services/ai';
import { Bot, Send, Loader2, Trash2, X, Copy, Download, Lightbulb } from 'lucide-react';
import ConfirmModal from '../ui/ConfirmModal';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatInterfaceProps {
  onClose?: () => void;
  toolName?: string;
  toolDescription?: string;
  useCases?: string[];
  examples?: Array<{ input: string; output: string }>;
}

const AIChatInterface: React.FC<AIChatInterfaceProps> = ({ 
  onClose, 
  toolName = 'Medarion AI Assistant',
  toolDescription = 'General-purpose AI assistant for healthcare industry questions, market analysis, and strategic insights.',
  useCases = [
    'Market research',
    'Industry insights',
    'Strategic planning'
  ],
  examples = [
    {
      input: 'What are the key challenges for telemedicine in Nigeria?',
      output: 'Key Challenges: 1. Regulatory complexity (NAFDAC requirements) 2. Infrastructure gaps (internet connectivity) 3. Digital literacy barriers 4. Payment system limitations 5. Competition from established players'
    }
  ]
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await askMedarion(userMessage.content);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.answer || 'No response received',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to get AI response';
      setError(errorMsg);
      
      // Check if it's a connection error
      let userFriendlyError = 'Failed to get AI response. Please try again.';
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        userFriendlyError = 'Unable to connect to AI service. Please make sure the backend server is running.';
      } else if (errorMsg.includes('timeout') || errorMsg.includes('AbortError')) {
        userFriendlyError = 'Request timed out. The AI service may be busy. Please try again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: userFriendlyError,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearChat = () => {
    setMessages([]);
    setError(null);
    setShowClearConfirm(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadChat = () => {
    const chatText = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'AI'}: ${msg.content}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medarion-ai-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden" style={{ height: '100%', display: 'flex', flexDirection: 'column', margin: 0, padding: 0 }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-teal)] flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" style={{ color: 'white' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{toolName}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">{toolDescription}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  onClick={downloadChat}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                  title="Download chat"
                >
                  <Download className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-[var(--color-primary-teal)]" />
                </button>
                <button
                  onClick={handleClearChat}
                  className="p-2 rounded-lg hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors group"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-red-500" />
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900" style={{ scrollBehavior: 'smooth', minHeight: 0, flex: '1 1 auto', overflowY: 'auto' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col justify-start">
            {/* Welcome Section */}
            <div className="flex flex-col items-center justify-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary-teal)]/10 dark:bg-[var(--color-primary-teal)]/20 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-[var(--color-primary-teal)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Start a conversation
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mb-4">
                Ask me anything about African healthcare markets, investment opportunities, regulatory requirements, or strategic insights.
              </p>
            </div>

            {/* Use Cases Section */}
            {useCases && useCases.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-4 w-4 text-[var(--color-primary-teal)]" />
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">Use Cases</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {useCases.map((useCase, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const example = examples && examples.length > 0 ? examples[0].input : '';
                        if (example) {
                          setInput(example);
                          inputRef.current?.focus();
                        }
                      }}
                      className="p-2 rounded-md bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors text-xs text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                    >
                      {useCase}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-teal)] flex items-center justify-center flex-shrink-0 shadow-md">
                  <Bot className="h-5 w-5 text-white" style={{ color: 'white' }} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl p-4 relative ${
                  message.role === 'user'
                    ? 'bg-[var(--color-primary-teal)] text-white shadow-md'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-md border border-gray-200 dark:border-gray-600'
                }`}
                style={{
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {/* Modern chat bubble tail */}
                {message.role === 'assistant' && (
                  <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-white dark:border-r-gray-800 border-b-8 border-b-transparent"></div>
                )}
                {message.role === 'user' && (
                  <div className="absolute -right-2 bottom-4 w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-[var(--color-primary-teal)] border-b-8 border-b-transparent"></div>
                )}
                
                <div 
                  className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${
                    message.role === 'user' ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                  }`}
                  style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                    maxWidth: '100%',
                    color: message.role === 'user' ? 'white' : undefined
                  }}
                >
                  {message.content}
                </div>
                <div className={`flex items-center justify-between mt-3 pt-2 border-t ${
                  message.role === 'user' ? 'border-white/20' : 'border-gray-200 dark:border-gray-600'
                }`}>
                  <div className={`text-xs ${
                    message.role === 'user' ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="text-xs text-[var(--color-primary-teal)] hover:text-[var(--color-primary-teal)]/80 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  )}
                </div>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-teal)]/10 dark:bg-[var(--color-primary-teal)]/20 flex items-center justify-center flex-shrink-0 border-2 border-[var(--color-primary-teal)]/30">
                  <span className="text-sm font-bold text-[var(--color-primary-teal)]">You</span>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 justify-start items-end">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-teal)] flex items-center justify-center flex-shrink-0 shadow-md">
              <Bot className="h-5 w-5 text-white" style={{ color: 'white' }} />
            </div>
            <div className="bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-600 p-4 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--color-primary-teal)]" />
                <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pt-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-3 mb-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything about African healthcare markets..."
            rows={1}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-teal)]/20 focus:border-[var(--color-primary-teal)] focus:bg-white dark:focus:bg-gray-700 transition-all resize-none shadow-sm"
            style={{ minHeight: '52px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-6 py-3 rounded-xl bg-[var(--color-primary-teal)] text-white font-semibold hover:bg-[var(--color-primary-teal)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-0 ml-1" style={{ marginTop: '4px' }}>
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

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

export default AIChatInterface;

