import React, { useEffect, useRef } from 'react';
import { Search, MapPin, ArrowRight, ShieldCheck, QrCode, ArrowLeftRight, Clock, Sparkles } from 'lucide-react';

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

    // Particle nodes for peer-to-peer constellation
    const nodeCount = Math.min(36, Math.floor(width / 35));
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.5 + 0.25
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0) n.x = width;
        if (n.x > width) n.x = 0;
        if (n.y < 0) n.y = height;
        if (n.y > height) n.y = 0;

        // Draw node
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(14, 165, 233, ${n.alpha * 0.7})`;
        ctx.fill();

        // Connect nearby nodes (simulating peer connections)
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n.x - n2.x;
          const dy = n.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(n2.x, n2.y);
            const lineAlpha = (1 - dist / 130) * 0.22;
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
    <section className="relative overflow-hidden pt-12 pb-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-sky-50/50 via-white to-slate-50/80 dark:from-slate-950 dark:via-[#090d16] dark:to-[#0a0f1d]">
      {/* Interactive Canvas Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-70 dark:opacity-40"
      />

      {/* Radial Ambient Sky Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Floating Interactive Trade Pills */}
      <div className="hidden lg:block absolute left-8 top-16 pointer-events-none animate-float-slow">
        <div className="px-3.5 py-2 rounded-full border border-sky-200/80 dark:border-sky-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-sky-500/5 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
          <span>iPhone 15 Pro ↔ M2 MacBook Swapped</span>
        </div>
      </div>

      <div className="hidden lg:block absolute right-12 top-20 pointer-events-none animate-float-fast">
        <div className="px-3.5 py-2 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-lg shadow-emerald-500/5 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>₦350,000 Escrow Hold Secured</span>
        </div>
      </div>

      <div className="hidden xl:block absolute right-24 bottom-14 pointer-events-none animate-float-slow">
        <div className="px-3 py-1.5 rounded-full border border-sky-200/80 dark:border-sky-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md flex items-center gap-2 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
          <QrCode className="w-3 h-3 text-sky-500" />
          <span>IMEI &amp; Serial Number Screened Clean</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center">
        {/* Sky Blue Pill Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-200 dark:border-sky-800/80 bg-sky-50/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-semibold mb-5 shadow-xs backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
          <span>Verified Peer-to-Peer Barter &amp; Digital Pawn Network</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-3xl mx-auto mb-4">
          Trade What You Have For{' '}
          <span className="bg-gradient-to-r from-sky-600 via-sky-500 to-sky-400 bg-clip-text text-transparent">
            What You Need.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          The trusted exchange for direct barter, cash-balanced item swaps, and regulated digital pawn buybacks. Every member verified, every trade protected by DFQ Escrow.
        </p>

        {/* Elevated 3-Segment Search Bar */}
        <div className="max-w-2xl mx-auto rounded-2xl p-1.5 border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-xl shadow-sky-500/5 backdrop-blur-md mb-8">
          <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
            {/* Segment 1: Search Query */}
            <div className="flex-1 flex items-center px-3.5 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <Search className="w-4 h-4 text-sky-500 shrink-0 mr-2.5" />
              <input
                type="text"
                placeholder="Search iPhone, MacBook, sofa, car, or Serial..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent border-0 outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Segment 2: Location picker */}
            <div className="flex items-center px-3 py-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 sm:w-44">
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
              className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-md shadow-sky-600/20 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>Find Trades</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Sub-Hero Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium">Escrow Hold Protection</span>
          </div>

          <button
            type="button"
            onClick={onVerifyImeiClick}
            className="flex items-center gap-1.5 border-0 bg-transparent text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer transition-colors p-0"
          >
            <span className="p-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <QrCode className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium underline decoration-sky-400/50">Anti-Theft Serial / IMEI Check</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <Clock className="w-3.5 h-3.5" />
            </span>
            <span className="font-medium">10% Fixed Buyback Pawn Formula</span>
          </div>
        </div>
      </div>
    </section>
  );
}
