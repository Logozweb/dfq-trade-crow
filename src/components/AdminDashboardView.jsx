import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, Users,
  Package, ArrowLeftRight, Coins, AlertTriangle, Eye, Search,
  RefreshCw, Check, X, ExternalLink, Filter
} from 'lucide-react';

export default function AdminDashboardView({ onBackToMarketplace }) {
  const [activeTab, setActiveTab] = useState('kyc'); // 'kyc', 'listings', 'users', 'swaps', 'all_items'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data');
      const json = await res.json();
      setLoading(false);
      if (json.success) {
        setData(json);
      } else {
        setError(json.message || 'Failed to load admin data. Ensure you have admin access.');
      }
    } catch (_) {
      setLoading(false);
      setError('Connection error while loading admin console.');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // KYC Actions
  const handleApproveKyc = async (id, name) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/approve`, { method: 'POST' });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`KYC Approved for ${name}! User can now list items.`);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to approve KYC.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error approving KYC.');
    }
  };

  const handleRejectKyc = async (id, name) => {
    const reason = prompt(`Enter reason for rejecting KYC for ${name}:`, 'NIN details did not match profile name.');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`KYC rejected for ${name}.`);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to reject KYC.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error rejecting KYC.');
    }
  };

  // Listing Actions
  const handleApproveItem = async (id, title) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${id}/approve`, { method: 'POST' });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`Listing "${title}" is now LIVE on the marketplace!`);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to approve listing.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error approving listing.');
    }
  };

  const handleRejectItem = async (id, title) => {
    const reason = prompt(`Enter reason for rejecting listing "${title}":`, 'Item photo unclear or price inaccurate.');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`Listing "${title}" rejected.`);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to reject listing.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error rejecting listing.');
    }
  };

  // Generic admin action (remove item, restore, add credits, toggle admin)
  const handleGenericAction = async (act, id, extra = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ act, id, ...extra })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        alert(json.message);
      }
    } catch (_) {
      setActionLoading(false);
      alert('Action error.');
    }
  };

  const stats = data?.stats || {};
  const pendingKyc = data?.pendingKyc || [];
  const pendingItems = data?.pendingItems || [];
  const allUsers = data?.allUsers || [];
  const allItems = data?.allItems || [];
  const allOffers = data?.allOffers || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Administrative Control Center
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DFQ Operations & Compliance Hub
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-0">
            Review user identities (NIN/KYC), authorize marketplace listings, moderate traders, and inspect escrow deals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-500' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={onBackToMarketplace}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 my-6">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Total Traders</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{stats.users || 0}</div>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Pending KYC</span>
          </div>
          <div className="text-2xl font-bold text-amber-800 dark:text-amber-300 mt-1.5 flex items-center gap-2">
            <span>{stats.pending_kyc || 0}</span>
            {stats.pending_kyc > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                Action Req.
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/50 dark:bg-sky-950/20">
          <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-sky-500" />
            <span>Pending Listings</span>
          </div>
          <div className="text-2xl font-bold text-sky-800 dark:text-sky-300 mt-1.5 flex items-center gap-2">
            <span>{stats.pending_items || 0}</span>
            {stats.pending_items > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-sky-200 dark:bg-sky-800 text-sky-900 dark:text-sky-100">
                Awaiting
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Active Listings</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
            {(stats.items || 0) - (stats.pending_items || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
            <span>Active Swaps</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{stats.active_swaps || 0}</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>Reported Flags</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5">{stats.reported || 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-2 transition-all ${
            activeTab === 'kyc'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pending KYC Reviews</span>
          {pendingKyc.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'kyc' ? 'bg-white text-sky-700' : 'bg-amber-500 text-white'}`}>
              {pendingKyc.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-2 transition-all ${
            activeTab === 'listings'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Listing Approvals</span>
          {pendingItems.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'listings' ? 'bg-white text-sky-700' : 'bg-sky-500 text-white'}`}>
              {pendingItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('all_items')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
            activeTab === 'all_items'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>All Listings & Flags</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
            activeTab === 'users'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Traders Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('swaps')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
            activeTab === 'swaps'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Escrow & Barter Deals</span>
        </button>
      </div>

      {/* Tab 1: Pending KYC Reviews */}
      {activeTab === 'kyc' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Identity & NIN Verifications Awaiting Review ({pendingKyc.length})
            </h2>
            <span className="text-xs text-slate-500">
              Users cannot create marketplace listings until verified here.
            </span>
          </div>

          {pendingKyc.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">All KYC Applications Cleared</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No identity submissions are pending review. New applicants will appear here as soon as they submit NIN/BVN details.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">Verification Type</th>
                    <th className="py-3 px-4">NIN / BVN Number</th>
                    <th className="py-3 px-4">Business / CAC</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingKyc.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{k.full_name}</div>
                        <div className="text-[11px] text-slate-500">{k.email} • {k.phone}</div>
                        <div className="text-[10px] text-slate-400">{k.location}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          k.tier === 3
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>Tier {k.tier}: {k.tier === 3 ? 'Pro Storefront' : 'Verified Trader'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{k.nin_bvn}</div>
                        <div className="text-[10px] text-slate-500 uppercase">{k.id_type}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        {k.business_name ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{k.business_name}</div>
                            <div className="text-[10px] text-slate-500">{k.business_address || 'Storefront Verified'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Individual Trader</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApproveKyc(k.id, k.full_name)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border-0 cursor-pointer shadow-xs flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleRejectKyc(k.id, k.full_name)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-0 cursor-pointer transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Listing Approvals */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Listings Submitted for Approval ({pendingItems.length})
            </h2>
            <span className="text-xs text-slate-500">
              Items do not appear on the public marketplace until authorized here.
            </span>
          </div>

          {pendingItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">No Listings Pending Review</div>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Every newly created barter or pawn item is reviewed here before going live. Check back when traders post listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        Pending Admin Review
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">#{item.id}</span>
                    </div>

                    <div className="aspect-video w-full rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                      <img
                        src={item.image_path}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'assets/img/phone.svg'; }}
                      />
                    </div>

                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{item.title}</h3>
                    <div className="text-[11px] text-slate-500 mb-2">
                      Owner: <strong>{item.owner_name}</strong> ({item.location})
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Mode:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{item.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Estimated Value:</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">
                          ₦{Number(item.est_value || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Wanted:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                          {item.wanted}
                        </span>
                      </div>
                      {item.serial_imei && (
                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                          <span className="text-slate-500">Serial/IMEI:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                            {item.serial_imei}
                          </span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleApproveItem(item.id, item.title)}
                      disabled={actionLoading}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs border-0 cursor-pointer shadow-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>
                    <button
                      onClick={() => handleRejectItem(item.id, item.title)}
                      disabled={actionLoading}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-0 cursor-pointer transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: All Listings & Moderation */}
      {activeTab === 'all_items' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              All Listings Database ({allItems.length})
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Owner</th>
                  <th className="py-3 px-4">Category / Mode</th>
                  <th className="py-3 px-4">Est. Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allItems
                  .filter(it => !searchQuery || it.title.toLowerCase().includes(searchQuery.toLowerCase()) || (it.owner_name && it.owner_name.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map(it => (
                    <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{it.title}</span>
                          {it.is_featured === 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              Featured
                            </span>
                          )}
                          {it.is_reported === 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                              Reported Flag
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">ID #{it.id} • {it.location}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{it.owner_name}</div>
                        <div className="text-[11px] text-slate-400">{it.owner_email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{it.category}</div>
                        <div className="text-[10px] text-slate-400">{it.mode}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">
                        ₦{Number(it.est_value || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          it.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : it.status === 'pending_review'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : it.status === 'Swapped'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {it.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {it.status === 'Active' ? (
                            <button
                              onClick={() => handleGenericAction('remove_item', it.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 border-0 cursor-pointer"
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGenericAction('restore_item', it.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 border-0 cursor-pointer"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Traders Directory */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Traders Directory ({allUsers.length})
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4">KYC Status</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Spotlight Boosts</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email} • {u.phone}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.kyc_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : u.kyc_status === 'pending_review'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        <ShieldCheck className="w-3 h-3" />
                        <span className="capitalize">{u.kyc_status} (Tier {u.kyc_tier || 1})</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {u.is_admin === 1 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          Administrator
                        </span>
                      ) : (
                        <span className="text-slate-500">Trader Member</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {u.spotlight_credits || 0} Credits
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {u.referral_code}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleGenericAction('add_credits', u.id, { credits: 5 })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 border-0 cursor-pointer"
                        >
                          +5 Boosts
                        </button>
                        <button
                          onClick={() => handleGenericAction('toggle_admin', u.id)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-0 cursor-pointer"
                        >
                          {u.is_admin === 1 ? 'Demote' : 'Make Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Escrow & Barter Deals */}
      {activeTab === 'swaps' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Escrow & Barter Proposals ({allOffers.length})
            </h2>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Deal Reference</th>
                  <th className="py-3 px-4">Parties Involved</th>
                  <th className="py-3 px-4">Offered Exchange</th>
                  <th className="py-3 px-4">Cash Top-Up / Escrow</th>
                  <th className="py-3 px-4">Deal Status</th>
                  <th className="py-3 px-4">Dual-OTP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allOffers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">Offer #{o.id}</div>
                      <div className="text-[11px] text-slate-400">{o.item_title}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div><span className="text-slate-400">Proposer:</span> <strong className="text-slate-800 dark:text-slate-200">{o.proposer_name}</strong></div>
                      <div><span className="text-slate-400">Owner:</span> <strong className="text-slate-800 dark:text-slate-200">{o.owner_name}</strong></div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {o.offered_item}
                    </td>
                    <td className="py-3 px-4 font-bold text-sky-600 dark:text-sky-400">
                      {o.cash_topup}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : o.status === 'In Escrow'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : o.status === 'Countered'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono">
                      {o.status === 'In Escrow' ? (
                        <span className="text-sky-600 font-bold">Awaiting Dual-OTP at Meetup Hub</span>
                      ) : o.status === 'Accepted' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Dual-OTP Verified &amp; Released</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">Not in Escrow</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
