import React, { useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  QrCode,
  ArrowLeftRight,
  Clock,
  Sparkles,
  BadgeCheck,
  Lock
} from 'lucide-react';

export default function AnimatedHeroSection({
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  onSearchSubmit,
  onVerifyImeiClick
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.offsetWidth);
    let height = (canvas.height = canvas.parentElement.offsetHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.offsetWidth;
      height = canvas.height = canvas.parentElement.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const nodeCount = Math.min(38, Math.max(14, Math.floor(width / 36)));
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.5 + 0.25
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${n.alpha * 0.65})`;
        ctx.fill();

        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            const lineAlpha = (1 - dist / 130) * 0.2;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-br from-sky-50/90 via-white to-indigo-50/50 dark:from-slate-950 dark:via-[#090e1a] dark:to-[#0c1428]">
      {/* Subtle Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.12]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(14, 165, 233, 0.28) 1px, transparent 0)',
          backgroundSize: '28px 28px'
        }}
      />

      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-65 dark:opacity-40"
      />

      {/* Ambient Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] sm:w-[760px] h-[280px] bg-sky-400/15 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="hidden sm:block absolute bottom-0 right-1/4 w-[360px] h-[200px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Interactive Trade Pills (Desktop) */}
      <div className="hidden xl:block absolute left-10 top-16 pointer-events-none animate-float-slow">
        <div className="px-3.5 py-2 rounded-full border border-sky-200/80 dark:border-sky-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-lg shadow-sky-500/10 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
          <span>iPhone 15 Pro ↔ M2 MacBook Swapped</span>
        </div>
      </div>

      <div className="hidden xl:block absolute right-10 top-20 pointer-events-none animate-float-fast">
        <div className="px-3.5 py-2 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md shadow-lg shadow-emerald-500/10 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>₦350,000 Escrow Hold Secured</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        {/* Top Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-200/90 dark:border-sky-800/80 bg-white/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px] sm:text-xs font-semibold mb-5 shadow-xs backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>DFQ Trade Escrow • Verified P2P Barter &amp; Digital Pawn</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12] max-w-3xl mx-auto mb-4">
          Swap, Barter &amp; Pawn{' '}
          <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent">
            With Zero Guesswork.
          </span>
        </h1>

        <p className="text-sm sm:text-base md:text-[17px] text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-7 sm:mb-8 px-1">
          The trusted exchange for direct barter, cash-balanced item swaps, and regulated digital pawn buybacks. Every member NIN-verified, every trade protected by{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-100">DFQ Trade Escrow</span>.
        </p>

        {/* Elevated 3-Segment Search Bar */}
        <div className="max-w-2xl mx-auto rounded-2xl p-1.5 sm:p-2 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-sky-500/10 backdrop-blur-md mb-6 sm:mb-8">
          <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 sm:gap-2">
            {/* Segment 1: Search Query */}
            <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 focus-within:border-sky-400 dark:focus-within:border-sky-600 transition-colors">
              <Search className="w-4 h-4 text-sky-500 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Search iPhone, MacBook, car, or Serial..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-0 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Segment 2: Location picker */}
            <div className="flex items-center px-3 py-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 sm:w-44">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
              <select
                value={selectedLocation}
                onChange={e => setSelectedLocation(e.target.value)}
                className="w-full text-xs bg-transparent border-0 outline-none text-slate-700 dark:text-slate-200 cursor-pointer font-medium"
              >
                <option value="all">All Locations</option>
                <option value="Lekki, Lagos">Lekki, Lagos</option>
                <option value="Ikeja, Lagos">Ikeja, Lagos</option>
                <option value="Yaba, Lagos">Yaba, Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Port Harcourt">Port Harcourt</option>
              </select>
            </div>

            {/* Segment 3: Submit Button */}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white border-0 cursor-pointer shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Find Trades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sub-Hero Trust & Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs">
            <span className="p-2 rounded-lg bg-emerald-100/80 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Lock className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Escrow Hold Protection</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Funds held until handover</div>
            </div>
          </div>

          <button
            type="button"
            onClick={onVerifyImeiClick}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 hover:border-sky-300 dark:hover:border-sky-700 backdrop-blur-sm shadow-xs cursor-pointer transition-all text-left"
          >
            <span className="p-2 rounded-lg bg-sky-100/80 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 shrink-0">
              <QrCode className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">Anti-Theft IMEI Check</div>
              <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium truncate">Screen any device free →</div>
            </div>
          </button>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm shadow-xs">
            <span className="p-2 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 shrink-0">
              <BadgeCheck className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">10% Fixed Pawn Formula</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Transparent buyback terms</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
