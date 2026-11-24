import React from 'react';
import { X, MapPin, Star, BadgeCheck, MessageSquare, ArrowLeftRight, ShieldCheck, QrCode } from 'lucide-react';

export default function ItemDetailModal({ item, onClose, onOpenChat, onOpenSwap }) {
  if (!item) return null;

  const isReceipt = Boolean(item.receipt_path);
  const formatNaira = (val) => '₦' + Number(val || 0).toLocaleString('en-NG');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
        style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}
      >
        {/* Left: Image Area */}
        <div className="md:w-1/2 bg-slate-100 dark:bg-slate-800 relative h-64 md:h-auto min-h-[260px]">
          <img
            src={item.image_path}
            alt={item.title}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = 'assets/img/couch.svg'; }}
          />
          <span
            className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded shadow-sm border uppercase"
            style={{
              backgroundColor: item.mode === 'Barter Only' ? 'var(--dfq-primary-light)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple-bg)' : 'var(--dfq-amber-bg)',
              borderColor: item.mode === 'Barter Only' ? 'var(--dfq-primary-border)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple-border)' : 'var(--dfq-amber-border)',
              color: item.mode === 'Barter Only' ? 'var(--dfq-primary)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple)' : 'var(--dfq-amber)'
            }}
          >
            {item.mode}
          </span>
          {isReceipt && (
            <span className="absolute bottom-3 left-3 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-1 shadow-sm">
              <BadgeCheck className="w-3.5 h-3.5" />
              Receipt Verified
            </span>
          )}
        </div>

        {/* Right: Details & Action */}
        <div className="md:w-1/2 p-5 flex flex-col overflow-y-auto">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-medium text-slate-400 block mb-1">{item.category} &bull; {item.item_condition}</span>
              <h2 className="text-lg font-bold tracking-tight" style={{ color: 'var(--dfq-text)' }}>
                {item.title}
              </h2>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Location & Trader */}
          <div className="flex items-center gap-3 text-xs mb-3 text-slate-500 pb-2 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.location}</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{item.owner_rating || '5.0'}</span>
            </span>
          </div>

          {/* Wanted Box */}
          <div className="p-3 rounded-lg border mb-3 text-xs" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-1" style={{ color: 'var(--dfq-text-muted)' }}>
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Owner Wants in Return</span>
            </div>
            <div className="font-semibold" style={{ color: 'var(--dfq-text)' }}>
              {item.wanted}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 flex-1">
            {item.description}
          </p>

          {/* Serial / Anti-theft info */}
          <div className="text-xs space-y-1 mb-4 pt-2 border-t" style={{ borderColor: 'var(--dfq-border)' }}>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Value:</span>
              <strong style={{ color: 'var(--dfq-text)' }}>{formatNaira(item.est_value)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Serial / IMEI:</span>
              <span className="font-mono text-slate-600 dark:text-slate-300">{item.serial_imei || 'Not provided'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t" style={{ borderColor: 'var(--dfq-border)' }}>
            <button
              onClick={() => {
                onClose();
                onOpenChat(item);
              }}
              className="py-2 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              style={{ borderColor: 'var(--dfq-border)', color: 'var(--dfq-text)' }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              <span>Inquire</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenSwap(item);
              }}
              className="py-2 px-3 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all"
              style={{ backgroundColor: 'var(--dfq-primary)' }}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Propose Swap</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
