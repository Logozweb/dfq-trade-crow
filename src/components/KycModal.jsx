import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, BadgeCheck, CheckCircle2, Award, Phone, FileText, UploadCloud, Clock, AlertTriangle, ArrowUpRight, Sparkles, Building2, MapPin } from 'lucide-react';

export default function KycModal({ user, onClose, onSuccess }) {
  const [kycData, setKycData] = useState(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);

  // Form states
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

  // Upgrade form toggle (for approved Tier 2 traders)
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/kyc/status')
      .then(r => r.json())
      .then(json => {
        if (isMounted && json.success) {
          const d = json.data || json;
          setKycData(d);
          if (d.verification) {
            if (d.verification.full_name) setFullName(d.verification.full_name);
            if (d.verification.phone) setPhone(d.verification.phone);
            if (d.verification.nin_bvn) setNinBvn(d.verification.nin_bvn);
            if (d.verification.business_name) setBusinessName(d.verification.business_name);
            if (d.verification.business_address) setBusinessAddress(d.verification.business_address);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setFetchingStatus(false);
      });
    return () => { isMounted = false; };
  }, []);

  const currentStatus = kycData?.kyc_status || user?.kyc_status || 'unverified';
  const currentTier = Number(kycData?.kyc_tier || user?.kyc_tier || 1);
  const verification = kycData?.verification;

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

    const targetTier = showUpgradeForm || currentStatus === 'approved' ? 3 : parseInt(tier, 10);

    if (targetTier !== 3 && (!ninBvn.trim() || ninBvn.trim().length < 8)) {
      setError('Please provide a valid National Identification Number (NIN) or BVN (at least 8-11 digits).');
      setLoading(false);
      return;
    }

    if (targetTier === 3 && !businessName.trim()) {
      setError('Registered business or store name is required for Tier 3 Merchant status.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/kyc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: targetTier,
          full_name: fullName || user?.full_name || 'Trader',
          phone: phone || user?.phone || '',
          nin_bvn: (ninBvn || user?.nin_bvn || 'VERIFIED').trim(),
          id_type: idType,
          id_document_data: idPreview || undefined,
          business_name: businessName.trim(),
          business_address: businessAddress.trim(),
          cac_number: cacNumber.trim()
        })
      });
      let data;
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(`Server returned error status (${res.status}). Please check your connection.`);
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
      <div className="w-full max-w-md rounded-2xl border shadow-2xl p-6 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl text-white shadow-sm ${
              currentStatus === 'approved'
                ? 'bg-emerald-600 shadow-emerald-500/20'
                : currentStatus === 'pending_review'
                ? 'bg-amber-600 shadow-amber-500/20'
                : 'bg-sky-600 shadow-sky-500/20'
            }`}>
              {currentStatus === 'approved' ? (
                <BadgeCheck className="w-4 h-4" />
              ) : currentStatus === 'pending_review' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                {currentStatus === 'approved'
                  ? showUpgradeForm ? 'Upgrade to Tier 3 Pro Storefront' : 'Verified Trader Profile'
                  : currentStatus === 'pending_review'
                  ? 'Identity Verification Under Review'
                  : 'Trader Identity & NIN Verification'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0">
                {currentStatus === 'approved'
                  ? showUpgradeForm ? 'Submit business details to unlock high-volume merchant tier' : 'Your DFQ trust credentials and trade tier'
                  : currentStatus === 'pending_review'
                  ? 'Your submission is queued with the compliance desk'
                  : 'Required by compliance before posting marketplace listings'}
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

        {/* 1. STATE: SUBMITTED (JUST NOW) OR ALREADY PENDING REVIEW */}
        {(submitted || (currentStatus === 'pending_review' && !showUpgradeForm)) ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
              <Clock className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 mb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>Under Review by Compliance Desk</span>
              </div>
              <h4 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                Your Details Have Been Submitted
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                We have received your verification application. An administrator is currently reviewing your documents and NIN/BVN records.
              </p>
            </div>

            {/* Submission Summary Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs space-y-2">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Target Tier:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Tier {verification?.tier || user?.kyc_tier || 2} ({verification?.tier === 3 ? 'Pro Storefront' : 'Verified Trader'})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Legal Name:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {verification?.full_name || user?.full_name || 'Trader'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>ID Document / Slip:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {verification?.id_type || 'NIN Slip'} ({verification?.id_document_path ? 'Attached' : 'Information only'})
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Submitted On:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(verification?.created_at || Date.now()).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              You will receive an in-app notification once the review is completed. Marketplace listing will be enabled automatically upon approval.
            </p>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-colors"
            >
              Understood
            </button>
          </div>
        ) : currentStatus === 'approved' && !showUpgradeForm ? (
          /* 2. STATE: APPROVED (TIER 2 OR TIER 3) */
          <div className="py-2 space-y-4">
            {/* Verified Status Banner */}
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 m-0">
                    {currentTier >= 3 ? 'Tier 3 Pro Storefront Verified' : 'Tier 2 Verified Trader'}
                  </h4>
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {currentTier >= 3 ? 'Gold Seal Merchant Badge Active' : 'Blue Shield Badge Active'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 mb-0 leading-relaxed">
                {currentTier >= 3
                  ? 'Your account is certified as a verified storefront with unlimited listing valuation, zero escrow wait, and prominent gold merchant badges.'
                  : 'Your NIN identity has been verified by administration. You are approved to publish listings up to ₦1,000,000 and propose barter swaps with escrow protection.'}
              </p>
            </div>

            {/* Unlocked Privileges */}
            <div className="space-y-1.5 text-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Active Privileges
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Marketplace product posting enabled</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Trade desk &amp; peer-to-peer barter proposals</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>DFQ dual-OTP escrow hold &amp; release</span>
              </div>
            </div>

            {/* Upgrade Option for Tier 2 */}
            {currentTier < 3 ? (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/30">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900 dark:text-amber-200">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Tier 3: Pro Storefront Upgrade</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    Gold Seal
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/80 mb-3 leading-relaxed">
                  Have a registered business or physical retail store? Upgrade to unlock unlimited collateral listings and featured storefront visibility.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowUpgradeForm(true);
                    setTier('3');
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Apply for Tier 3 Pro Storefront</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-0 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        ) : showUpgradeForm ? (
          /* 3. STATE: UPGRADE TO TIER 3 FORM */
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs">
              <div className="font-bold text-amber-900 dark:text-amber-200 mb-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Tier 3 Pro Storefront / Pawn Merchant</span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mb-0">
                Provide your commercial store information below. Our team verifies your registered store address within 24 hours.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Registered Store / Business Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Gadgets &amp; Phones Ltd"
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Physical Store Address *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="e.g. Shop B12, Computer Village, Ikeja, Lagos"
                  className="w-full pl-9 pr-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                CAC Business Registration Number (Optional)
              </label>
              <input
                type="text"
                value={cacNumber}
                onChange={e => setCacNumber(e.target.value)}
                placeholder="RC / BN Number (e.g. BN-1234567)"
                className="w-full px-3 py-2 text-xs border rounded-xl outline-none font-mono border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Storefront Photo or CAC Certificate (Optional)
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
                    <span>Store document attached ready for review</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                    <UploadCloud className="w-4 h-4 text-amber-500" />
                    <span>Upload storefront signage photo or CAC certificate</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUpgradeForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-amber-600 hover:bg-amber-500 transition-all flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting Upgrade...' : 'Submit Tier 3 Upgrade'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* 4. STATE: UNVERIFIED OR REJECTED (INITIAL APPLICATION FORM) */
          <>
            {/* Rejection notice if previously rejected */}
            {currentStatus === 'rejected' && (
              <div className="p-3 mb-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs">
                <div className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1.5 mb-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Previous Application Not Approved</span>
                </div>
                <p className="text-red-700 dark:text-red-400 mb-0">
                  {verification?.rejection_reason || 'Please ensure your NIN / ID matches your legal name and the document photo is clear before re-submitting.'}
                </p>
              </div>
            )}

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
