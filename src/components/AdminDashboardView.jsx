import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, Users,
  Package, ArrowLeftRight, Coins, AlertTriangle, Eye, EyeOff, Search,
  RefreshCw, Check, X, ExternalLink, Filter, Mail, Send, Server, Key,
  Inbox, Database, CheckCircle
} from 'lucide-react';

export default function AdminDashboardView({ onBackToMarketplace }) {
  const [activeTab, setActiveTab] = useState('kyc'); // 'kyc', 'listings', 'email_dispatcher', 'users', 'swaps', 'all_items'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Email Dispatcher State
  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtp: { host: 'smtp.gmail.com', port: '587', secure: false, user: '', pass: '', senderName: 'DFQ Trade Crow Security' },
    resendApiKey: '',
    senderName: 'DFQ Trade Crow Security',
    senderEmail: 'no-reply@dfqtradecrow.com',
    subjectLine: 'DFQ Trade Crow - Your Verification Code'
  });
  const [showPass, setShowPass] = useState(false);
  const [emailSaving, setEmailSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [outboxLogs, setOutboxLogs] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);

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

  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/admin/email-settings');
      const json = await res.json();
      if (json.success && json.data.settings) {
        setEmailSettings(json.data.settings);
      }
    } catch (_) {}
  };

  const fetchEmailOutbox = async () => {
    setOutboxLoading(true);
    try {
      const res = await fetch('/api/admin/email-outbox');
      const json = await res.json();
      setOutboxLoading(false);
      if (json.success && json.data.logs) {
        setOutboxLogs(json.data.logs);
      }
    } catch (_) {
      setOutboxLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'email_dispatcher') {
      fetchEmailSettings();
      fetchEmailOutbox();
    }
  }, [activeTab]);

  const handleSaveEmailSettings = async (e) => {
    if (e) e.preventDefault();
    setEmailSaving(true);
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      const json = await res.json();
      setEmailSaving(false);
      if (json.success) {
        showToast('Email dispatcher settings saved successfully!');
        if (json.data.settings) setEmailSettings(json.data.settings);
      } else {
        alert(json.message || 'Failed to save settings.');
      }
    } catch (_) {
      setEmailSaving(false);
      alert('Error saving email settings.');
    }
  };

  const handleSendTestEmail = async (e) => {
    if (e) e.preventDefault();
    if (!testRecipient.trim()) {
      alert('Please enter a recipient email address for testing.');
      return;
    }
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/email-settings/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testRecipient.trim(),
          smtp: emailSettings.smtp,
          senderName: emailSettings.senderName,
          senderEmail: emailSettings.senderEmail
        })
      });
      const json = await res.json();
      setTestingEmail(false);
      setTestResult({
        success: json.success,
        message: json.message || json.error || (json.success ? 'Test email dispatched successfully!' : 'Dispatch error.')
      });
      fetchEmailOutbox();
    } catch (err) {
      setTestingEmail(false);
      setTestResult({
        success: false,
        message: 'Network connection failure while attempting test dispatch.'
      });
    }
  };

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

        <button
          onClick={() => setActiveTab('email_dispatcher')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
            activeTab === 'email_dispatcher'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email Dispatcher</span>
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

      {/* Tab 6: Email Dispatcher Configuration */}
      {activeTab === 'email_dispatcher' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-sky-500" />
                <span>Email Dispatcher &amp; SMTP Configuration</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure platform outbound email routing for registration OTPs, KYC decisions, and trade notifications.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                emailSettings.provider === 'smtp' && emailSettings.smtp?.user
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                <Server className="w-3.5 h-3.5" />
                <span>
                  {emailSettings.provider === 'smtp' && emailSettings.smtp?.user ? 'Live SMTP Transport' : 'Simulated / Dev Dispatch'}
                </span>
              </span>
              <button
                onClick={() => { fetchEmailSettings(); fetchEmailOutbox(); }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                title="Refresh Dispatcher"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Transport Settings Form */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-500" />
                <span>Outbound Mail Transport</span>
              </h3>

              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Dispatch Provider
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'smtp', label: 'Custom SMTP', desc: 'Gmail, Mailgun, Brevo, AWS' },
                    { id: 'resend', label: 'Resend API', desc: 'Direct REST API key' },
                    { id: 'simulated', label: 'Dev / Mock', desc: 'Simulated for testing' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEmailSettings(prev => ({ ...prev, provider: p.id }))}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        emailSettings.provider === p.id
                          ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold text-xs">{p.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{p.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SMTP Settings Fields */}
              {emailSettings.provider === 'smtp' && (
                <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Host Server
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtp?.host || ''}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp: { ...prev.smtp, host: e.target.value } }))}
                        placeholder="smtp.gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Port
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={emailSettings.smtp?.port || ''}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp: { ...prev.smtp, port: e.target.value } }))}
                          placeholder="587"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setEmailSettings(prev => ({ ...prev, smtp: { ...prev.smtp, secure: !prev.smtp?.secure } }))}
                          className={`px-3 py-2 rounded-xl border text-[11px] font-semibold cursor-pointer shrink-0 ${
                            emailSettings.smtp?.secure
                              ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {emailSettings.smtp?.secure ? 'SSL (465)' : 'TLS (587)'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Username / Email
                      </label>
                      <input
                        type="text"
                        value={emailSettings.smtp?.user || ''}
                        onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp: { ...prev.smtp, user: e.target.value } }))}
                        placeholder="your-email@gmail.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        SMTP Password / App Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={emailSettings.smtp?.pass || ''}
                          onChange={(e) => setEmailSettings(prev => ({ ...prev, smtp: { ...prev.smtp, pass: e.target.value } }))}
                          placeholder="App Password or API secret"
                          className="w-full pl-3 pr-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer p-0"
                        >
                          {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resend API Key Field */}
              {emailSettings.provider === 'resend' && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Resend API Key
                  </label>
                  <input
                    type="password"
                    value={emailSettings.resendApiKey || ''}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, resendApiKey: e.target.value }))}
                    placeholder="re_1234567890abcdef..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              )}

              {/* Sender Identity Section */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Sender Identity Branding
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      From Display Name
                    </label>
                    <input
                      type="text"
                      value={emailSettings.senderName || ''}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, senderName: e.target.value }))}
                      placeholder="DFQ Trade Crow Security"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      From Email Address
                    </label>
                    <input
                      type="email"
                      value={emailSettings.senderEmail || ''}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                      placeholder="no-reply@dfqtradecrow.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Default OTP Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSettings.subjectLine || ''}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, subjectLine: e.target.value }))}
                    placeholder="DFQ Trade Crow - Your Verification Code"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={emailSaving}
                  onClick={handleSaveEmailSettings}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs border-0 cursor-pointer shadow-sm shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {emailSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Dispatcher Configuration</span>
                </button>
              </div>
            </div>

            {/* Right 5 cols: Live SMTP Test & Outbox */}
            <div className="lg:col-span-5 space-y-6">
              {/* Test Email Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>Test Email Handshake</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send a live test verification code to verify your SMTP server connection and SSL/TLS credentials.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Test Recipient Email
                    </label>
                    <input
                      type="email"
                      value={testRecipient}
                      onChange={(e) => setTestRecipient(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={testingEmail}
                    onClick={handleSendTestEmail}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {testingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{testingEmail ? 'Testing Connection...' : 'Send Test Dispatch'}</span>
                  </button>

                  {testResult && (
                    <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 border ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60'
                    }`}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                      <span className="leading-relaxed">{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Outbox Activity Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-sky-500" />
                    <span>Recent Dispatch Log</span>
                  </h3>
                  <button
                    onClick={fetchEmailOutbox}
                    className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-transparent border-0 cursor-pointer hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${outboxLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {outboxLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No outbound emails logged yet.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                    {outboxLogs.slice(0, 10).map((log) => (
                      <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <strong className="text-slate-900 dark:text-white font-medium truncate">{log.recipient_email}</strong>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : log.status === 'simulated'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>{log.subject || 'OTP Code'}</span>
                          <span className="font-mono text-[10px]">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
