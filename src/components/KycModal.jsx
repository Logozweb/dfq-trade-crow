import React, { useState } from 'react';
import { X, ShieldCheck, BadgeCheck, CheckCircle2, Award, Phone, FileText, UploadCloud, Clock } from 'lucide-react';

export default function KycModal({ user, onClose, onSuccess }) {
  const [tier, setTier] = useState('2');
  const [ninBvn, setNinBvn] = useState(user?.nin_bvn || '');
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [idType, setIdType] = useState('NIN');
  const [businessName, setBusinessName] = useState(user?.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(user?.business_address || '');
  const [cacNumber, setCacNumber] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [idPreview, setIdPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setIdFile(file);

    if (file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (ev) => setIdPreview(ev.target.result);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setIdPreview(compressed);
      };
      img.onerror = () => {
        setIdPreview(ev.target.result);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!ninBvn.trim() || ninBvn.trim().length < 8) {
      setError('Please provide a valid National Identification Number (NIN) or BVN (at least 8-11 digits).');
      setLoading(false);
      return;
    }

    if (tier === '3' && !businessName.trim()) {
      setError('Registered business or store name is required for Tier 3 Merchant status.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: parseInt(tier, 10),
          full_name: fullName,
          phone,
          nin_bvn: ninBvn.trim(),
          id_type: idType,
          id_document_data: idPreview || undefined,
          business_name: businessName,
          business_address: businessAddress,
          cac_number: cacNumber
        })
      });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Server returned error status (${res.status}). Please check your connection or file size.`);
      }
      setLoading(false);

      if (data.success) {
        setSubmitted(true);
        onSuccess && onSuccess(data.data);
      } else {
        setError(data.message || 'Verification could not be submitted.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Connection error while submitting verification.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-600 text-white shadow-sm shadow-sky-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                Trader Identity &amp; NIN Verification
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0">
                Required by compliance before posting marketplace listings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Verification Submitted for Admin Review
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
              Your details and NIN (<strong>{ninBvn}</strong>) have been submitted to our compliance desk. Once an administrator approves your verification, listing privileges will be instantly activated.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-colors"
            >
              Understood
            </button>
          </div>
        ) : (
          <>
            {/* Tier Selector */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div
                onClick={() => setTier('2')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  tier === '2'
                    ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 dark:border-sky-600 shadow-sm'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-sky-700 dark:text-sky-300">
                  <BadgeCheck className="w-4 h-4" />
                  <span>Tier 2: Trader</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200 block w-fit mb-1">
                  Blue Shield Badge
                </span>
                <p className="text-[10px] text-slate-500 mb-0 leading-tight">
                  Listings up to ₦1M, Escrow access &amp; instant barter proposals.
                </p>
              </div>

              <div
                onClick={() => setTier('3')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  tier === '3'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 dark:border-amber-600 shadow-sm'
                    : 'bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-700 dark:text-amber-300">
                  <Award className="w-4 h-4" />
                  <span>Tier 3: Pro Store</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 block w-fit mb-1">
                  Gold Seal Badge
                </span>
                <p className="text-[10px] text-slate-500 mb-0 leading-tight">
                  Verified storefront, high collateral limits &amp; zero escrow wait.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="As shown on ID"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    ID Type *
                  </label>
                  <select
                    value={idType}
                    onChange={e => setIdType(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 cursor-pointer"
                  >
                    <option value="NIN">NIN Slip</option>
                    <option value="BVN">BVN</option>
                    <option value="Voters Card">Voter's Card</option>
                    <option value="Drivers License">Driver's License</option>
                    <option value="Passport">Passport</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    NIN or BVN Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={ninBvn}
                    onChange={e => setNinBvn(e.target.value)}
                    placeholder="11-digit NIN or BVN"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none font-mono border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                  />
                </div>
              </div>

              {tier === '3' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Store / Merchant Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessName}
                      onChange={e => setBusinessName(e.target.value)}
                      placeholder="e.g. Lagos Tech Exchanges Ltd"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Physical Store Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessAddress}
                      onChange={e => setBusinessAddress(e.target.value)}
                      placeholder="e.g. 14 Computer Village, Ikeja"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                    />
                  </div>
                </>
              )}

              {/* Upload ID Document */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Upload ID Photo or NIN Slip (Optional)
                </label>
                <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-3 text-center bg-slate-50 dark:bg-slate-800/40 relative">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {idPreview ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Document attached ready for review</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                      <UploadCloud className="w-4 h-4 text-sky-500" />
                      <span>Click to upload photo of NIN / ID card</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-sky-600 hover:bg-sky-500 transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Submitting...' : 'Submit for Admin Review'}</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
