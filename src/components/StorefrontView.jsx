import React, { useState, useEffect } from 'react';
import { Store, Star, MapPin, BadgeCheck, ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';

export default function StorefrontView({ traderId = 1, onBack, onOpenChat }) {
  const [trader, setTrader] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traders/${traderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setTrader(data.trader);
          setItems(data.items || []);
          setReviews(data.reviews || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [traderId]);

  const formatNaira = (val) => '₦' + Number(val || 0).toLocaleString('en-NG');

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-xs text-slate-400">
        Loading verified trader storefront...
      </div>
    );
  }

  if (!trader) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h3 className="font-bold text-sm mb-2">Trader profile not found</h3>
        <button onClick={onBack} className="text-xs text-blue-600 font-semibold cursor-pointer border-0 bg-transparent">
          &larr; Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-4 bg-transparent border-0 cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Marketplace</span>
      </button>

      {/* Storefront Header Card */}
      <div className="p-6 rounded-2xl border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            {trader.full_name?.charAt(0) || 'T'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-bold" style={{ color: 'var(--dfq-text)' }}>{trader.full_name}</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                {Number(trader.kyc_tier) === 3 ? 'Gold Seal Pro Store' : 'Tier 2 Blue Shield'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{trader.location}</span>
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{trader.avg_rating || '5.0'}</span>
                <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
              </span>
            </div>
          </div>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300">
          <ShieldCheck className="w-4 h-4" />
          <span>Identity &amp; Phone Verified</span>
        </div>
      </div>

      {/* Trader Items */}
      <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--dfq-text)' }}>Active Storefront Listings ({items.length})</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {items.map(item => (
          <div key={item.id} className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
            <div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase border block w-fit mb-1" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
                {item.mode}
              </span>
              <h4 className="text-xs font-bold line-clamp-1 mb-1" style={{ color: 'var(--dfq-text)' }}>{item.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{item.wanted}</p>
            </div>
            <div className="pt-2 border-t flex justify-between items-center text-xs" style={{ borderColor: 'var(--dfq-border)' }}>
              <span className="font-bold" style={{ color: 'var(--dfq-text)' }}>{formatNaira(item.est_value)}</span>
              <button
                onClick={() => onOpenChat && onOpenChat(item)}
                className="px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                style={{ borderColor: 'var(--dfq-border)' }}
              >
                <MessageSquare className="w-3 h-3 text-blue-600" />
                <span>Inquire</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Verified Reviews */}
      <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--dfq-text)' }}>Verified Trader Feedback ({reviews.length})</h3>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="p-4 rounded-xl border text-xs text-slate-400" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
            No verified reviews yet.
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="p-3.5 rounded-xl border text-xs" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
              <div className="flex justify-between items-center mb-1">
                <strong style={{ color: 'var(--dfq-text)' }}>{rev.reviewer_name}</strong>
                <span className="flex text-amber-500">
                  {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-1">{rev.comment}</p>
              {rev.tags && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {rev.tags.split(',').map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 dark:bg-slate-800 text-slate-500">
                      {t.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
