import React, { useState, useEffect } from 'react';
import {
  Kanban, ArrowLeftRight, Clock, CheckCircle2, XCircle, ShieldCheck, Tag,
  Wallet, Eye, EyeOff, AlertCircle, Package, Send, Check, X, QrCode, Edit3, Trash2
} from 'lucide-react';
import UserEditListingModal from './UserEditListingModal';

export default function TradeDeskView({ user, onOpenChat }) {
  const [activeTab, setActiveTab] = useState('my_listings'); // 'my_listings', 'incoming', 'outgoing', 'pawn'
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [outgoingOffers, setOutgoingOffers] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [handoverOffer, setHandoverOffer] = useState(null);
  const [otpInput, setOtpInput] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [editingItem, setEditingItem] = useState(null);

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
        setToastMsg('Dual-OTP Handover Verified! Escrow released and swap marked complete.');
        setHandoverOffer(null);
        setOtpInput('');
        loadData();
      } else {
        alert(data.message || 'Invalid code.');
      }
    } catch {}
  };

  const handleToggleHideItem = async (item) => {
    const newStatus = item.status === 'Active' ? 'Hidden' : 'Active';
    try {
      const res = await fetch('/api/items/toggle_status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg(`Listing ${newStatus === 'Hidden' ? 'hidden from marketplace' : 'made active live'}!`);
        loadData();
      }
    } catch {}
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${item.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/items/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: item.id })
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg('Listing deleted permanently.');
        loadData();
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
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-800 dark:text-emerald-300 text-xs flex justify-between items-center animate-in fade-in">
          <span className="font-medium">{toastMsg}</span>
          <button onClick={() => setToastMsg('')} className="border-0 bg-transparent cursor-pointer font-bold text-slate-400 hover:text-slate-600">&times;</button>
        </div>
      )}

      {/* Top Desk Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Trader Operations Desk
          </h2>
          <p className="text-xs text-slate-500 mb-0">
            Track your listings, manage incoming barter deals, inspect Dual-OTP handovers, and monitor pawn buybacks.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-sky-500" />
          <span>Active Escrow Protection: Enabled</span>
        </div>
      </div>

      {/* Stats Cluster */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1">My Listings</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{myItems.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1">Incoming Proposals</span>
          <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">{incomingOffers.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1">Outgoing Proposals</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{outgoingOffers.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-[11px] text-slate-400 font-semibold block mb-1">KYC Trader Status</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 capitalize flex items-center gap-1 mt-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{user?.kyc_status || 'Unverified'} (Tier {user?.kyc_tier || 1})</span>
          </span>
        </div>
      </div>

      {/* Desk Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { key: 'my_listings', label: `My Items (${myItems.length})` },
          { key: 'incoming', label: `Incoming Offers (${incomingOffers.length})` },
          { key: 'outgoing', label: `Sent Offers (${outgoingOffers.length})` },
          { key: 'pawn', label: 'Pawn Collateral Desk' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2.5 px-3 border-b-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === t.key
                ? 'border-sky-600 text-sky-600 dark:text-sky-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: My Items & Admin Review Badges */}
      {activeTab === 'my_listings' && (
        <div className="space-y-3">
          {myItems.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900">
              You haven't posted any items yet. Click "+ Post Listing" above.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myItems.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'pending_review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : item.status === 'Hidden'
                          ? 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                          : item.status === 'Swapped'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {item.status === 'pending_review' ? 'Pending Admin Review' : item.status === 'Active' ? 'Live on Marketplace' : item.status === 'Hidden' ? 'Hidden by You' : item.status}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">#{item.id}</span>
                    </div>

                    <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3 relative group">
                      <img src={item.image_path} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'assets/img/phone.svg'; }} />
                      {item.gallery && item.gallery.length > 1 && (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                          {item.gallery.length} photos
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.title}</h4>
                    <div className="text-xs text-slate-500 mb-2">
                      Valuation: <strong className="text-sky-600 dark:text-sky-400">{formatNaira(item.est_value)}</strong> &bull; {item.mode}
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 mb-3">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Wanted:</span>
                      <span className="line-clamp-1">{item.wanted}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.status === 'pending_review' && (
                        <span className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Awaiting compliance
                        </span>
                      )}
                    </div>

                    {/* Listing Management Controls (Edit, Hide/Unhide, Delete) */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs border-0 cursor-pointer transition-colors flex items-center justify-center gap-1"
                        title="Edit listing details"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sky-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleHideItem(item)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs border-0 cursor-pointer transition-colors flex items-center justify-center gap-1"
                        title={item.status === 'Active' ? 'Hide listing from public search' : 'Restore listing to public marketplace'}
                      >
                        {item.status === 'Active' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Unhide</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border-0 cursor-pointer transition-colors"
                        title="Delete listing permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Incoming Offers */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incomingOffers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              No incoming proposals at the moment.
            </div>
          ) : (
            incomingOffers.map(offer => (
              <div
                key={offer.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{offer.my_item_title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      {offer.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                    Offered: <strong className="text-slate-900 dark:text-white">{offer.offered_item}</strong> &bull; Cash top-up: <strong className="text-emerald-600">{offer.cash_topup}</strong>
                  </p>
                  {offer.note && <p className="text-[11px] text-slate-400 italic mb-0">"{offer.note}"</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {offer.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleRespond(offer.id, 'In Escrow')}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border-0 cursor-pointer shadow-xs"
                      >
                        Accept Deal
                      </button>
                      <button
                        onClick={() => handleRespond(offer.id, 'Declined', 'Value mismatch')}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer bg-transparent"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {offer.status === 'In Escrow' && (
                    <button
                      onClick={() => setHandoverOffer(offer)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 border-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
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

      {/* TAB 3: Outgoing Proposals */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingOffers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              You haven't proposed any swaps yet.
            </div>
          ) : (
            outgoingOffers.map(offer => (
              <div
                key={offer.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center"
              >
                <div>
                  <span className="text-xs font-bold block mb-1 text-slate-900 dark:text-white">Requested: {offer.target_item_title}</span>
                  <span className="text-xs text-slate-500">Your offering: {offer.offered_item} ({offer.cash_topup})</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  {offer.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: Pawn Collateral Desk */}
      {activeTab === 'pawn' && (
        <div className="space-y-3">
          {myItems.filter(i => i.mode === 'Pawn / Quick Sale').length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              No active pawned collateral listings.
            </div>
          ) : (
            myItems.filter(i => i.mode === 'Pawn / Quick Sale').map(item => {
              const isRedeemed = Boolean(item.redeemed_at);
              const isLiquidated = Number(item.is_liquidated) === 1;

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                >
                  <div>
                    <h4 className="text-sm font-bold mb-1 text-slate-900 dark:text-white">{item.title}</h4>
                    <p className="text-xs text-slate-500 mb-0">
                      Advance: <strong>{formatNaira(item.pawn_advance)}</strong> &bull; Buyback Total (10% fee): <strong className="text-sky-600 dark:text-sky-400">{formatNaira(item.pawn_buyback)}</strong>
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
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 border-0 cursor-pointer shadow-xs"
                        >
                          Redeem
                        </button>
                        <button
                          onClick={() => handleLiquidatePawn(item.id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Dual-OTP Handover Exchange</span>
              </div>
              <button onClick={() => setHandoverOffer(null)} className="border-0 bg-transparent text-slate-400 hover:text-slate-600 cursor-pointer text-base">
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Both parties must physically inspect goods at the meetup hub. Ask the partner for their 4-digit verification code:
            </p>
            <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-center mb-3">
              <span className="text-[11px] text-slate-400 block mb-0.5">Your Verification Code to Provide to Partner:</span>
              <span className="text-3xl font-mono font-bold text-sky-600 dark:text-sky-400 tracking-widest">{handoverOffer.owner_otp || '4829'}</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Enter Partner's Code *</label>
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  placeholder="e.g. 5192"
                  className="w-full px-3 py-2 text-center text-xl font-mono font-bold tracking-widest border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl outline-none focus:border-sky-500"
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                className="w-full py-2.5 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-emerald-600 hover:bg-emerald-500 transition-colors"
              >
                Confirm Physical Handover &amp; Release Escrow
              </button>
            </div>
          </div>
        </div>
      )}
      {/* User Edit Listing Modal */}
      {editingItem && (
        <UserEditListingModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={() => {
            setToastMsg('Listing updated successfully!');
            loadData();
          }}
        />
      )}
    </div>
  );
}
