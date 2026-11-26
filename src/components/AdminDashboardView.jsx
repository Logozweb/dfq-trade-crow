import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, Users,
  Package, ArrowLeftRight, Coins, AlertTriangle, Eye, EyeOff, Search,
  RefreshCw, Check, X, ExternalLink, Filter, Mail, Send, Server, Key,
  Inbox, Database, CheckCircle, Trash2, Edit3, Lock, Unlock, Sparkles,
  Ban, Shield
} from 'lucide-react';
import Pagination from './Pagination';
import AdminEditUserModal from './AdminEditUserModal';
import AdminEditItemModal from './AdminEditItemModal';

export default function AdminDashboardView({ onBackToMarketplace }) {
  const [activeTab, setActiveTab] = useState('kyc'); // 'kyc', 'listings', 'email_dispatcher', 'users', 'swaps', 'all_items'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [traderSearchQuery, setTraderSearchQuery] = useState('');

  // Pagination States (Requirement 4)
  const [kycPage, setKycPage] = useState(1);
  const [listingApprovalPage, setListingApprovalPage] = useState(1);
  const [allItemsPage, setAllItemsPage] = useState(1);
  const [tradersPage, setTradersPage] = useState(1);
  const [swapsPage, setSwapsPage] = useState(1);
  const [outboxPage, setOutboxPage] = useState(1);
  const PAGE_SIZE = 10;

  // Modals for Editing (Requirement 1 & 2)
  const [editingUser, setEditingUser] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  // Email Dispatcher State
  const [saveResult, setSaveResult] = useState(null);
  const [emailSettings, setEmailSettings] = useState({
    provider: 'smtp',
    smtp: { host: 'smtp.gmail.com', port: '587', secure: false, user: '', pass: '', senderName: 'DFQ Trade Escrow Security', rejectUnauthorized: false },
    resendApiKey: '',
    senderName: 'DFQ Trade Escrow Security',
    senderEmail: 'no-reply@dfqtradecrow.com',
    subjectLine: 'DFQ Trade Escrow - Your Verification Code'
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
      const s = json.settings || json.data?.settings;
      if (json.success && s) {
        setEmailSettings(s);
      }
    } catch (_) {}
  };

  const fetchEmailOutbox = async () => {
    setOutboxLoading(true);
    try {
      const res = await fetch('/api/admin/email-outbox?limit=200');
      const json = await res.json();
      setOutboxLoading(false);
      const logs = json.logs || json.data?.logs;
      if (json.success && logs) {
        setOutboxLogs(logs);
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
    setSaveResult(null);
    try {
      const res = await fetch('/api/admin/email-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailSettings)
      });
      const json = await res.json();
      setEmailSaving(false);
      if (json.success) {
        setSaveResult({ success: true, message: 'Dispatcher configuration saved successfully!' });
        showToast('Email dispatcher settings saved successfully!');
        const s = json.settings || json.data?.settings;
        if (s) setEmailSettings(s);
      } else {
        setSaveResult({ success: false, message: json.message || 'Failed to save configuration.' });
      }
    } catch (err) {
      setEmailSaving(false);
      setSaveResult({ success: false, message: `Error saving email settings: ${err.message || 'Network request failed'}` });
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
    const message = prompt(
      `Optional approval message to send to ${name}:`,
      'Your identity details and documents have been verified and approved.'
    );
    if (message === null) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`KYC Approved for ${name}! Notification & email sent.`);
        fetchAdminData();
      } else {
        showToast(json.message || 'Failed to approve KYC.', 'error');
      }
    } catch (_) {
      setActionLoading(false);
      showToast('Error approving KYC.', 'error');
    }
  };

  const handleRejectKyc = async (id, name) => {
    const reason = prompt(
      `Enter disapproval message to send to ${name}:`,
      'Submitted NIN/BVN or documents could not be verified. Please re-submit clear details.'
    );
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, message: reason })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(`KYC disapproved for ${name}. Applicant notified.`);
        fetchAdminData();
      } else {
        showToast(json.message || 'Failed to disapprove KYC.', 'error');
      }
    } catch (_) {
      setActionLoading(false);
      showToast('Error disapproving KYC.', 'error');
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

  // Requirement 1: User Management Actions (Delete, Block/Unblock)
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete trader "${name}" (#${id}) and all their listings? This action cannot be reversed.`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to delete user.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error deleting user.');
    }
  };

  const handleToggleBlockUser = async (user) => {
    const isCurrentlyBlocked = user.is_blocked === 1;
    let reason = '';
    if (!isCurrentlyBlocked) {
      reason = window.prompt(`Enter suspension reason for "${user.full_name}":`, 'Suspicious activity or community guidelines violation');
      if (reason === null) return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ block: !isCurrentlyBlocked, reason })
      });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to toggle block status.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error updating user block status.');
    }
  };

  // Requirement 2: Listing Management Actions (Delete, Spotlight Toggle)
  const handleDeleteItem = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete listing "${title}" (#${id})?`)) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' });
      const json = await res.json();
      setActionLoading(false);
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to delete listing.');
      }
    } catch (_) {
      setActionLoading(false);
      alert('Error deleting listing.');
    }
  };

  const handleToggleSpotlight = async (id) => {
    try {
      const res = await fetch(`/api/admin/items/${id}/toggle-spotlight`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast(json.message);
        fetchAdminData();
      } else {
        alert(json.message || 'Failed to toggle spotlight.');
      }
    } catch (_) {
      alert('Error updating spotlight status.');
    }
  };

  // Requirement 3: OTP Dispatch Log Actions (Delete Single & Clear All)
  const handleDeleteOutboxLog = async (id) => {
    try {
      const res = await fetch(`/api/admin/email-outbox/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('Dispatch log entry removed.');
        fetchEmailOutbox();
      } else {
        alert(json.message || 'Failed to delete log entry.');
      }
    } catch (_) {
      alert('Error deleting dispatch log.');
    }
  };

  const handleClearOutboxLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all outbound email dispatch history?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/email-outbox/clear', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        showToast('All dispatch logs cleared.');
        fetchEmailOutbox();
      } else {
        alert(json.message || 'Failed to clear logs.');
      }
    } catch (_) {
      alert('Error clearing dispatch logs.');
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

  // Filtered & Paginated Traders (Requirement 4)
  const filteredUsers = useMemo(() => {
    if (!traderSearchQuery.trim()) return allUsers;
    const q = traderSearchQuery.toLowerCase();
    return allUsers.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.location || '').toLowerCase().includes(q) ||
      (u.referral_code || '').toLowerCase().includes(q)
    );
  }, [allUsers, traderSearchQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (tradersPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, tradersPage]);

  // Filtered & Paginated Listings (Requirement 4)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(it =>
      (it.title || '').toLowerCase().includes(q) ||
      (it.owner_name || '').toLowerCase().includes(q) ||
      (it.wanted || '').toLowerCase().includes(q) ||
      (it.serial_imei || '').toLowerCase().includes(q)
    );
  }, [allItems, searchQuery]);

  const paginatedAllItems = useMemo(() => {
    const start = (allItemsPage - 1) * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [filteredItems, allItemsPage]);

  // Paginated Pending KYC (Requirement 4)
  const paginatedPendingKyc = useMemo(() => {
    const start = (kycPage - 1) * PAGE_SIZE;
    return pendingKyc.slice(start, start + PAGE_SIZE);
  }, [pendingKyc, kycPage]);

  // Paginated Pending Items (Requirement 4)
  const paginatedPendingItems = useMemo(() => {
    const start = (listingApprovalPage - 1) * PAGE_SIZE;
    return pendingItems.slice(start, start + PAGE_SIZE);
  }, [pendingItems, listingApprovalPage]);

  // Paginated Swaps (Requirement 4)
  const paginatedSwaps = useMemo(() => {
    const start = (swapsPage - 1) * PAGE_SIZE;
    return allOffers.slice(start, start + PAGE_SIZE);
  }, [allOffers, swapsPage]);

  // Paginated Outbox Logs (Requirement 4)
  const paginatedOutboxLogs = useMemo(() => {
    const start = (outboxPage - 1) * PAGE_SIZE;
    return outboxLogs.slice(start, start + PAGE_SIZE);
  }, [outboxLogs, outboxPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Edit User Modal */}
      {editingUser && (
        <AdminEditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(msg) => {
            showToast(msg);
            fetchAdminData();
          }}
        />
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <AdminEditItemModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(msg) => {
            showToast(msg);
            fetchAdminData();
          }}
        />
      )}

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

      {/* Global Admin Toast */}
      {toast && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs shadow-lg flex items-center justify-between border border-slate-700 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast('')} className="text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer font-bold">&times;</button>
        </div>
      )}

      {/* Summary Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 my-6">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-slate-500">Total Traders</div>
          <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{stats.users ?? 0}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-amber-600">Pending KYC</div>
          <div className="text-xl font-bold text-amber-600 mt-1">{pendingKyc.length}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-sky-600">Pending Listings</div>
          <div className="text-xl font-bold text-sky-600 mt-1">{pendingItems.length} awaiting</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-emerald-600">Active Listings</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{allItems.filter(i => i.status === 'Active').length}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-purple-600">Active Swaps</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{stats.active_swaps ?? 0}</div>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="text-[11px] font-medium text-rose-600">Reported Flags</div>
          <div className="text-xl font-bold text-rose-600 mt-1">{stats.reported ?? 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('kyc')}
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-2 transition-all whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-2 transition-all whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
          className={`px-3.5 py-2 rounded-xl border-0 cursor-pointer flex items-center gap-1.5 transition-all whitespace-nowrap ${
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
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">NIN &amp; BVN</th>
                    <th className="py-3 px-4">Business / CAC</th>
                    <th className="py-3 px-4">Documents</th>
                    <th className="py-3 px-4">Submitted</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedPendingKyc.map((k) => (
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
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-[10px] text-slate-400 font-sans mr-1">NIN:</span>{k.nin_bvn || '—'}
                        </div>
                        {k.bvn_number && (
                          <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                            <span className="text-[10px] text-slate-400 font-sans mr-1">BVN:</span>{k.bvn_number}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {k.business_name ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{k.business_name}</div>
                            {k.cac_number && <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">CAC: {k.cac_number}</div>}
                            <div className="text-[10px] text-slate-500">{k.business_address || 'Storefront Verified'}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Individual Trader</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {k.id_document_path && (
                            <a
                              href={`/${k.id_document_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[10px] font-semibold hover:underline"
                            >
                              NIN Card
                            </a>
                          )}
                          {k.cac_document_path && (
                            <a
                              href={`/${k.cac_document_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold hover:underline"
                            >
                              CAC Doc
                            </a>
                          )}
                          {k.proof_of_address_path && (
                            <a
                              href={`/${k.proof_of_address_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold hover:underline"
                            >
                              Address Proof
                            </a>
                          )}
                          {!k.id_document_path && !k.cac_document_path && !k.proof_of_address_path && (
                            <span className="text-slate-400 italic text-[10px]">No docs</span>
                          )}
                        </div>
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
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-950/50 text-slate-600 dark:text-slate-400 font-semibold text-xs border-0 cursor-pointer flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>Disapprove</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                currentPage={kycPage}
                totalItems={pendingKyc.length}
                pageSize={PAGE_SIZE}
                onPageChange={setKycPage}
                itemLabel="applications"
              />
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
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedPendingItems.map((item) => (
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
                        onClick={() => setEditingItem(item)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-0 cursor-pointer"
                        title="Edit Details Before Approving"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
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
              <Pagination
                currentPage={listingApprovalPage}
                totalItems={pendingItems.length}
                pageSize={PAGE_SIZE}
                onPageChange={setListingApprovalPage}
                itemLabel="listings"
              />
            </>
          )}
        </div>
      )}

      {/* Tab 3: All Listings & Moderation (Requirement 2 & 4) */}
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
                onChange={e => { setSearchQuery(e.target.value); setAllItemsPage(1); }}
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
                {paginatedAllItems.map(it => (
                  <tr key={it.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{it.title}</span>
                        {it.is_featured === 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            Spotlight
                          </span>
                        )}
                        {it.is_reported === 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            Flagged
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
                      <div className="font-medium text-slate-700 dark:text-slate-300 capitalize">{it.category}</div>
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
                        {/* Requirement 2: Edit Listing */}
                        <button
                          onClick={() => setEditingItem(it)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer transition-colors"
                          title="Edit Listing Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Requirement 2: Spotlight Toggle */}
                        <button
                          onClick={() => handleToggleSpotlight(it.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            it.is_featured === 1
                              ? 'bg-amber-50 text-amber-600 border-amber-300 dark:bg-amber-950/50 dark:border-amber-800'
                              : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700 hover:text-amber-500'
                          }`}
                          title={it.is_featured === 1 ? 'Remove Spotlight Boost' : 'Boost to Spotlight'}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>

                        {/* Hide / Restore */}
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

                        {/* Requirement 2: Delete Listing */}
                        <button
                          onClick={() => handleDeleteItem(it.id, it.title)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 bg-transparent cursor-pointer transition-colors"
                          title="Permanently Delete Listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={allItemsPage}
              totalItems={filteredItems.length}
              pageSize={PAGE_SIZE}
              onPageChange={setAllItemsPage}
              itemLabel="listings"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Traders Directory (Requirement 1 & 4) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Traders Directory ({allUsers.length})
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search traders by name, email, location..."
                value={traderSearchQuery}
                onChange={e => { setTraderSearchQuery(e.target.value); setTradersPage(1); }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="py-3 px-4">Trader</th>
                  <th className="py-3 px-4">Status & KYC</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Spotlight Boosts</th>
                  <th className="py-3 px-4">Referral Code</th>
                  <th className="py-3 px-4 text-right">Manage Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{u.full_name}</span>
                        {u.is_blocked === 1 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                            Blocked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email} • {u.phone}</div>
                      <div className="text-[10px] text-slate-400">{u.location}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
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
                        {u.is_blocked === 1 && (
                          <div className="text-[10px] text-red-600 dark:text-red-400 italic">
                            Suspended: {u.blocked_reason || 'Policy issue'}
                          </div>
                        )}
                      </div>
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
                        {/* Requirement 1: Edit Details */}
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-sky-50 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer transition-colors"
                          title="Edit Trader Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Requirement 1: Block / Unblock User */}
                        <button
                          onClick={() => handleToggleBlockUser(u)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            u.is_blocked === 1
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
                              : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:border-red-900/60'
                          }`}
                          title={u.is_blocked === 1 ? 'Unblock Account' : 'Block & Suspend Account'}
                        >
                          {u.is_blocked === 1 ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Quick Boost */}
                        <button
                          onClick={() => handleGenericAction('add_credits', u.id, { credits: 5 })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 cursor-pointer"
                          title="Grant 5 Free Spotlight Credits"
                        >
                          +5
                        </button>

                        {/* Requirement 1: Delete Trader */}
                        <button
                          onClick={() => handleDeleteUser(u.id, u.full_name)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 bg-transparent cursor-pointer transition-colors"
                          title="Permanently Delete Trader"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={tradersPage}
              totalItems={filteredUsers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setTradersPage}
              itemLabel="traders"
            />
          </div>
        </div>
      )}

      {/* Tab 5: Escrow & Barter Deals (Requirement 4) */}
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
                {paginatedSwaps.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{o.item_title}</div>
                      <div className="text-[11px] text-slate-400">Deal Ref: #{o.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-800 dark:text-slate-200">
                        Proposer: <strong>{o.proposer_name}</strong>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Owner: <strong>{o.owner_name}</strong>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{o.offered_item}</div>
                      {o.note && <div className="text-[10px] text-slate-400 italic">"{o.note}"</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {o.cash_topup || '₦0 (Straight Swap)'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : o.status === 'Accepted' || o.status === 'In Escrow'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : o.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {o.proposer_otp && o.owner_otp ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Dual OTPs Active</span>
                      ) : (
                        <span className="text-slate-400">Awaiting Handshake</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              currentPage={swapsPage}
              totalItems={allOffers.length}
              pageSize={PAGE_SIZE}
              onPageChange={setSwapsPage}
              itemLabel="deals"
            />
          </div>
        </div>
      )}

      {/* Tab 6: Email Dispatcher Hub & Outbox Logs (Requirement 3 & 4) */}
      {activeTab === 'email_dispatcher' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <Mail className="w-4 h-4 text-sky-500" />
                <span>Outbound Mail Transport & OTP Delivery Settings</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                Configure your SMTP server, sender identity, and test outbound OTP and alert emails.
              </p>
            </div>
            <button
              onClick={fetchEmailSettings}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-sky-600 flex items-center gap-1.5 self-start sm:self-auto bg-transparent border-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Current Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Form */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Active Email Delivery Engine
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setEmailSettings(prev => ({ ...prev, provider: 'smtp' }))}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        emailSettings.provider === 'smtp'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <Server className="w-4 h-4 text-sky-600" />
                        <span>Custom SMTP</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        Gmail, Brevo, Mailgun, Amazon SES or cPanel.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailSettings(prev => ({ ...prev, provider: 'resend' }))}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        emailSettings.provider === 'resend'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <span>Resend API</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        Modern transactional email service with API key.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmailSettings(prev => ({ ...prev, provider: 'dev_mock' }))}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        emailSettings.provider === 'dev_mock'
                          ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 ring-2 ring-sky-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span>Simulated (Dev)</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 m-0">
                        Mock delivery without real outbound dispatch.
                      </p>
                    </button>
                  </div>
                </div>

                {/* SMTP Credentials Form */}
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
                          placeholder="e.g. mail.pauladisa.com or smtp.gmail.com"
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

                      <div className="sm:col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700 dark:text-slate-200">
                          <input
                            type="checkbox"
                            checked={emailSettings.smtp?.rejectUnauthorized !== true}
                            onChange={(e) => setEmailSettings(prev => ({
                              ...prev,
                              smtp: { ...prev.smtp, rejectUnauthorized: !e.target.checked }
                            }))}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            Allow Shared-Host / cPanel SSL (Bypasses TLS Certificate Name Mismatch)
                          </span>
                        </label>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-6 leading-relaxed mb-0">
                          Required when connecting to shared hosting mail servers (e.g. <code>mail.pauladisa.com</code> whose server certificate is issued to <code>*.web-hosting.com</code>).
                        </p>
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
                          placeholder="e.g. security@pauladisa.com"
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
                            placeholder="Password or App secret"
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
                        placeholder="DFQ Trade Escrow Security"
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
                      placeholder="DFQ Trade Escrow - Your Verification Code"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
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
                  {saveResult && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                      saveResult.success
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60'
                        : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60'
                    }`}>
                      {saveResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                      <span>{saveResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Test Email Handshake & Dispatch Log */}
            <div className="space-y-5">
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

              {/* Requirement 3: Outbox Activity Card with Delete & Clear All */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-sky-500" />
                    <span>Recent Dispatch Log ({outboxLogs.length})</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {outboxLogs.length > 0 && (
                      <button
                        onClick={handleClearOutboxLogs}
                        className="text-[11px] font-semibold text-red-500 hover:text-red-600 bg-transparent border-0 cursor-pointer flex items-center gap-1"
                        title="Delete all logs"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear All</span>
                      </button>
                    )}
                    <button
                      onClick={fetchEmailOutbox}
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-transparent border-0 cursor-pointer hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${outboxLoading ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {outboxLogs.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No outbound emails logged yet.
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {paginatedOutboxLogs.map((log) => (
                        <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 text-xs flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <strong className="text-slate-900 dark:text-white font-medium truncate">{log.recipient_email}</strong>
                              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
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
                              <span className="truncate">{log.subject || 'OTP Code'}</span>
                              <span className="font-mono text-[10px] shrink-0 pl-2">
                                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          {/* Requirement 3: Delete single outbox log */}
                          <button
                            onClick={() => handleDeleteOutboxLog(log.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border-0 bg-transparent cursor-pointer transition-colors shrink-0"
                            title="Delete log entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Requirement 4: Paginate outbox logs */}
                    <Pagination
                      currentPage={outboxPage}
                      totalItems={outboxLogs.length}
                      pageSize={PAGE_SIZE}
                      onPageChange={setOutboxPage}
                      itemLabel="logs"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
