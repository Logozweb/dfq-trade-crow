import React, { useState } from 'react';
import { ShieldCheck, FileText, Lock, QrCode, Users, Printer } from 'lucide-react';

export default function TrustCenterView() {
  const [activeTab, setActiveTab] = useState('refund');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
      <div className="flex justify-between items-center pb-4 mb-6 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: 'var(--dfq-text)' }}>
            Trust, Escrow &amp; Compliance Center
          </h2>
          <p className="text-xs text-slate-500 mb-0">
            Legal policies, inspection guarantees, NDPR privacy standards, and anti-theft rules.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
          style={{ borderColor: 'var(--dfq-border)', color: 'var(--dfq-text)' }}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Policies</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6 gap-2 overflow-x-auto scrollbar-none" style={{ borderColor: 'var(--dfq-border)' }}>
        {[
          { key: 'refund', label: 'Refund & Escrow Policy' },
          { key: 'terms', label: 'Terms of Service' },
          { key: 'privacy', label: 'Privacy Policy (NDPR)' },
          { key: 'pawn', label: 'Pawn & Anti-Theft Rules' },
          { key: 'safety', label: 'Safe Meetup Guidelines' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
              activeTab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6 rounded-2xl border text-xs leading-relaxed space-y-4" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
        {activeTab === 'refund' && (
          <>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>1. Peer-to-Peer Barter &amp; Direct Physical Swaps</h4>
            <p className="text-slate-500">
              DFQ Trade Escrow facilitates structured peer-to-peer barters. For in-person swaps outside Escrow Hold, traders must physically inspect serial numbers and hardware condition prior to handover. Direct peer-to-peer swaps are final once handover is verified by both parties.
            </p>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>2. 100% Escrow Hold &amp; Inspection Guarantee</h4>
            <p className="text-slate-500">
              When cash top-ups are placed under DFQ Inspection Escrow Hold, funds remain safeguarded until physical delivery and Dual-OTP verification. If an item fails Serial/IMEI screening or differs significantly from description, buyers receive a 100% refund of the escrowed amount upon item return.
            </p>
          </>
        )}

        {activeTab === 'terms' && (
          <>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>1. Eligibility &amp; Verified Trading</h4>
            <p className="text-slate-500">
              Account creation and binding barter contracts are restricted to individuals aged 18 years and older under the laws of the Federal Republic of Nigeria.
            </p>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>2. Prohibited Goods &amp; Zero Tolerance</h4>
            <p className="text-slate-500">
              Stolen property, unverified serial electronics, counterfeit currency, firearms, and hazardous materials are strictly prohibited. Accounts attempting fraudulent trades are banned immediately.
            </p>
          </>
        )}

        {activeTab === 'privacy' && (
          <>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>NDPR &amp; Data Protection Compliance</h4>
            <p className="text-slate-500">
              Under the Nigeria Data Protection Act (NDPA), all NIN, BVN, phone OTP records, and identity files are encrypted and processed strictly for identity verification. We never sell, rent, or publicly expose your raw government identification records.
            </p>
          </>
        )}

        {activeTab === 'pawn' && (
          <>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>Digital Pawn Ticket &amp; Anti-Theft Protocol</h4>
            <p className="text-slate-500">
              Every digital pawn collateral advance carries a transparent fixed 10% fee and a 14, 21, or 30-day buyback window. Settling before the due date returns ownership certificate immediately.
            </p>
          </>
        )}

        {activeTab === 'safety' && (
          <>
            <h4 className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>Safe Meetup Protocols</h4>
            <p className="text-slate-500">
              Always conduct inspections during daylight hours in well-lit public hubs (e.g. Ikeja City Mall, Silverbird Abuja, Jabi Lake Mall, or bank premises). Never conduct unverified exchanges in secluded private residences.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
