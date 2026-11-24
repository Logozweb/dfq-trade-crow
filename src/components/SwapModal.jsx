import React, { useState } from 'react';
import { X, ArrowLeftRight, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

export default function SwapModal({ targetItem, user, onClose, onSuccess }) {
  const [offeredItem, setOfferedItem] = useState('');
  const [cashTopup, setCashTopup] = useState('₦0 (Straight Swap)');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!targetItem) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!offeredItem.trim()) {
      setError('Please specify the item you are offering.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/offers.php?action=create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: targetItem.id,
          offered_item: offeredItem.trim(),
          cash_topup: cashTopup,
          note: note.trim()
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onSuccess && onSuccess(data.message || 'Swap proposal submitted!');
        onClose();
      } else {
        setError(data.message || 'Could not send proposal.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl p-5 overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>Structured Barter Proposal</h3>
              <p className="text-[11px] text-slate-500 mb-0">Protected by DFQ Escrow Hold &amp; Dual-OTP Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Split-screen preview box */}
        <div className="grid grid-cols-5 gap-2 p-3 rounded-xl border mb-4 items-center text-xs" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
          <div className="col-span-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Target Item</span>
            <div className="font-bold truncate" style={{ color: 'var(--dfq-text)' }}>{targetItem.title}</div>
            <div className="text-[11px] text-blue-600 truncate">{targetItem.wanted}</div>
          </div>
          <div className="col-span-1 flex justify-center text-slate-400">
            <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold block mb-0.5">Your Offer</span>
            <div className="font-bold truncate text-slate-800 dark:text-slate-200">
              {offeredItem || 'Specify below...'}
            </div>
            <div className="text-[11px] text-emerald-600 truncate">{cashTopup}</div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Offered item field */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>
              What item are you offering in exchange? *
            </label>
            <input
              type="text"
              required
              value={offeredItem}
              onChange={e => setOfferedItem(e.target.value)}
              placeholder="e.g. iPhone 14 Pro Max (256GB, Clean) + Case"
              className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
              style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
            />
          </div>

          {/* Cash Top-Up Adjustment */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>
              Cash Adjustment (Optional Top-Up)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {['₦0 (Straight Swap)', '+ ₦10,000 cash', '+ ₦25,000 cash', '+ ₦50,000 cash', '+ ₦100,000 cash'].map(opt => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setCashTopup(opt)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                    cashTopup === opt
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-transparent text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={cashTopup}
              onChange={e => setCashTopup(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
              style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
            />
          </div>

          {/* Note & Meetup Location */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>
              Meetup Hub &amp; Terms Note
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Available for inspection at Ikeja City Mall or Lekki Phase 1 on Saturday morning..."
              className="w-full px-3 py-2 text-xs border rounded-lg outline-none resize-none"
              style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
            />
          </div>

          {/* Security Notice */}
          <div className="p-2.5 rounded-lg border text-[11px] flex items-center gap-2" style={{ backgroundColor: 'var(--dfq-primary-light)', borderColor: 'var(--dfq-primary-border)', color: 'var(--dfq-primary)' }}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              Once accepted, items enter <strong>Inspection Hold</strong>. Dual-OTP ensures both parties verify physical item condition before escrow release.
            </span>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2 border-t" style={{ borderColor: 'var(--dfq-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium border text-slate-600 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--dfq-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--dfq-primary)' }}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{loading ? 'Sending...' : 'Send Trade Proposal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
