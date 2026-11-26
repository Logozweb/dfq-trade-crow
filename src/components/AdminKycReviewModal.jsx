import React, { useState } from 'react';
import {
  X, Check, ShieldCheck, User, Mail, Phone, MapPin, Copy,
  CheckCircle2, ExternalLink, AlertTriangle, FileText, Building2,
  Calendar, Award
} from 'lucide-react';

export default function AdminKycReviewModal({ kyc, onClose, onReviewed }) {
  const defaultApproveMsg = kyc?.tier === 3
    ? 'Congratulations! Your Tier 3 Pro Storefront documents have been reviewed and approved. Your storefront badge is now live!'
    : 'Congratulations! Your NIN and BVN identity documents have been approved by compliance. You are now an active Blue Shield Verified Trader.';

  const [message, setMessage] = useState(defaultApproveMsg);
  const [copiedField, setCopiedField] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!kyc) return null;

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/kyc/${kyc.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onReviewed(`KYC #${kyc.id} for ${kyc.full_name} approved successfully!`);
        onClose();
      } else {
        setError(data.message || 'Failed to approve application.');
      }
    } catch (_) {
      setLoading(false);
      setError('Connection error while approving KYC.');
    }
  };

  const handleReject = async () => {
    if (!message.trim()) {
      setError('Please provide a disapproval reason so the applicant knows what to correct.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/kyc/${kyc.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: message.trim(), message: message.trim() })
      });
      const data = await res.json();
      setLoading(false);
      if (data.success) {
        onReviewed(`KYC #${kyc.id} for ${kyc.full_name} disapproved. Applicant notified.`);
        onClose();
      } else {
        setError(data.message || 'Failed to disapprove application.');
      }
    } catch (_) {
      setLoading(false);
      setError('Connection error while disapproving KYC.');
    }
  };

  const isPdf = (path) => path && typeof path === 'string' && path.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white shadow-sm ${
              kyc.tier === 3 ? 'bg-amber-600 shadow-amber-500/20' : 'bg-sky-600 shadow-sky-500/20'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  KYC Verification Review
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  kyc.tier === 3
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                    : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-700'
                }`}>
                  Tier {kyc.tier}: {kyc.tier === 3 ? 'Pro Storefront' : 'Verified Trader'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                Application #{kyc.id} • Submitted {new Date(kyc.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-0 bg-transparent hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Applicant Profile */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-500" />
              <span>Applicant Account Profile</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Full Legal Name</span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">{kyc.full_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{kyc.email || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{kyc.phone || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">City / State Location</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{kyc.location || '—'}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Identification Numbers */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Submitted Verification Numbers</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NIN Number */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    National Identification Number (NIN)
                  </span>
                  <span className="font-mono font-extrabold text-base text-sky-600 dark:text-sky-400 tracking-wider">
                    {kyc.nin_bvn || '—'}
                  </span>
                </div>
                {kyc.nin_bvn && (
                  <button
                    type="button"
                    onClick={() => handleCopy(kyc.nin_bvn, 'nin')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-sky-600 cursor-pointer"
                    title="Copy NIN"
                  >
                    {copiedField === 'nin' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* BVN Number */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Bank Verification Number (BVN)
                  </span>
                  <span className="font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-400 tracking-wider">
                    {kyc.bvn_number || '—'}
                  </span>
                </div>
                {kyc.bvn_number && (
                  <button
                    type="button"
                    onClick={() => handleCopy(kyc.bvn_number, 'bvn')}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                    title="Copy BVN"
                  >
                    {copiedField === 'bvn' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Tier 3 Store Details (if applicable) */}
            {kyc.tier === 3 && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Business / Store Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{kyc.business_name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">CAC Registration Number</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{kyc.cac_number || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Physical Store Address</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{kyc.business_address || '—'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Uploaded Documents */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Uploaded Identification Documents</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* NIN Card / Document Preview */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">NIN Card / NIMC Slip</span>
                  {kyc.id_document_path && (
                    <a
                      href={`/${kyc.id_document_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>Full View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {kyc.id_document_path ? (
                  isPdf(kyc.id_document_path) ? (
                    <div className="h-44 flex flex-col items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center p-4">
                      <FileText className="w-10 h-10 text-red-500 mb-2" />
                      <span className="font-semibold text-xs">PDF Document Attached</span>
                      <a
                        href={`/${kyc.id_document_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 px-3 py-1 rounded-lg bg-sky-600 text-white text-[11px] font-semibold no-underline"
                      >
                        Open PDF Document
                      </a>
                    </div>
                  ) : (
                    <div className="h-44 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <img
                        src={`/${kyc.id_document_path}`}
                        alt="NIN Card"
                        className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                        onClick={() => window.open(`/${kyc.id_document_path}`, '_blank')}
                      />
                    </div>
                  )
                ) : (
                  <div className="h-44 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-400 italic">
                    No document photo uploaded
                  </div>
                )}
              </div>

              {/* CAC Certificate (if Tier 3) */}
              {kyc.tier === 3 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">CAC Registration Doc</span>
                    {kyc.cac_document_path && (
                      <a
                        href={`/${kyc.cac_document_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>Full View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {kyc.cac_document_path ? (
                    isPdf(kyc.cac_document_path) ? (
                      <div className="h-44 flex flex-col items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center p-4">
                        <FileText className="w-10 h-10 text-red-500 mb-2" />
                        <span className="font-semibold text-xs">CAC PDF Attached</span>
                        <a
                          href={`/${kyc.cac_document_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-3 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold no-underline"
                        >
                          Open CAC Document
                        </a>
                      </div>
                    ) : (
                      <div className="h-44 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img
                          src={`/${kyc.cac_document_path}`}
                          alt="CAC Document"
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(`/${kyc.cac_document_path}`, '_blank')}
                        />
                      </div>
                    )
                  ) : (
                    <div className="h-44 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-400 italic">
                      No CAC document uploaded
                    </div>
                  )}
                </div>
              )}

              {/* Proof of Address (if Tier 3) */}
              {kyc.tier === 3 && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-900 sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Proof of Physical Address</span>
                    {kyc.proof_of_address_path && (
                      <a
                        href={`/${kyc.proof_of_address_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <span>Full View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  {kyc.proof_of_address_path ? (
                    isPdf(kyc.proof_of_address_path) ? (
                      <div className="h-40 flex flex-col items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center p-4">
                        <FileText className="w-10 h-10 text-red-500 mb-2" />
                        <span className="font-semibold text-xs">Proof of Address PDF Attached</span>
                        <a
                          href={`/${kyc.proof_of_address_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-semibold no-underline"
                        >
                          Open Address Proof
                        </a>
                      </div>
                    ) : (
                      <div className="h-44 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <img
                          src={`/${kyc.proof_of_address_path}`}
                          alt="Proof of Address"
                          className="w-full h-full object-contain cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => window.open(`/${kyc.proof_of_address_path}`, '_blank')}
                        />
                      </div>
                    )
                  ) : (
                    <div className="h-20 flex items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800/40 text-slate-400 italic">
                      No proof of address uploaded
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Compliance Decision & Applicant Communication */}
          <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-3.5 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Message to Applicant (Sent via In-App Notification &amp; Email) *
              </label>
            </div>

            <textarea
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter message or reason to communicate to the applicant..."
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-sky-500"
            />

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center font-medium mr-1">Templates:</span>
              <button
                type="button"
                onClick={() => setMessage(defaultApproveMsg)}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              >
                Approval Template
              </button>
              <button
                type="button"
                onClick={() => setMessage('NIN and BVN details did not match your registered name. Please re-check and submit matching credentials.')}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer"
              >
                NIN/BVN Mismatch
              </button>
              <button
                type="button"
                onClick={() => setMessage('The uploaded NIN card photo or slip was blurred or unreadable. Please upload a clear photo or PDF.')}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-pointer"
              >
                Blurred Document
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white border-0 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Disapprove'}</span>
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white border-0 cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Processing...' : 'Approve Application'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
