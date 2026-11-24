import React, { useState } from 'react';
import { X, Lock, Mail, Phone, MapPin, User, ArrowRight, ShieldCheck } from 'lucide-react';

export default function AuthModal({ initialMode = 'login', onClose, onSuccess }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('Lekki, Lagos');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = mode === 'login' ? { email, password } : { full_name: fullName, email, phone, location, password, ref_code: refCode };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setLoading(false);
      if (data.success && data.user) {
        onSuccess && onSuccess(data.user);
        onClose();
      } else {
        setError(data.message || 'Authentication failed.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection error. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-sm rounded-2xl border shadow-2xl p-5 overflow-hidden flex flex-col"
        style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>
              {mode === 'login' ? 'Welcome Back' : 'Create Trader Account'}
            </h3>
            <p className="text-[11px] text-slate-500 mb-0">
              {mode === 'login' ? 'Sign in to access your Trade Desk' : 'Join verified peers on DFQ Trade Crow'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-1.5 rounded-md border-0 cursor-pointer transition-all ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'bg-transparent text-slate-500'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-1.5 rounded-md border-0 cursor-pointer transition-all ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'bg-transparent text-slate-500'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="p-2.5 mb-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-700 dark:text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Okon"
                  className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Phone *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="08031234567"
                    className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
                  />
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
            </>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
              style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Password *</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs border rounded-lg outline-none"
              style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--dfq-text)' }}>Referral Code (Optional)</label>
              <input
                type="text"
                value={refCode}
                onChange={e => setRefCode(e.target.value)}
                placeholder="e.g. DFQ-XXXX"
                className="w-full px-3 py-2 text-xs border rounded-lg outline-none uppercase font-mono"
                style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              style={{ backgroundColor: 'var(--dfq-primary)' }}
            >
              <span>{loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Free Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
