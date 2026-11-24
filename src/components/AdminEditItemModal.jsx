import React, { useState } from 'react';
import { X, Check, Package, AlertTriangle, Sparkles, MapPin, Tag } from 'lucide-react';

export default function AdminEditItemModal({ item, onClose, onSaved }) {
  const [formData, setFormData] = useState({
    title: item?.title || '',
    category: item?.category || 'phones',
    mode: item?.mode || 'Direct Barter',
    item_condition: item?.item_condition || 'Neatly Used',
    location: item?.location || '',
    wanted: item?.wanted || '',
    est_value: item?.est_value ?? 0,
    pawn_advance: item?.pawn_advance ?? '',
    pawn_buyback: item?.pawn_buyback ?? '',
    serial_imei: item?.serial_imei || '',
    description: item?.description || '',
    status: item?.status || 'Active',
    is_featured: item?.is_featured === 1,
    is_reported: item?.is_reported === 1
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/items/${item.id}/edit`, {
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
        setError(data.message || 'Failed to update listing.');
      }
    } catch (err) {
      setSaving(false);
      setError('Network connection error while saving listing.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-0">
                Edit Marketplace Listing #{item?.id}
              </h3>
              <p className="text-[11px] text-slate-500 mb-0">
                Modify title, trade valuation, category, condition, and status flags.
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

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Listing Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="phones">Phones & Tablets</option>
                <option value="electronics">Electronics & Computers</option>
                <option value="vehicles">Vehicles & Autos</option>
                <option value="fashion">Fashion & Luxury</option>
                <option value="real_estate">Property & Land</option>
                <option value="other">General Barter</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Trade Mode</label>
              <select
                value={formData.mode}
                onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Direct Barter">Direct Barter</option>
                <option value="Cash or Swap">Cash or Swap</option>
                <option value="Pawn Collateral">Pawn Collateral</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Condition</label>
              <select
                value={formData.item_condition}
                onChange={(e) => setFormData({ ...formData, item_condition: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Brand New">Brand New</option>
                <option value="Neatly Used">Neatly Used</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Estimated Valuation (₦)</label>
              <input
                type="number"
                min="0"
                value={formData.est_value}
                onChange={(e) => setFormData({ ...formData, est_value: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Listing Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              >
                <option value="Active">Active (Live in Feed)</option>
                <option value="pending_review">Pending Review</option>
                <option value="Swapped">Swapped</option>
                <option value="Removed">Removed</option>
                <option value="liquidated">Liquidated Collateral</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Owner Wanted In Return</label>
              <input
                type="text"
                value={formData.wanted}
                onChange={(e) => setFormData({ ...formData, wanted: e.target.value })}
                placeholder="e.g. MacBook Pro OR ₦400k Cash"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Location / Hub</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Ikeja, Lagos"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Serial Number / IMEI / VIN</label>
            <input
              type="text"
              value={formData.serial_imei}
              onChange={(e) => setFormData({ ...formData, serial_imei: e.target.value })}
              placeholder="Hardware identifier"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">Item Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="w-4 h-4 rounded text-sky-600 cursor-pointer"
              />
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Featured Spotlight Boost
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_reported}
                onChange={(e) => setFormData({ ...formData, is_reported: e.target.checked })}
                className="w-4 h-4 rounded text-red-600 cursor-pointer"
              />
              <span className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Flagged for Report
              </span>
            </label>
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
