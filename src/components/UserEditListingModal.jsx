import React, { useState } from 'react';
import { X, Check, RefreshCw, Package, MapPin, Coins, ArrowLeftRight } from 'lucide-react';

export default function UserEditListingModal({ item, onClose, onUpdated }) {
  const [title, setTitle] = useState(item?.title || '');
  const [category, setCategory] = useState(item?.category || 'Electronics & Phones');
  const [mode, setMode] = useState(item?.mode || 'Barter Only');
  const [condition, setCondition] = useState(item?.item_condition || 'Neatly Used');
  const [location, setLocation] = useState(item?.location || 'Lekki, Lagos');
  const [wanted, setWanted] = useState(item?.wanted || '');
  const [estValue, setEstValue] = useState(item?.est_value || '');
  const [desc, setDesc] = useState(item?.description || '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !category || !location.trim() || !wanted.trim()) {
      setError('Please fill in all required fields (Title, Category, Location, Wanted).');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/items/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          title: title.trim(),
          category,
          mode,
          item_condition: condition,
          location: location.trim(),
          wanted: wanted.trim(),
          est_value: estValue,
          description: desc.trim()
        })
      });
      const data = await res.json();
      setSaving(false);
      if (data.success) {
        onUpdated && onUpdated();
        onClose && onClose();
      } else {
        setError(data.message || 'Failed to update listing.');
      }
    } catch (err) {
      setSaving(false);
      setError('Connection error while saving edits.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border shadow-2xl p-6 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                Edit Your Listing
              </h3>
              <p className="text-[11px] text-slate-500 mb-0">
                Update item details, trade mode, and wanted exchange
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 mb-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Listing Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              >
                <option value="Electronics & Phones">Electronics & Phones</option>
                <option value="Furniture">Furniture</option>
                <option value="Home Appliances">Home Appliances</option>
                <option value="Vehicles & Bikes">Vehicles & Bikes</option>
                <option value="Fashion & Watches">Fashion & Watches</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Trade Mode *
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              >
                <option value="Barter Only">Barter Only</option>
                <option value="Cash or Swap">Cash or Swap</option>
                <option value="Pawn / Quick Sale">Pawn / Quick Sale</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Condition *
              </label>
              <select
                value={condition}
                onChange={e => setCondition(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              >
                <option value="Brand New">Brand New</option>
                <option value="Neatly Used">Neatly Used</option>
                <option value="Fairly Used">Fairly Used</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Estimated Value (₦)
              </label>
              <input
                type="number"
                value={estValue}
                onChange={e => setEstValue(e.target.value)}
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none font-mono border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Wanted in Exchange *
              </label>
              <input
                type="text"
                required
                value={wanted}
                onChange={e => setWanted(e.target.value)}
                placeholder="e.g. iPhone 15 Pro Max, PS5..."
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-sky-500 resize-none"
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
