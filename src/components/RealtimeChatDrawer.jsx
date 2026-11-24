import React, { useState, useEffect, useRef } from 'react';
import { X, Send, ShieldAlert, Sparkles, User, Check, CheckCheck, RefreshCw } from 'lucide-react';

export default function RealtimeChatDrawer({
  item,
  otherUser,
  currentUser,
  onClose,
  onOpenAuth
}) {
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const fetchThread = async () => {
    if (!item?.id) return;
    try {
      const otherId = otherUser?.id || (currentUser?.id === item.user_id ? 0 : item.user_id);
      const res = await fetch(`/api/messages/thread?item_id=${item.id}&other_user_id=${otherId}`);
      if (res.status === 401) {
        setLoading(false);
        setError('Please log in to chat with the owner.');
        return;
      }
      const data = await res.json();
      setLoading(false);
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (_) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
    // Realtime polling interval every 3.5 seconds
    const interval = setInterval(fetchThread, 3500);
    return () => clearInterval(interval);
  }, [item?.id, otherUser?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || !item?.id) return;

    if (!currentUser) {
      onOpenAuth && onOpenAuth();
      return;
    }

    setSending(true);
    setError('');

    const recipientId = otherUser?.id || (currentUser.id === item.user_id ? otherUser?.id : item.user_id);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          recipient_id: recipientId,
          message: text
        })
      });
      const data = await res.json();
      setSending(false);
      if (data.success) {
        setInputMsg('');
        fetchThread();
      } else {
        setError(data.message || 'Failed to send message.');
      }
    } catch (_) {
      setSending(false);
      setError('Connection error while sending.');
    }
  };

  const quickChips = [
    'Still available for trade?',
    'What is the battery health / condition?',
    'Open to public meetup at Ikeja Mall?',
    'Can we use DFQ Escrow for the cash balance?'
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-xs shrink-0">
            {(otherUser?.full_name || item?.owner_name || 'T').charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
              {otherUser?.full_name || item?.owner_name || 'Trader Chat'}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Secure Channel</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Item Context Ribbon */}
      {item && (
        <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/40 flex items-center gap-3">
          <img
            src={item.image_path}
            alt={item.title}
            className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
            onError={(e) => { e.currentTarget.src = 'assets/img/phone.svg'; }}
          />
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-white truncate">{item.title}</div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Valuation: <strong className="text-sky-600 dark:text-sky-400">₦{Number(item.est_value || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Safety Notice */}
      <div className="px-3.5 py-2 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Never pay outside DFQ Escrow. Recommended Hub: Ikeja City Mall.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
            <span>Connecting to real-time chat...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-red-600 dark:text-red-400">
            {error}
            {!currentUser && (
              <button
                type="button"
                onClick={onOpenAuth}
                className="mt-3 block mx-auto px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white border-0 cursor-pointer"
              >
                Sign In to Start Chatting
              </button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <Sparkles className="w-6 h-6 text-sky-400 mx-auto mb-2 opacity-60" />
            <div className="font-semibold text-slate-700 dark:text-slate-300">Start the Conversation</div>
            <p className="text-[11px] mt-1 text-slate-400">
              Ask about condition, swap preferences, or proposed cash adjustments.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = currentUser && Number(m.sender_id) === Number(currentUser.id);
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-bl-xs'
                  }`}
                >
                  {m.message}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5 px-1">
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMe && <CheckCheck className="w-3 h-3 text-sky-500" />}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips */}
      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 overflow-x-auto flex gap-1.5 scrollbar-none">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-sky-500 dark:hover:border-sky-500 whitespace-nowrap cursor-pointer transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={currentUser ? 'Type an inquiry or offer...' : 'Sign in to send a message...'}
            disabled={!currentUser || sending}
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!currentUser || sending || !inputMsg.trim()}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
