import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Phone, MapPin, User, ArrowRight, ShieldCheck, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lekki, Lagos');
  const [refCode, setRefCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [devCode, setDevCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    let timer;
    if (awaitingOtp && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [awaitingOtp, countdown]);

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: fullName, purpose: 'registration' })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        setCountdown(60);
        setSuccessMsg(`New 6-digit verification code sent to ${email}`);
        if (data.devOtpCode) setDevCode(data.devOtpCode);
      } else {
        setError(data.message || 'Failed to resend code.');
      }
    } catch (_) {
      setLoading(false);
      setError('Connection error while resending code.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (mode === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        setLoading(false);
        if (data.success && data.user) {
          onSuccess && onSuccess(data.user);
          onClose();
        } else {
          setError(data.message || 'Invalid email or password.');
        }
      } catch (err) {
        setLoading(false);
        setError('Connection error. Please try again.');
      }
      return;
    }

    // Register flow
    const payload = {
      full_name: fullName,
      email,
      phone,
      location,
      password,
      ref_code: refCode,
      otp_code: awaitingOtp ? otpCode : undefined
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);

      if (data.require_otp) {
        setAwaitingOtp(true);
        setCountdown(60);
        setSuccessMsg(data.message || 'Verification code sent to your email.');
        if (data.devOtpCode) setDevCode(data.devOtpCode);
        return;
      }

      if (data.success && data.user) {
        onSuccess && onSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                {mode === 'login' ? 'Welcome Back' : awaitingOtp ? 'Verify Your Email' : 'Create Trader Account'}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-0">
              {mode === 'login'
                ? 'Sign in to access your Trade Desk & Messages'
                : awaitingOtp
                ? `Enter 6-digit code dispatched to ${email}`
                : 'Join Nigeria’s verified peer-to-peer exchange'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 border-0 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch (only if not awaiting OTP) */}
        {!awaitingOtp && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); setSuccessMsg(''); }}
              className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                mode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                  : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Alerts */}
        {error && (
          <div className="p-3 mb-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="p-3 mb-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-sky-700 dark:text-sky-300 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {awaitingOtp ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 text-center">
                <KeyRound className="w-6 h-6 text-sky-600 dark:text-sky-400 mx-auto mb-1.5" />
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Email Verification OTP</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-0">
                  We sent a 6-digit verification code to <strong>{email}</strong>.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Enter 6-Digit Code *
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 542198"
                  className="w-full text-center text-lg tracking-widest font-mono font-bold px-3 py-2.5 border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {devCode && (
                <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>Dev Preview OTP: <strong>{devCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode(devCode)}
                    className="text-[10px] font-bold text-sky-600 underline cursor-pointer bg-transparent border-0"
                  >
                    Auto-Fill
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>{countdown > 0 ? `Resend code in ${countdown}s` : 'Didn’t get code?'}</span>
                <button
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-sky-600 dark:text-sky-400 disabled:opacity-40 disabled:cursor-not-allowed border-0 bg-transparent cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading || otpCode.length < 6}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-sky-600 hover:bg-sky-500 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying Code...' : 'Complete Registration'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAwaitingOtp(false)}
                  className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline bg-transparent border-0 cursor-pointer"
                >
                  ← Edit registration info
                </button>
              </div>
            </div>
          ) : (
            <>
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="e.g. Samuel Okon"
                      className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="08031234567"
                        className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Location *</label>
                      <select
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-xl outline-none cursor-pointer border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="Lekki, Lagos">Lekki, Lagos</option>
                        <option value="Yaba, Lagos">Yaba, Lagos</option>
                        <option value="Ikeja, Lagos">Ikeja, Lagos</option>
                        <option value="Abuja">Abuja</option>
                        <option value="Port Harcourt">Port Harcourt</option>
                        <option value="Ota, Ogun">Ota, Ogun</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={refCode}
                    onChange={e => setRefCode(e.target.value)}
                    placeholder="e.g. DFQ-XXXX"
                    className="w-full px-3 py-2 text-xs border rounded-xl outline-none uppercase font-mono border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-sky-600 hover:bg-sky-500 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In to Account' : 'Verify Email & Create Account'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
