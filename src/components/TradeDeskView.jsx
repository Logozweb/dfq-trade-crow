import React, { useState, useEffect } from 'react';
import { Kanban, ArrowLeftRight, Clock, CheckCircle2, XCircle, ShieldCheck, Tag, Wallet, Eye } from 'lucide-react';

export default function TradeDeskView({ user, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('incoming');
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [outgoingOffers, setOutgoingOffers] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handoverOffer, setHandoverOffer] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/offers.php?action=incoming').then(r => r.json()).catch(() => ({ offers: [] })),
      fetch('/api/offers.php?action=outgoing').then(r => r.json()).catch(() => ({ offers: [] })),
      fetch('/api/items.php?action=my_items').then(r => r.json()).catch(() => ({ items: [] }))
    ]).then(([inc, out, my]) => {
      setIncomingOffers(inc.offers || []);
      setOutgoingOffers(out.offers || []);
      setMyItems(my.items || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRespond = async (offerId, decision, reason = '') => {
    try {
      const res = await fetch('/api/offers.php?action=respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId, decision, decline_reason: reason })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg(data.message || 'Updated offer status.');
        loadData();
      }
    } catch {}
  };

  const handleVerifyOtp = async () => {
    if (!handoverOffer || !otpInput.trim()) return;
    try {
      const res = await fetch('/api/offers/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: handoverOffer.id, otp: otpInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg('Dual-OTP Handover Verified! Escrow released.');
        setHandoverOffer(null);
        setOtpInput('');
        loadData();
      } else {
        alert(data.message || 'Invalid code.');
      }
    } catch {}
  };

  const handleRedeemPawn = async (itemId) => {
    if (!confirm('Settle buyback total and redeem this collateral?')) return;
    try {
      const res = await fetch('/api/pawn/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg('Collateral redeemed successfully!');
        loadData();
      }
    } catch {}
  };

  const handleLiquidatePawn = async (itemId) => {
    if (!confirm('Convert this expired collateral to a Quick Sale listing on the marketplace?')) return;
    try {
      const res = await fetch('/api/pawn/liquidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg('Collateral converted to Quick Sale.');
        loadData();
      }
    } catch {}
  };

  const formatNaira = (val) => '₦' + Number(val || 0).toLocaleString('en-NG');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center">
          <span>{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="border-0 bg-transparent cursor-pointer font-bold">&times;</button>
        </div>
      )}

      {/* Top Desk Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--dfq-text)' }}>
            Trade Desk &amp; Active Collateral
          </h2>
          <p className="text-xs text-slate-500 mb-0">
            Manage incoming barter proposals, Dual-OTP handovers, and pawn buyback timelines.
          </p>
        </div>
        <div className="text-xs font-medium px-3 py-1.5 rounded-lg border flex items-center gap-1.5" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Active Escrow Protection: Enabled</span>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Incoming Proposals</span>
          <span className="text-xl font-bold" style={{ color: 'var(--dfq-text)' }}>{incomingOffers.length}</span>
        </div>
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">Outgoing Proposals</span>
          <span className="text-xl font-bold" style={{ color: 'var(--dfq-text)' }}>{outgoingOffers.length}</span>
        </div>
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">My Posted Listings</span>
          <span className="text-xl font-bold" style={{ color: 'var(--dfq-text)' }}>{myItems.length}</span>
        </div>
        <div className="p-3.5 rounded-xl border" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <span className="text-[11px] text-slate-400 font-medium block mb-1">KYC Trader Tier</span>
          <span className="text-xl font-bold text-blue-600">Tier {user?.kyc_tier || 1}</span>
        </div>
      </div>

      {/* Desk Tabs */}
      <div className="flex border-b mb-6 gap-2" style={{ borderColor: 'var(--dfq-border)' }}>
        {[
          { key: 'incoming', label: `Incoming Proposals (${incomingOffers.length})` },
          { key: 'outgoing', label: `Outgoing Proposals (${outgoingOffers.length})` },
          { key: 'pawn', label: 'Pawn & Collateral Desk' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 cursor-pointer transition-all ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Incoming Offers */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incomingOffers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-xl" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
              No incoming proposals at the moment.
            </div>
          ) : (
            incomingOffers.map(offer => (
              <div key={offer.id} className="p-4 rounded-xl border flex flex-col md:flex-row justify-between gap-4 items-start md:items-center" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold" style={{ color: 'var(--dfq-text)' }}>{offer.my_item_title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">
                    Offered: <strong style={{ color: 'var(--dfq-text)' }}>{offer.offered_item}</strong> &bull; Cash top-up: <strong className="text-emerald-600">{offer.cash_topup}</strong>
                  </p>
                  {offer.note && <p className="text-[11px] text-slate-400 italic mb-0">"{offer.note}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {offer.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(offer.id, 'In Escrow')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 border-0 cursor-pointer"
                      >
                        Accept Deal
                      </button>
                      <button
                        onClick={() => handleRespond(offer.id, 'Declined', 'Value mismatch')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {offer.status === 'In Escrow' && (
                    <button
                      onClick={() => setHandoverOffer(offer)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 border-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Dual-OTP Handover</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Outgoing Proposals */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingOffers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-xl" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
              You haven't proposed any swaps yet.
            </div>
          ) : (
            outgoingOffers.map(offer => (
              <div key={offer.id} className="p-4 rounded-xl border flex justify-between items-center" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
                <div>
                  <span className="text-xs font-bold block mb-1" style={{ color: 'var(--dfq-text)' }}>Requested: {offer.target_item_title}</span>
                  <span className="text-xs text-slate-500">Your offering: {offer.offered_item} ({offer.cash_topup})</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
                  {offer.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Pawn Collateral Desk */}
      {activeTab === 'pawn' && (
        <div className="space-y-3">
          {myItems.filter(i => i.mode === 'Pawn / Quick Sale').length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-xl" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
              No active pawned collateral listings.
            </div>
          ) : (
            myItems.filter(i => i.mode === 'Pawn / Quick Sale').map(item => {
              const isRedeemed = Boolean(item.redeemed_at);
              const isLiquidated = Number(item.is_liquidated) === 1;

              return (
                <div key={item.id} className="p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
                  <div>
                    <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--dfq-text)' }}>{item.title}</h4>
                    <p className="text-xs text-slate-500 mb-0">
                      Advance: <strong>{formatNaira(item.pawn_advance)}</strong> &bull; Buyback Total (10% fee): <strong className="text-blue-600">{formatNaira(item.pawn_buyback)}</strong>
                    </p>
                    <span className="text-[11px] text-amber-600 flex items-center gap-1 mt-1 font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Due by: {item.pawn_due_date || 'In 14 days'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {!isRedeemed && !isLiquidated ? (
                      <>
                        <button
                          onClick={() => handleRedeemPawn(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 border-0 cursor-pointer"
                        >
                          Redeem
                        </button>
                        <button
                          onClick={() => handleLiquidatePawn(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-300 cursor-pointer"
                        >
                          Liquidate
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {isRedeemed ? 'Redeemed' : 'Liquidated'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Dual-OTP Handover Modal */}
      {handoverOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border p-5 shadow-2xl" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
            <div className="flex items-center justify-between pb-2 mb-3 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
              <div className="flex items-center gap-1.5 font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dual-OTP Handover Exchange</span>
              </div>
              <button onClick={() => setHandoverOffer(null)} className="border-0 bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer">
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Both parties must physically inspect goods. Ask the partner for their 4-digit verification code:
            </p>
            <div className="p-3 rounded-lg border text-center mb-3 bg-blue-50 dark:bg-blue-950/40 border-blue-200">
              <span className="text-[11px] text-slate-400 block mb-0.5">Your Verification Code to Provide to Partner:</span>
              <span className="text-2xl font-mono font-bold text-blue-600 tracking-widest">{handoverOffer.owner_otp || '4829'}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Enter Partner's Code *</label>
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  placeholder="e.g. 5192"
                  className="w-full px-3 py-2 text-center text-lg font-mono font-bold tracking-widest border rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                className="w-full py-2.5 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-700"
              >
                Confirm Physical Handover &amp; Release Escrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
