import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ArrowLeftRight,
  MessageSquare,
  Search,
  MapPin,
  Star,
  Plus,
  Moon,
  Sun,
  LogOut,
  User,
  Clock,
  Sparkles,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Eye,
  Heart,
  Store,
  Kanban,
  FileText,
  BadgeCheck,
  ChevronRight,
  Lock,
  Calculator,
  Gift
} from 'lucide-react';

import ItemDetailModal from './components/ItemDetailModal';
import SwapModal from './components/SwapModal';
import PostWizardModal from './components/PostWizardModal';
import KycModal from './components/KycModal';
import AuthModal from './components/AuthModal';
import TradeDeskView from './components/TradeDeskView';
import StorefrontView from './components/StorefrontView';
import TrustCenterView from './components/TrustCenterView';

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('marketplace'); // 'marketplace' | 'tradedesk' | 'storefront' | 'trust'
  const [storefrontId, setStorefrontId] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dfq_favs') || '[]');
    } catch {
      return [];
    }
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dfq_theme_mode') || 'light';
  });

  // Modal / Drawer States
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [showPostWizard, setShowPostWizard] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialQuery, setSerialQuery] = useState('');
  const [serialResult, setSerialResult] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(null); // 'login' | 'register' | null
  const [referralBanner, setReferralBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('dfq_theme_mode', theme);
  }, [theme]);

  // Check Session
  const refreshUser = () => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Fetch Items
  const loadItems = () => {
    setLoading(true);
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.items)) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  // Check Referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      fetch(`/api/auth/referral-info?code=${encodeURIComponent(refCode)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setReferralBanner(data.data);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Toggle Favorite
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('dfq_favs', JSON.stringify(next));
      return next;
    });
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedMode === 'favorites') {
        if (!favorites.includes(Number(item.id))) return false;
      } else if (selectedMode !== 'all' && item.mode !== selectedMode) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedLocation !== 'all' && item.location !== selectedLocation) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (item.title || '').toLowerCase().includes(q);
        const wantedMatch = (item.wanted || '').toLowerCase().includes(q);
        const descMatch = (item.description || '').toLowerCase().includes(q);
        const serialMatch = (item.serial_imei || '').toLowerCase().includes(q);
        if (!titleMatch && !wantedMatch && !descMatch && !serialMatch) return false;
      }
      return true;
    });
  }, [items, selectedMode, selectedCategory, selectedLocation, searchQuery, favorites]);

  // Open Chat Drawer
  const openChatFor = (item) => {
    setActiveChat({
      itemId: item.id,
      otherUserId: item.user_id,
      itemTitle: item.title,
      itemImage: item.image_path,
      ownerName: item.owner_name || 'Item Owner',
      mode: item.mode
    });
    fetch(`/api/messages/thread?item_id=${item.id}&other_user_id=${item.user_id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.messages)) {
          setChatMessages(data.messages);
        } else {
          setChatMessages([]);
        }
      })
      .catch(() => setChatMessages([]));
  };

  const sendChatMessage = (text) => {
    if (!text.trim() || !activeChat) return;
    if (!user) {
      setShowAuthModal('login');
      return;
    }
    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: activeChat.itemId,
        recipient_id: activeChat.otherUserId,
        message: text.trim()
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChatMessages(prev => [
            ...prev,
            {
              id: data.data.message_id || Date.now(),
              sender_id: user.id,
              sender_name: user.full_name,
              message: text.trim(),
              created_at: new Date().toISOString()
            }
          ]);
          setChatInput('');
        }
      })
      .catch(() => {});
  };

  const formatNaira = (val) => {
    return '₦' + Number(val || 0).toLocaleString('en-NG');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200" style={{ backgroundColor: 'var(--dfq-bg)', color: 'var(--dfq-text)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-slate-900 text-white text-xs shadow-xl flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer font-bold">&times;</button>
        </div>
      )}

      {/* =========================================================================
          1. CRISP TOP NAVIGATION (Turing-Inspired)
          ========================================================================= */}
      <nav className="sticky top-0 z-40 border-b backdrop-blur-md transition-colors" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)', height: '64px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('marketplace')}
              className="flex items-center gap-2.5 bg-transparent border-0 text-left cursor-pointer p-0"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--dfq-primary)' }}>
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--dfq-text)' }}>DFQ</span>
                <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--dfq-primary)' }}>Trade Crow</span>
                <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full border" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)', color: 'var(--dfq-text-muted)' }}>
                  Verified P2P
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveView('marketplace')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
                activeView === 'marketplace'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Marketplace
            </button>
            <button
              onClick={() => setActiveView('tradedesk')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
                activeView === 'tradedesk'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Kanban className="w-4 h-4 text-slate-400" />
              Trade Desk
            </button>
            <button
              onClick={() => setShowSerialModal(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <QrCode className="w-4 h-4 text-slate-400" />
              Verify IMEI
            </button>
            <button
              onClick={() => setActiveView('trust')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer flex items-center gap-1.5 transition-all ${
                activeView === 'trust'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 font-semibold'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Trust &amp; Escrow
            </button>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* KYC Badge Button */}
            <button
              onClick={() => {
                if (!user) setShowAuthModal('login');
                else setShowKycModal(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-all"
              style={{
                backgroundColor: Number(user?.kyc_tier) === 3 ? 'var(--dfq-amber-bg)' : Number(user?.kyc_tier) === 2 ? 'var(--dfq-primary-light)' : 'var(--dfq-surface-subtle)',
                borderColor: Number(user?.kyc_tier) === 3 ? 'var(--dfq-amber-border)' : Number(user?.kyc_tier) === 2 ? 'var(--dfq-primary-border)' : 'var(--dfq-border)',
                color: Number(user?.kyc_tier) === 3 ? 'var(--dfq-amber)' : Number(user?.kyc_tier) === 2 ? 'var(--dfq-primary)' : 'var(--dfq-text-muted)'
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>{Number(user?.kyc_tier) === 3 ? 'Gold Seal Pro' : Number(user?.kyc_tier) === 2 ? 'Blue Shield' : 'Verify KYC'}</span>
            </button>

            {/* Post Listing CTA */}
            <button
              onClick={() => {
                if (!user) setShowAuthModal('login');
                else setShowPostWizard(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-lg border-0 cursor-pointer text-white shadow-sm transition-all"
              style={{ backgroundColor: 'var(--dfq-primary)' }}
            >
              <Plus className="w-4 h-4" />
              <span>Post Listing</span>
            </button>

            {/* Auth Buttons / Profile */}
            {user ? (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="text-xs font-semibold px-2 py-1 rounded-md border" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
                  {user.full_name?.split(' ')[0]}
                </span>
                <button
                  onClick={() => {
                    fetch('/api/auth/logout').then(() => setUser(null));
                  }}
                  title="Log out"
                  className="p-1.5 rounded-md border cursor-pointer hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all"
                  style={{ borderColor: 'var(--dfq-border)' }}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-1">
                <button
                  onClick={() => setShowAuthModal('login')}
                  className="text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg border-0 bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowAuthModal('register')}
                  className="text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg border bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-all"
              style={{ borderColor: 'var(--dfq-border)' }}
              title="Toggle Dark / Light Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================================================
          VIEW SWITCHER
          ========================================================================= */}
      {activeView === 'tradedesk' && (
        <TradeDeskView user={user} onOpenChat={openChatFor} />
      )}

      {activeView === 'storefront' && (
        <StorefrontView traderId={storefrontId} onBack={() => setActiveView('marketplace')} onOpenChat={openChatFor} />
      )}

      {activeView === 'trust' && (
        <TrustCenterView />
      )}

      {/* =========================================================================
          2. HERO SECTION & ELEVATED SEARCH CONSOLE (For Marketplace)
          ========================================================================= */}
      {activeView === 'marketplace' && (
        <header className="border-b transition-colors py-10 sm:py-14" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            {/* Top Minimal Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4 border" style={{ backgroundColor: 'var(--dfq-primary-light)', borderColor: 'var(--dfq-primary-border)', color: 'var(--dfq-primary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified P2P Barter, Collateral Advances &amp; Dual-OTP Escrow</span>
            </div>

            {/* Confident Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-3" style={{ color: 'var(--dfq-text)' }}>
              Trade What You Have for <span style={{ color: 'var(--dfq-primary)' }}>What You Need.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base max-w-2xl mx-auto mb-8" style={{ color: 'var(--dfq-text-muted)' }}>
              Exchange electronics, laptops, vehicles, or appliances directly with verified traders. Access transparent 10% collateral advances with printable pawn tickets.
            </p>

            {/* Unified Turing-Style Search Console */}
            <div className="border rounded-xl p-1.5 shadow-sm transition-all text-left mb-6" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                {/* Search Text */}
                <div className="sm:col-span-6 flex items-center px-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: 'var(--dfq-border)' }}>
                  <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search iPhone, MacBook, couch, or Serial/IMEI..."
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm"
                    style={{ color: 'var(--dfq-text)' }}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Location Select */}
                <div className="sm:col-span-3 flex items-center px-3 border-b sm:border-b-0 sm:border-r" style={{ borderColor: 'var(--dfq-border)' }}>
                  <MapPin className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={e => setSelectedLocation(e.target.value)}
                    className="w-full bg-transparent border-0 outline-none py-2 text-sm cursor-pointer"
                    style={{ color: 'var(--dfq-text)' }}
                  >
                    <option value="all">All Locations</option>
                    <option value="Lekki, Lagos">Lekki, Lagos</option>
                    <option value="Yaba, Lagos">Yaba, Lagos</option>
                    <option value="Ikeja, Lagos">Ikeja, Lagos</option>
                    <option value="Abuja">Abuja</option>
                    <option value="Ota, Ogun">Ota, Ogun</option>
                  </select>
                </div>

                {/* Submit Action */}
                <div className="sm:col-span-3">
                  <button
                    onClick={() => {
                      const el = document.getElementById('marketplace-feed');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="w-full py-2.5 px-4 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 border-0 cursor-pointer shadow-sm transition-all"
                    style={{ backgroundColor: 'var(--dfq-primary)' }}
                  >
                    <Search className="w-4 h-4" />
                    <span>Find Trades</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-medium" style={{ color: 'var(--dfq-text-muted)' }}>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>100% Escrow Hold Protection</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                <span>Anti-Theft Serial / IMEI Screened</span>
              </div>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">&bull;</span>
              <div className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-blue-600" />
                <span>10% Fixed Digital Buyback Formula</span>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* =========================================================================
          3. MAIN MARKETPLACE CONTENT AREA
          ========================================================================= */}
      {activeView === 'marketplace' && (
        <main id="marketplace-feed" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
          {/* Referral Recognition Banner */}
          {referralBanner && (
            <div className="mb-6 p-4 rounded-xl border flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: 'var(--dfq-primary-light)', borderColor: 'var(--dfq-primary-border)' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>
                    You were invited by {referralBanner.inviter_name}!
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--dfq-text-muted)' }}>
                    Sign up today to unlock <strong>1 Free Spotlight Boost</strong> and verified trading privileges.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAuthModal('register')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white border-0 cursor-pointer shadow-sm"
                style={{ backgroundColor: 'var(--dfq-primary)' }}
              >
                Claim Credit
              </button>
            </div>
          )}

          {/* Trade Mode Segmented Control & Item Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { key: 'all', label: 'All Listings' },
                { key: 'Barter Only', label: 'Direct Barter' },
                { key: 'Cash or Swap', label: 'Cash or Swap' },
                { key: 'Pawn / Quick Sale', label: 'Digital Pawn' },
                { key: 'favorites', label: `Saved (${favorites.length})` }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedMode(tab.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer whitespace-nowrap transition-all ${
                    selectedMode === tab.key
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-blue-600 dark:border-blue-600'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="text-xs font-medium" style={{ color: 'var(--dfq-text-muted)' }}>
              Showing <strong style={{ color: 'var(--dfq-text)' }}>{filteredItems.length}</strong> active trades
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b scrollbar-none" style={{ borderColor: 'var(--dfq-border)' }}>
            {[
              'all',
              'Electronics & Phones',
              'Furniture',
              'Home Appliances',
              'Vehicles & Bikes',
              'Fashion & Watches'
            ].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border-0 cursor-pointer whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                    : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Grid of Clean Item Cards */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 border rounded-2xl p-6" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--dfq-text)' }}>No matching items found</h3>
              <p className="text-xs mb-4 max-w-sm mx-auto" style={{ color: 'var(--dfq-text-muted)' }}>
                Try loosening your filters or post the item you wish to trade with other verified members.
              </p>
              <button
                onClick={() => {
                  setSelectedMode('all');
                  setSelectedCategory('all');
                  setSelectedLocation('all');
                  setSearchQuery('');
                }}
                className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                style={{ borderColor: 'var(--dfq-border)' }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => {
                const isFav = favorites.includes(Number(item.id));
                const isReceipt = Boolean(item.receipt_path);
                const isSpotlight = Number(item.is_featured) === 1;

                return (
                  <article
                    key={item.id}
                    className="border rounded-xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group"
                    style={{ backgroundColor: 'var(--dfq-surface)', borderColor: isSpotlight ? 'var(--dfq-primary-border)' : 'var(--dfq-border)' }}
                  >
                    {/* Media Thumbnail Container */}
                    <div
                      className="relative h-48 w-full cursor-pointer overflow-hidden bg-slate-100 dark:bg-slate-800"
                      onClick={() => setActiveDetailItem(item)}
                    >
                      <img
                        src={item.image_path}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        onError={e => {
                          e.target.src = 'assets/img/couch.svg';
                        }}
                      />

                      {/* Trade Mode Pill */}
                      <span
                        className="absolute top-2.5 left-2.5 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm border tracking-wide uppercase"
                        style={{
                          backgroundColor: item.mode === 'Barter Only' ? 'var(--dfq-primary-light)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple-bg)' : 'var(--dfq-amber-bg)',
                          borderColor: item.mode === 'Barter Only' ? 'var(--dfq-primary-border)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple-border)' : 'var(--dfq-amber-border)',
                          color: item.mode === 'Barter Only' ? 'var(--dfq-primary)' : item.mode === 'Cash or Swap' ? 'var(--dfq-purple)' : 'var(--dfq-amber)'
                        }}
                      >
                        {item.mode}
                      </span>

                      {/* Favorite Button */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          toggleFavorite(Number(item.id));
                        }}
                        className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md border cursor-pointer transition-all ${
                          isFav ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white/80 dark:bg-slate-900/80 border-white/60 dark:border-slate-700 text-slate-500 hover:text-red-600'
                        }`}
                        title="Save to favorites"
                      >
                        <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                      </button>

                      {/* Bottom Tags */}
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                        {isReceipt ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1">
                            <BadgeCheck className="w-3 h-3" />
                            Receipt Verified
                          </span>
                        ) : <span />}
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-slate-700">
                          {item.item_condition}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Location & Trader Rating */}
                      <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: 'var(--dfq-text-muted)' }}>
                        <span className="flex items-center gap-1 truncate max-w-[65%]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </span>
                        <button
                          onClick={() => {
                            setStorefrontId(item.user_id || 1);
                            setActiveView('storefront');
                          }}
                          className="flex items-center gap-1 font-semibold text-xs border-0 bg-transparent cursor-pointer hover:underline text-amber-600 dark:text-amber-400"
                        >
                          <Star className="w-3 h-3 fill-current" />
                          <span>{item.owner_rating || '5.0'}</span>
                          <span className="text-slate-400 font-normal">({item.review_count || 12})</span>
                        </button>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => setActiveDetailItem(item)}
                        className="text-sm sm:text-base font-bold tracking-tight mb-1.5 cursor-pointer hover:text-blue-600 line-clamp-1"
                        style={{ color: 'var(--dfq-text)' }}
                      >
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs line-clamp-2 mb-3 flex-1" style={{ color: 'var(--dfq-text-muted)' }}>
                        {item.description}
                      </p>

                      {/* Desired Exchange Box */}
                      <div className="rounded-lg p-2.5 mb-3 border text-xs" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
                        <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: 'var(--dfq-text-muted)' }}>
                          <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                          <span>Owner Wants in Return</span>
                        </div>
                        <div className="font-semibold line-clamp-1" style={{ color: 'var(--dfq-text)' }}>
                          {item.wanted}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--dfq-border)' }}>
                        <div>
                          <span className="text-[10px] block font-medium" style={{ color: 'var(--dfq-text-muted)' }}>Est. Valuation</span>
                          <span className="text-sm font-bold" style={{ color: 'var(--dfq-text)' }}>{formatNaira(item.est_value)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openChatFor(item)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                            style={{ borderColor: 'var(--dfq-border)', color: 'var(--dfq-text)' }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                            <span>Inquire</span>
                          </button>
                          <button
                            onClick={() => {
                              if (!user) setShowAuthModal('login');
                              else setActiveSwapItem(item);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white border-0 cursor-pointer shadow-sm flex items-center gap-1 transition-all"
                            style={{ backgroundColor: 'var(--dfq-primary)' }}
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* =========================================================================
          4. IN-APP MESSAGES DRAWER
          ========================================================================= */}
      {activeChat && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md h-full flex flex-col shadow-2xl border-l transition-transform" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
            {/* Header */}
            <div className="p-3.5 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--dfq-surface-subtle)', borderColor: 'var(--dfq-border)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={activeChat.itemImage} alt="" className="w-10 h-10 rounded-lg object-cover border" style={{ borderColor: 'var(--dfq-border)' }} />
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold truncate mb-0.5" style={{ color: 'var(--dfq-text)' }}>
                    {activeChat.itemTitle}
                  </h4>
                  <div className="text-[11px] text-slate-500 truncate">
                    Chatting with <span className="font-semibold text-slate-700 dark:text-slate-300">{activeChat.ownerName}</span> &bull; {activeChat.mode}
                  </div>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="p-1 rounded-md text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Escrow Advisory Banner */}
            <div className="p-2.5 mx-3 mt-3 rounded-lg border text-xs flex items-center gap-2" style={{ backgroundColor: 'var(--dfq-primary-light)', borderColor: 'var(--dfq-primary-border)', color: 'var(--dfq-primary)' }}>
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <div className="text-[11px] leading-tight">
                <strong>Safe Trade Shield:</strong> Always conduct inspection in public hubs and verify handover via Dual-OTP Escrow.
              </div>
            </div>

            {/* Quick Chips */}
            <div className="px-3 pt-2.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {[
                'Still available for trade?',
                'What is the battery health / condition?',
                'Are you open to swap + cash top-up?',
                'Can we schedule a meetup at a public hub?'
              ].map(chip => (
                <button
                  key={chip}
                  onClick={() => sendChatMessage(chip)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap cursor-pointer hover:bg-blue-50 dark:hover:bg-slate-800 transition-all"
                  style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)', color: 'var(--dfq-text-muted)' }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Messages Thread */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No messages exchanged yet. Send a question below.
                </div>
              ) : (
                chatMessages.map(msg => {
                  const isMe = user && Number(msg.sender_id) === Number(user.id);
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isMe
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={e => {
                e.preventDefault();
                sendChatMessage(chatInput);
              }}
              className="p-3 border-t flex items-center gap-2"
              style={{ borderColor: 'var(--dfq-border)', backgroundColor: 'var(--dfq-surface)' }}
            >
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about condition, trade, or meetup..."
                className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none"
                style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border-strong)', color: 'var(--dfq-text)' }}
              />
              <button
                type="submit"
                className="p-2 rounded-lg text-white border-0 cursor-pointer shadow-sm"
                style={{ backgroundColor: 'var(--dfq-primary)' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* Detail Modal */}
      {activeDetailItem && (
        <ItemDetailModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
          onOpenChat={openChatFor}
          onOpenSwap={item => {
            if (!user) setShowAuthModal('login');
            else setActiveSwapItem(item);
          }}
        />
      )}

      {/* Swap Proposal Modal */}
      {activeSwapItem && (
        <SwapModal
          targetItem={activeSwapItem}
          user={user}
          onClose={() => setActiveSwapItem(null)}
          onSuccess={msg => {
            setToastMessage(msg);
            loadItems();
          }}
        />
      )}

      {/* Post Listing Wizard Modal */}
      {showPostWizard && (
        <PostWizardModal
          user={user}
          onClose={() => setShowPostWizard(false)}
          onSuccess={msg => {
            setToastMessage(msg);
            loadItems();
          }}
        />
      )}

      {/* KYC Modal */}
      {showKycModal && (
        <KycModal
          user={user}
          onClose={() => setShowKycModal(false)}
          onSuccess={tierNum => {
            setToastMessage(`Tier ${tierNum} Verification Activated!`);
            refreshUser();
          }}
        />
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialMode={showAuthModal}
          onClose={() => setShowAuthModal(null)}
          onSuccess={u => {
            setUser(u);
            setToastMessage(`Welcome back, ${u.full_name}!`);
          }}
        />
      )}

      {/* Serial Check Modal */}
      {showSerialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border p-5 shadow-xl" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
            <div className="flex items-center justify-between mb-3 pb-2 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--dfq-text)' }}>
                <QrCode className="w-4 h-4 text-blue-600" />
                <span>Verify Device Serial / IMEI</span>
              </div>
              <button onClick={() => setShowSerialModal(false)} className="text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs mb-3 text-slate-500">
              Screen smartphones, laptops, consoles, and vehicles against DFQ anti-theft records before committing to a swap.
            </p>
            <form
              onSubmit={e => {
                e.preventDefault();
                if (!serialQuery.trim()) return;
                fetch(`/api/items.php?action=check_serial&serial=${encodeURIComponent(serialQuery.trim())}`)
                  .then(r => r.json())
                  .then(data => setSerialResult(data))
                  .catch(() => {});
              }}
              className="flex items-center gap-2 mb-3"
            >
              <input
                type="text"
                value={serialQuery}
                onChange={e => setSerialQuery(e.target.value)}
                placeholder="Enter 15-digit IMEI or serial..."
                className="flex-1 px-3 py-2 text-xs border rounded-lg outline-none"
                style={{ borderColor: 'var(--dfq-border-strong)', backgroundColor: 'var(--dfq-surface)', color: 'var(--dfq-text)' }}
              />
              <button type="submit" className="px-3.5 py-2 text-xs font-semibold rounded-lg text-white border-0 cursor-pointer" style={{ backgroundColor: 'var(--dfq-primary)' }}>
                Scan
              </button>
            </form>
            {serialResult && (
              <div className="p-3 rounded-lg border text-xs" style={{ backgroundColor: serialResult.flagged ? 'var(--dfq-danger-bg)' : 'var(--dfq-emerald-bg)', borderColor: serialResult.flagged ? 'var(--dfq-danger-border)' : 'var(--dfq-emerald-border)' }}>
                {serialResult.flagged ? (
                  <div className="text-red-700 dark:text-red-400 font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>WARNING: This Serial/IMEI has been reported flagged or stolen. Do NOT proceed!</span>
                  </div>
                ) : (
                  <div className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Clean Record: Zero theft reports found on DFQ Trade Crow records.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          6. FOOTER
          ========================================================================= */}
      <footer className="border-t py-10 transition-colors mt-auto" style={{ backgroundColor: 'var(--dfq-surface)', borderColor: 'var(--dfq-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b" style={{ borderColor: 'var(--dfq-border)' }}>
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-base mb-2" style={{ color: 'var(--dfq-text)' }}>
                <div className="w-6 h-6 rounded flex items-center justify-center text-white font-bold" style={{ backgroundColor: 'var(--dfq-primary)' }}>
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <span>DFQ Trade Crow</span>
              </div>
              <p className="text-xs max-w-sm" style={{ color: 'var(--dfq-text-muted)' }}>
                Nigeria's verified peer-to-peer barter, cash-top-up, and receipt-verified digital pawn marketplace. Backed by inspection hold escrow and anti-theft screening.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--dfq-text)' }}>Marketplace</h5>
              <ul className="space-y-1.5 text-xs list-none p-0" style={{ color: 'var(--dfq-text-muted)' }}>
                <li><button onClick={() => { setActiveView('marketplace'); setSelectedMode('all'); }} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Browse All Swaps</button></li>
                <li><button onClick={() => setShowPostWizard(true)} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Post a Listing</button></li>
                <li><button onClick={() => setActiveView('tradedesk')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">My Trade Desk</button></li>
                <li><button onClick={() => setShowSerialModal(true)} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Anti-Theft IMEI Verifier</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--dfq-text)' }}>Trust &amp; Legal</h5>
              <ul className="space-y-1.5 text-xs list-none p-0" style={{ color: 'var(--dfq-text-muted)' }}>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Escrow &amp; Refund Policy</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Anti-Theft Regulations</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">NDPR Privacy Compliance</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-blue-600 cursor-pointer">Safe Meetup Guidelines</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-3" style={{ color: 'var(--dfq-text-muted)' }}>
            <span>&copy; {new Date().getFullYear()} DFQ Trade Crow Systems Ltd. All rights reserved.</span>
            <span>Operating under Federal Republic of Nigeria Trade &amp; Collateral Regulations.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
