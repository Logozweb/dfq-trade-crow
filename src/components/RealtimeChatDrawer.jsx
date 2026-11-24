import React, { useState, useEffect, useRef } from 'react';
import {
  X, Send, ShieldAlert, Sparkles, User, Check, CheckCheck, RefreshCw,
  ArrowLeft, MessageSquare, Search, ChevronRight, Package, Clock
} from 'lucide-react';

export default function RealtimeChatDrawer({
  item: initialItem,
  otherUser: initialOtherUser,
  currentUser,
  onClose,
  onOpenAuth,
  onMessagesRead
}) {
  // If an item or specific user was passed, start in thread view; otherwise start in conversations list
  const [activeThread, setActiveThread] = useState(
    initialItem && initialItem.id !== 101
      ? { item: initialItem, otherUser: initialOtherUser }
      : null
  );

  // Conversations list state
  const [conversations, setConversations] = useState([]);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [convoSearch, setConvoSearch] = useState('');

  // Messages in active thread
  const [messages, setMessages] = useState([]);
  const [activeItem, setActiveItem] = useState(initialItem || null);
  const [activePartner, setActivePartner] = useState(initialOtherUser || null);
  const [inputMsg, setInputMsg] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch all user conversations
  const fetchConversations = async () => {
    if (!currentUser) return;
    setLoadingConvos(true);
    try {
      const res = await fetch('/api/messages/conversations');
      const data = await res.json();
      setLoadingConvos(false);
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        // If we opened with no activeThread, and user has conversations, but initialItem was dummy 101:
        if (!activeThread && (!initialItem || initialItem.id === 101) && data.conversations.length > 0) {
          // If there's an unread conversation, or pick the first conversation
          const unreadConvo = data.conversations.find(c => c.unread_count > 0);
          if (unreadConvo) {
            handleSelectConversation(unreadConvo);
          }
        }
      }
    } catch (_) {
      setLoadingConvos(false);
    }
  };

  // Fetch thread messages for activeThread
  const fetchThreadMessages = async () => {
    if (!activeThread?.item?.id || !currentUser) return;
    try {
      const itemId = activeThread.item.id;
      const otherId = activeThread.otherUser?.id || (currentUser.id === activeThread.item.user_id ? 0 : activeThread.item.user_id);
      const res = await fetch(`/api/messages/thread?item_id=${itemId}&other_user_id=${otherId}`);
      if (res.status === 401) {
        setLoadingMessages(false);
        setError('Please log in to chat with the owner.');
        return;
      }
      const data = await res.json();
      setLoadingMessages(false);
      if (data.success) {
        if (data.messages) setMessages(data.messages);
        if (data.item) setActiveItem(data.item);
        if (data.otherUser) setActivePartner(data.otherUser);
        onMessagesRead && onMessagesRead();
      }
    } catch (_) {
      setLoadingMessages(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, [currentUser?.id]);

  // When activeThread changes, fetch messages and poll
  useEffect(() => {
    if (activeThread?.item?.id) {
      setLoadingMessages(true);
      fetchThreadMessages();
      const interval = setInterval(fetchThreadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [activeThread?.item?.id, activeThread?.otherUser?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (convo) => {
    setActiveThread({
      item: {
        id: convo.item_id,
        title: convo.item_title,
        image_path: convo.item_image,
        mode: convo.item_mode,
        user_id: convo.partner_id // fallback
      },
      otherUser: {
        id: convo.partner_id,
        full_name: convo.partner_name
      }
    });
    setActivePartner({
      id: convo.partner_id,
      full_name: convo.partner_name
    });
  };

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputMsg).trim();
    if (!text || !activeThread?.item?.id) return;

    if (!currentUser) {
      onOpenAuth && onOpenAuth();
      return;
    }

    setSending(true);
    setError('');

    const recipientId = activePartner?.id || activeThread.otherUser?.id || (currentUser.id === activeItem?.user_id ? 0 : activeItem?.user_id);

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: activeThread.item.id,
          recipient_id: recipientId,
          message: text
        })
      });
      const data = await res.json();
      setSending(false);
      if (data.success) {
        setInputMsg('');
        fetchThreadMessages();
        fetchConversations();
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

  const filteredConvos = conversations.filter(c => {
    if (!convoSearch.trim()) return true;
    const q = convoSearch.toLowerCase();
    return (
      (c.partner_name && c.partner_name.toLowerCase().includes(q)) ||
      (c.item_title && c.item_title.toLowerCase().includes(q)) ||
      (c.last_message && c.last_message.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-200">
      
      {/* 1. TOP HEADER */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
        <div className="flex items-center gap-2.5 min-w-0">
          {activeThread ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActiveThread(null);
                  fetchConversations();
                }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer transition-colors"
                title="Back to all conversations"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center font-bold text-sky-700 dark:text-sky-300 text-xs shrink-0">
                {(activePartner?.full_name || activeThread.otherUser?.full_name || 'T').charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate m-0">
                  {activePartner?.full_name || activeThread.otherUser?.full_name || 'Trader'}
                </h3>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 m-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Active Channel</span>
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white m-0">
                  Conversations &amp; Inquiries
                </h3>
                <p className="text-[11px] text-slate-400 m-0">
                  {conversations.length} active trader {conversations.length === 1 ? 'chat' : 'chats'}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BODY: CONVERSATION LIST VIEW OR ACTIVE CHAT VIEW */}
      {!activeThread ? (
        /* CONVERSATIONS LIST */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={convoSearch}
                onChange={e => setConvoSearch(e.target.value)}
                placeholder="Search conversations by trader or item..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {loadingConvos ? (
              <div className="p-10 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                <span>Loading conversations...</span>
              </div>
            ) : filteredConvos.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-400">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-50" />
                <div className="font-semibold text-slate-700 dark:text-slate-300">No Conversations Yet</div>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  When you or prospective traders inquire about marketplace items, your message threads will be listed here.
                </p>
              </div>
            ) : (
              filteredConvos.map((c) => (
                <div
                  key={`${c.item_id}_${c.partner_id}`}
                  onClick={() => handleSelectConversation(c)}
                  className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    c.unread_count > 0
                      ? 'bg-sky-50/60 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Thumbnail / Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={c.item_image || 'assets/img/phone.svg'}
                      alt=""
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                      onError={e => { e.currentTarget.src = 'assets/img/phone.svg'; }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-sky-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {(c.partner_name || 'T').charAt(0)}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate m-0">
                        {c.partner_name}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    <div className="text-[11px] font-medium text-sky-700 dark:text-sky-300 truncate mb-0.5">
                      {c.item_title}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate m-0">
                        {c.last_message}
                      </p>
                      {c.unread_count > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-sky-500 text-white text-[9px] font-bold shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ACTIVE CHAT THREAD */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Item Context Ribbon */}
          {activeItem && (
            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border-b border-sky-100 dark:border-sky-900/40 flex items-center gap-3">
              <img
                src={activeItem.image_path || 'assets/img/phone.svg'}
                alt={activeItem.title}
                className="w-10 h-10 rounded-lg object-cover bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                onError={(e) => { e.currentTarget.src = 'assets/img/phone.svg'; }}
              />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white truncate">{activeItem.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Valuation: <strong className="text-sky-600 dark:text-sky-400">₦{Number(activeItem.est_value || 0).toLocaleString()}</strong> &bull; {activeItem.mode}
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
            {loadingMessages ? (
              <div className="p-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-500" />
                <span>Loading message history...</span>
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
                  Ask about item condition, swap preferences, or proposed cash adjustments.
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
      )}
    </div>
  );
}
