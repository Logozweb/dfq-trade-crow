import React from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, Package, ArrowLeftRight, MessageSquare, AlertCircle, Check } from 'lucide-react';

export default function NotificationCenterModal({
  notifications = [],
  unreadCount = 0,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNavigate
}) {
  const getIcon = (type) => {
    switch (type) {
      case 'kyc':
        return <ShieldCheck className="w-4 h-4 text-sky-500" />;
      case 'listing':
        return <Package className="w-4 h-4 text-emerald-500" />;
      case 'swap':
        return <ArrowLeftRight className="w-4 h-4 text-purple-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 mt-14"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Bell className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                Notifications
              </h3>
              <p className="text-[11px] text-slate-400 mb-0">
                {unreadCount > 0 ? `${unreadCount} unread platform updates` : 'All caught up'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline border-0 bg-transparent cursor-pointer px-2 py-1"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2 opacity-60" />
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">No Notifications</div>
              <p className="text-[11px] text-slate-400 mt-1 mb-0">
                Updates regarding your listings, KYC status, and barter offers will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                  n.is_read === 0
                    ? 'bg-sky-50/50 dark:bg-sky-950/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
                onClick={() => {
                  onMarkRead(n.id);
                  if (n.link && onNavigate) onNavigate(n.link);
                }}
              >
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shrink-0 shadow-xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h4>
                    {n.is_read === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mb-1 leading-relaxed">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
