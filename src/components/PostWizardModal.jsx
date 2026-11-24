import React, { useState } from 'react';
import { X, ArrowRight, ArrowLeft, Upload, ShieldCheck, CheckCircle2, QrCode, Calculator, BadgeCheck } from 'lucide-react';

export default function PostWizardModal({ user, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics & Phones');
  const [condition, setCondition] = useState('Neatly Used');
  const [location, setLocation] = useState('Lekki, Lagos');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState('Barter Only');
  const [estValue, setEstValue] = useState('');
  const [wanted, setWanted] = useState('');
  const [pawnAdvance, setPawnAdvance] = useState('');
  const [pawnDays, setPawnDays] = useState('14');
  const [serialImei, setSerialImei] = useState('');
  const [serialStatus, setSerialStatus] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    setPhotos(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setPhotoPreviews(previews);
  };

  const handleCheckSerial = () => {
    if (!serialImei.trim()) return;
    fetch(`/api/items.php?action=check_serial&serial=${encodeURIComponent(serialImei.trim())}`)
      .then(r => r.json())
      .then(data => setSerialStatus(data))
      .catch(() => {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('item_condition', condition);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('mode', mode);
    formData.append('est_value', estValue);
    formData.append('wanted', wanted);
    if (mode === 'Pawn / Quick Sale') {
      formData.append('pawn_advance', pawnAdvance);
      formData.append('pawn_days', pawnDays);
    }
    formData.append('serial_imei', serialImei);
    photos.forEach(file => formData.append('photos[]', file));
    if (receiptFile) formData.append('receipt', receiptFile);

    try {
      const res = await fetch('/api/items.php?action=create', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onSuccess && onSuccess(data.message || 'Listing published successfully!');
        onClose();
      } else {
        setError(data.message || 'Could not publish listing.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error while uploading.');
    }
  };

  const buybackTotal = pawnAdvance ? Math.round(Number(pawnAdvance) * 1.1) : 0;
  const formatNaira = (val) => '₦' + Number(val || 0).toLocaleString('en-NG');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-xl rounded-2xl border shadow-2xl p-5 overflow-hidden flex flex-col max-h-[92vh]"
        style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>Guided Listing Wizard</h3>
            <p className="text-[11px] text-slate-500 mb-0">Step {step} of 3 &bull; Anti-theft screened marketplace</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4 text-xs font-semibold">
          {[
            { num: 1, label: 'Identity & Photos' },
            { num: 2, label: 'Trade Terms' },
            { num: 3, label: 'Serial & Anti-Theft' }
          ].map(s => (
            <div
              key={s.num}
              className={`p-2 rounded-lg border text-center transition-all ${
                step === s.num
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                  : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-bold">Step {s.num}</div>
              <div className="truncate">{s.label}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <div className="overflow-y-auto flex-1 pr-1">
          {/* STEP 1: Identity & Photos */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Item Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. iPhone 15 Pro Max (256GB, Natural Titanium)"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Category *</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  >
                    <option value="Electronics & Phones">Electronics &amp; Phones</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Home Appliances">Home Appliances</option>
                    <option value="Vehicles & Bikes">Vehicles &amp; Bikes</option>
                    <option value="Fashion & Watches">Fashion &amp; Watches</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Condition *</label>
                  <select
                    value={condition}
                    onChange={e => setCondition(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Neatly Used">Neatly Used</option>
                    <option value="Fair / Working">Fair / Working</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Location *</label>
                  <select
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  >
                    <option value="Lekki, Lagos">Lekki, Lagos</option>
                    <option value="Yaba, Lagos">Yaba, Lagos</option>
                    <option value="Ikeja, Lagos">Ikeja, Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Ota, Ogun">Ota, Ogun</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Description *</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Battery health, physical condition, accessories included..."
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none resize-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Upload Photos (Up to 4 images) *</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handlePhotoSelect}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                {photoPreviews.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {photoPreviews.map((src, i) => (
                      <img key={i} src={src} alt="preview" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Trade Intent & Terms */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Trade Mode *</label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none cursor-pointer"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  >
                    <option value="Barter Only">Barter Only (Strict Item Swap)</option>
                    <option value="Cash or Swap">Cash or Swap (Cash Top-Up Allowed)</option>
                    <option value="Pawn / Quick Sale">Pawn / Quick Sale (Collateral Advance)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Estimated Market Value (₦) *</label>
                  <input
                    type="number"
                    required
                    value={estValue}
                    onChange={e => setEstValue(e.target.value)}
                    placeholder="e.g. 550000"
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>What are you looking for in exchange? *</label>
                <input
                  type="text"
                  required
                  value={wanted}
                  onChange={e => setWanted(e.target.value)}
                  placeholder="e.g. Samsung S24 Ultra OR MacBook Pro M2 OR ₦200,000 cash balance"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              {/* Dynamic Pawn Terms Panel */}
              {mode === 'Pawn / Quick Sale' && (
                <div className="p-3.5 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--dfq-amber-bg)', borderColor: 'var(--dfq-amber-border)' }}>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800 dark:text-amber-300">
                    <Calculator className="w-4 h-4" />
                    <span>Transparent Digital Pawn Terms (Fixed 10% Fee)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Advance Needed (₦)</label>
                      <input
                        type="number"
                        value={pawnAdvance}
                        onChange={e => setPawnAdvance(e.target.value)}
                        placeholder="e.g. 200000"
                        className="w-full px-2.5 py-1.5 border rounded-md outline-none bg-white dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Timeline</label>
                      <select
                        value={pawnDays}
                        onChange={e => setPawnDays(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-md outline-none bg-white dark:bg-slate-900 cursor-pointer"
                      >
                        <option value="14">14 Days Window</option>
                        <option value="21">21 Days Window</option>
                        <option value="30">30 Days Window</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-200">Total Buyback</label>
                      <div className="px-2.5 py-1.5 border rounded-md font-bold text-blue-600 bg-white dark:bg-slate-900">
                        {formatNaira(buybackTotal)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-0">
                    Settling before maturity clears the ticket and returns full certificate of ownership.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Anti-Theft & Serial Check */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>
                  Device Serial / IMEI / VIN (Anti-Theft Check)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serialImei}
                    onChange={e => setSerialImei(e.target.value)}
                    placeholder="Enter serial or 15-digit IMEI..."
                    className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none font-mono"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  />
                  <button
                    type="button"
                    onClick={handleCheckSerial}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    style={{ borderColor: 'var(--dfq-border)' }}
                  >
                    Check
                  </button>
                </div>
                {serialStatus && (
                  <div className="mt-1 text-[11px] font-semibold flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Serial clean on records.</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>
                  Purchase Receipt / Invoice (Optional &bull; Grants Verified Badge)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Listings with verified proof of purchase earn a prominent Green Trust Badge.
                </span>
              </div>

              <div className="p-3 rounded-lg border text-[11px] text-slate-500" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked required className="mt-0.5 cursor-pointer" />
                  <span>
                    I confirm I am the lawful owner of this collateral/item, it is free of encumbrances, and I agree to Anti-Theft Screening and DFQ Escrow Protection Terms.
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="pt-3 mt-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--dfq-border)' }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--dfq-border)' }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--dfq-border)' }}
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    setError('Title is required.');
                    return;
                  }
                  if (step === 2 && !wanted.trim()) {
                    setError('Please specify desired item in return.');
                    return;
                  }
                  setError('');
                  setStep(step + 1);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--dfq-primary)' }}
              >
                <span>Next: {step === 1 ? 'Trade Terms' : 'Verification'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--dfq-emerald)' }}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? 'Publishing...' : 'Publish Listing'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
