import React, { useState } from 'react';
import { X, ShieldCheck, BadgeCheck, CheckCircle2, Award, Phone } from 'lucide-react';

export default function KycModal({ user, onClose, onSuccess }) {
  const [tier, setTier] = useState('2');
  const [ninBvn, setNinBvn] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [otpCode, setOtpCode] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number.');
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setDemoOtp(code);
    setOtpSent(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (tier === '2') {
      if (!otpCode || otpCode.length !== 6) {
        setError('Please enter the 6-digit OTP code.');
        setLoading(false);
        return;
      }
      if (demoOtp && otpCode !== demoOtp) {
        setError('Incorrect OTP code.');
        setLoading(false);
        return;
      }
    } else {
      if (!businessName.trim() || !businessAddress.trim()) {
        setError('Please enter business name and store address.');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: parseInt(tier, 10),
          nin_bvn: ninBvn || 'NIN-VERIFIED',
          business_name: businessName,
          business_address: businessAddress
        })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onSuccess && onSuccess(data.data.kyc_tier);
        onClose();
      } else {
        setError(data.message || 'Verification could not be approved.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-md rounded-2xl border shadow-2xl p-5 overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>Tiered Trust Verification</h3>
              <p className="text-[11px] text-slate-500 mb-0">Select your trader credential tier</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tier Selector Radio Cards */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div
            onClick={() => setTier('2')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              tier === '2'
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-xs'
                : 'bg-transparent border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-blue-700 dark:text-blue-300">
              <BadgeCheck className="w-4 h-4" />
              <span>Tier 2: Verified</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 block w-fit mb-1">
              Blue Shield Badge
            </span>
            <p className="text-[10px] text-slate-500 mb-0 leading-tight">
              Trades up to ₦1M, Escrow access, Phone OTP &amp; NIN.
            </p>
          </div>

          <div
            onClick={() => setTier('3')}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${
              tier === '3'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 shadow-xs'
                : 'bg-transparent border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs mb-1 text-amber-700 dark:text-amber-300">
              <Award className="w-4 h-4" />
              <span>Tier 3: Pro Store</span>
            </div>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 block w-fit mb-1">
              Gold Seal Badge
            </span>
            <p className="text-[10px] text-slate-500 mb-0 leading-tight">
              High-volume collateral, top priority &amp; zero escrow wait.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {tier === '2' ? (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Phone Number for OTP *</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 08031234567"
                    className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border text-blue-600 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
                {otpSent && (
                  <span className="text-[11px] text-blue-600 block mt-1 font-medium">
                    Test OTP generated: <strong>{demoOtp}</strong>
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>11-Digit NIN or BVN Number</label>
                <input
                  type="text"
                  maxLength={11}
                  value={ninBvn}
                  onChange={e => setNinBvn(e.target.value)}
                  placeholder="Enter 11-digit NIN or BVN"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none font-mono"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>6-Digit OTP Code *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none font-mono"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Business / Merchant Store Name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Gadgets Hub Nigeria"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Physical Storefront / Hub Address *</label>
                <textarea
                  rows={2}
                  required
                  value={businessAddress}
                  onChange={e => setBusinessAddress(e.target.value)}
                  placeholder="e.g. Suite 12, Computer Village, Ikeja, Lagos"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none resize-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t flex justify-end gap-2" style={{ borderColor: 'var(--dfq-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg text-xs font-medium border text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              style={{ borderColor: 'var(--dfq-border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center gap-1.5"
              style={{ backgroundColor: tier === '3' ? 'var(--dfq-amber)' : 'var(--dfq-primary)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Submitting...' : tier === '3' ? 'Activate Gold Seal' : 'Activate Blue Shield'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
