import React, { useState } from 'react';
import { X, Check, Shield, User, AlertTriangle, Lock, Unlock, Mail, Phone, MapPin, Sparkles } from 'lucide-react';

export default function AdminEditUserModal({ user, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    spotlight_credits: user?.spotlight_credits ?? 0,
    kyc_status: user?.kyc_status || 'unverified',
    kyc_tier: user?.kyc_tier || 1,
    is_admin: user?.is_admin === 1,
    is_blocked: user?.is_blocked === 1,
    blocked_reason: user?.blocked_reason || ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/users/${user.id}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      setSaving(false);
      if (data.success) {
        onSaved(data.message);
        onClose();
      } else {
        setError(data.message || 'Failed to update user.');
      }
    } catch (err) {
      setSaving(false);
      setError('Network connection error while saving user details.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0">
                Edit Trader Profile #{user?.id}
              </h3>
              <p className="text-[11px] text-slate-500 mb-0">
                Update account credentials, KYC badge tier, credits, and privileges.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Location / Hub</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">KYC Status</label>
              <select
                value={formData.kyc_status}
                onChange={(e) => setFormData({ ...formData, kyc_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="unverified">Unverified</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">KYC Tier</label>
              <select
                value={formData.kyc_tier}
                onChange={(e) => setFormData({ ...formData, kyc_tier: parseInt(e.target.value, 10) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value={1}>Tier 1 (Basic)</option>
                <option value={2}>Tier 2 (Blue Shield)</option>
                <option value={3}>Tier 3 (Gold Seal Pro)</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Spotlight Credits</label>
              <input
                type="number"
                min="0"
                value={formData.spotlight_credits}
                onChange={(e) => setFormData({ ...formData, spotlight_credits: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Administrative Role & Suspension */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Admin Privileges</div>
                  <div className="text-[10px] text-slate-500">Grants full control over operations & compliance.</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.is_admin}
                onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 cursor-pointer"
              />
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${formData.is_blocked ? 'bg-red-50/70 border-red-200 dark:bg-red-950/40 dark:border-red-900/50' : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {formData.is_blocked ? <Lock className="w-4 h-4 text-red-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />}
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {formData.is_blocked ? 'Account Suspended / Blocked' : 'Account Active'}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {formData.is_blocked ? 'Trader is prevented from logging in or making trades.' : 'Trader in good standing.'}
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.is_blocked}
                  onChange={(e) => setFormData({ ...formData, is_blocked: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 cursor-pointer"
                />
              </div>

              {formData.is_blocked && (
                <div className="mt-2.5 pt-2 border-t border-red-200/60 dark:border-red-900/60">
                  <label className="block text-[11px] font-medium text-red-700 dark:text-red-300 mb-1">
                    Suspension Reason
                  </label>
                  <input
                    type="text"
                    value={formData.blocked_reason}
                    onChange={(e) => setFormData({ ...formData, blocked_reason: e.target.value })}
                    placeholder="e.g. Terms violation or suspicious IMEI upload"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-slate-900 text-xs text-red-900 dark:text-red-200 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs border-0 cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
