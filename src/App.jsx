import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown,
  Lock,
  Calculator,
  Gift,
  Bell,
  LayoutGrid,
  ShieldAlert,
  Menu,
  Images
} from 'lucide-react';

import ItemDetailModal from './components/ItemDetailModal';
import SwapModal from './components/SwapModal';
import PostWizardModal from './components/PostWizardModal';
import KycModal from './components/KycModal';
import AuthModal from './components/AuthModal';
import TradeDeskView from './components/TradeDeskView';
import StorefrontView from './components/StorefrontView';
import TrustCenterView from './components/TrustCenterView';
import AdminDashboardView from './components/AdminDashboardView';
import AdminLoginView from './components/AdminLoginView';
import AnimatedHeroSection from './components/AnimatedHeroSection';
import NotificationCenterModal from './components/NotificationCenterModal';
import RealtimeChatDrawer from './components/RealtimeChatDrawer';
import Pagination from './components/Pagination';

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('marketplace'); // 'marketplace' | 'tradedesk' | 'storefront' | 'trust' | 'admin'
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

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Chat State
  const [activeChat, setActiveChat] = useState(null); // { item, otherUser }
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Modals
  const [activeDetailItem, setActiveDetailItem] = useState(null);
  const [activeSwapItem, setActiveSwapItem] = useState(null);
  const [showPostWizard, setShowPostWizard] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialQuery, setSerialQuery] = useState('');
  const [serialResult, setSerialResult] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(null); // 'login' | 'register' | null
  const [referralBanner, setReferralBanner] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [kycAlertModal, setKycAlertModal] = useState(false);
  const [marketplacePage, setMarketplacePage] = useState(1);
  const MARKETPLACE_PAGE_SIZE = 12;

  // My Dashboard Dropdown
  const [showDashboardMenu, setShowDashboardMenu] = useState(false);
  const dashboardMenuRef = useRef(null);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('dfq_theme_mode', theme);
  }, [theme]);

  // Dashboard dropdown click-outside
  useEffect(() => {
    const handler = (e) => {
      if (dashboardMenuRef.current && !dashboardMenuRef.current.contains(e.target)) {
        setShowDashboardMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
    // Check if user navigated directly to /admin or /admin/login
    const path = window.location.pathname.toLowerCase();
    if (path === '/admin' || path === '/admin/login' || window.location.search.includes('view=admin')) {
      setActiveView('admin');
    }
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

  // Notifications polling
  const loadNotifications = () => {
    if (!user) {
      setNotifications([]);
      setUnreadNotifsCount(0);
      return;
    }
    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadNotifsCount(data.data.unread_count || 0);
        }
      })
      .catch(() => {});
  };

  const loadUnreadMessages = () => {
    if (!user) {
      setUnreadMessagesCount(0);
      return;
    }
    fetch('/api/messages/unread-count')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUnreadMessagesCount(data.data.count || 0);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadMessages();
    const interval = setInterval(() => {
      loadNotifications();
      loadUnreadMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.id]);

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

  // Reset marketplace pagination when filters change (Requirement 5)
  useEffect(() => {
    setMarketplacePage(1);
  }, [selectedMode, selectedCategory, selectedLocation, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (marketplacePage - 1) * MARKETPLACE_PAGE_SIZE;
    return filteredItems.slice(start, start + MARKETPLACE_PAGE_SIZE);
  }, [filteredItems, marketplacePage]);

  // Open Chat Drawer
  const openChatFor = (item, otherTrader = null) => {
    setActiveChat({
      item,
      otherUser: otherTrader || (user && user.id === item.user_id ? null : { id: item.user_id, full_name: item.owner_name })
    });
  };

  // Requirement 3 Guard: Can't list until KYC approved
  const handleOpenPostListing = () => {
    if (!user) {
      setShowAuthModal('login');
      return;
    }
    if (user.is_admin === 1 || user.kyc_status === 'approved') {
      setShowPostWizard(true);
      return;
    }
    // Blocked: Show helpful modal
    setKycAlertModal(true);
  };

  const formatNaira = (val) => {
    return '₦' + Number(val || 0).toLocaleString('en-NG');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200 bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 p-3.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="ml-2 text-slate-400 hover:text-white border-0 bg-transparent cursor-pointer font-bold">&times;</button>
        </div>
      )}

      {/* =========================================================================
          1. CLEAN IMPROVED HEADER (Requirement 1, 7, 9)
          ========================================================================= */}
      <nav className="sticky top-0 z-40 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors h-16 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-2 sm:gap-4 flex-nowrap">
          {/* Brand Logo */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <button
              onClick={() => {
                setActiveView('marketplace');
                window.history.pushState({}, '', '/');
              }}
              className="flex items-center gap-2.5 bg-transparent border-0 text-left cursor-pointer p-0 group shrink-0 flex-nowrap"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm shadow-sky-500/25 group-hover:scale-105 transition-transform shrink-0">
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
              </div>
              <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                DFQ <span className="text-sky-600 dark:text-sky-400">Trade Escrow</span>
              </span>
            </button>
          </div>

          {/* Center Nav Links (Clean Consumer Navigation) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0 flex-nowrap">
            <button
              onClick={() => {
                setActiveView('marketplace');
                window.history.pushState({}, '', '/');
              }}
              className={`px-2.5 xl:px-3 py-1.5 rounded-lg text-xs xl:text-[13px] font-medium border-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                activeView === 'marketplace'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/80 shadow-xs'
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Marketplace</span>
            </button>
          </div>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
            {/* Dedicated Admin Portal Link (Only for admins) */}
            {user?.is_admin === 1 && (
              <button
                onClick={() => {
                  setActiveView('admin');
                  window.history.pushState({}, '', '/admin');
                }}
                className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                  activeView === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/80 hover:bg-amber-100/80'
                }`}
                title="Management Console"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="whitespace-nowrap">Admin Portal</span>
              </button>
            )}

            {/* Notification Bell (Requirement 7) */}
            {user && (
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer transition-colors shrink-0"
                title="Notifications"
              >
                <Bell className="w-4 h-4 shrink-0" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifsCount}
                  </span>
                )}
              </button>
            )}

            {/* Chat Icon (Requirement 6, 7) */}
            <button
              onClick={() => {
                if (user) {
                  setActiveChat({ openList: true });
                } else {
                  setShowAuthModal('login');
                }
              }}
              className="relative p-1.5 sm:p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border-0 bg-transparent cursor-pointer transition-colors shrink-0"
              title="Real-time Chat & Inquiries"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* KYC Status Pill (Only for regular non-admin logged-in users, on xl+ screens) */}
            {user && user.is_admin !== 1 && (
              <button
                onClick={() => setShowKycModal(true)}
                className={`hidden xl:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                  user.kyc_status === 'approved'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                    : user.kyc_status === 'pending_review'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                }`}
                title={user.kyc_status === 'approved' ? 'Verified Trader' : user.kyc_status === 'pending_review' ? 'KYC Under Review' : 'Verify Identity'}
              >
                {user.kyc_status === 'approved' ? (
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : user.kyc_status === 'pending_review' ? (
                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className="whitespace-nowrap">
                  {user.kyc_status === 'approved'
                    ? (user.kyc_tier === 3 ? 'Gold Seal Pro' : 'Verified Trader')
                    : user.kyc_status === 'pending_review'
                    ? 'KYC Pending'
                    : 'Verify KYC'}
                </span>
              </button>
            )}

            {/* + Post Listing CTA */}
            <button
              onClick={handleOpenPostListing}
              className="inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-[13px] font-semibold px-2.5 sm:px-3.5 py-1.5 rounded-lg border-0 cursor-pointer text-white shadow-sm bg-sky-600 hover:bg-sky-500 active:bg-sky-700 transition-all shadow-sky-600/20 whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="sm:hidden whitespace-nowrap">Post</span>
              <span className="hidden sm:inline whitespace-nowrap">Post Listing</span>
            </button>

            {/* Auth Buttons / My Dashboard Dropdown */}
            {user ? (
              <div className="relative shrink-0" ref={dashboardMenuRef}>
                <button
                  onClick={() => setShowDashboardMenu(prev => !prev)}
                  className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline whitespace-nowrap">My Dashboard</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showDashboardMenu ? 'rotate-180' : ''}`} />
                </button>
                {showDashboardMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveView('tradedesk');
                        setShowDashboardMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-0 bg-transparent text-left transition-colors"
                    >
                      <Kanban className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span>Trade Desk</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveView('trust');
                        setShowDashboardMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-0 bg-transparent text-left transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Trust &amp; Escrow</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowSerialModal(true);
                        setShowDashboardMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-0 bg-transparent text-left transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span>Verify IMEI / Serial</span>
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          fetch('/api/auth/logout').then(() => {
                            setUser(null);
                            setToastMessage('Logged out successfully.');
                            window.history.pushState({}, '', '/');
                            setActiveView('marketplace');
                            setShowDashboardMenu(false);
                          });
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer border-0 bg-transparent text-left transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0 whitespace-nowrap flex-nowrap">
                <button
                  onClick={() => setShowAuthModal('login')}
                  className="text-xs sm:text-[13px] font-medium px-2 sm:px-3 py-1.5 rounded-lg border-0 bg-transparent text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  Log In
                </button>
                <button
                  onClick={() => setShowAuthModal('register')}
                  className="text-xs sm:text-[13px] font-medium px-2.5 sm:px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 cursor-pointer transition-colors whitespace-nowrap shrink-0"
                >
                  Sign Up
                </button>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors shrink-0"
              title="Toggle Dark / Light Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            </button>

            {/* Mobile / Tablet Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer shrink-0 transition-colors"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4 shrink-0" /> : <Menu className="w-4 h-4 shrink-0" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-3 space-y-2 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveView('marketplace');
                setMobileMenuOpen(false);
                window.history.pushState({}, '', '/');
              }}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border cursor-pointer ${
                activeView === 'marketplace'
                  ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-sky-600" />
              <span>Marketplace</span>
            </button>
            <button
              onClick={() => {
                setActiveView('tradedesk');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border cursor-pointer ${
                activeView === 'tradedesk'
                  ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Kanban className="w-4 h-4 text-sky-600" />
              <span>Trade Desk</span>
            </button>
            <button
              onClick={() => {
                setShowSerialModal(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-sky-600" />
              <span>Verify IMEI</span>
            </button>
            <button
              onClick={() => {
                setActiveView('trust');
                setMobileMenuOpen(false);
              }}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 border cursor-pointer ${
                activeView === 'trust'
                  ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-sky-600" />
              <span>Trust &amp; Escrow</span>
            </button>
          </div>
          {user?.is_admin === 1 && (
            <button
              onClick={() => {
                setActiveView('admin');
                setMobileMenuOpen(false);
                window.history.pushState({}, '', '/admin');
              }}
              className="w-full p-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Open Admin Operations &amp; Dispatcher Hub</span>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW SWITCHER
          ========================================================================= */}
      {activeView === 'admin' && (
        user?.is_admin === 1 ? (
          <AdminDashboardView onBackToMarketplace={() => {
            setActiveView('marketplace');
            window.history.pushState({}, '', '/');
          }} />
        ) : (
          <AdminLoginView
            onAdminAuthenticated={(adminUser) => {
              setUser(adminUser);
              setActiveView('admin');
              window.history.pushState({}, '', '/admin');
            }}
            onBackToMarketplace={() => {
              setActiveView('marketplace');
              window.history.pushState({}, '', '/');
            }}
          />
        )
      )}

      {activeView === 'tradedesk' && (
        <TradeDeskView user={user} onOpenChat={(it) => openChatFor(it)} />
      )}

      {activeView === 'storefront' && (
        <StorefrontView traderId={storefrontId} onBack={() => setActiveView('marketplace')} onOpenChat={(it) => openChatFor(it)} />
      )}

      {activeView === 'trust' && (
        <TrustCenterView />
      )}

      {/* =========================================================================
          2. ANIMATED HERO SECTION (Requirement 8)
          ========================================================================= */}
      {activeView === 'marketplace' && (
        <>
          <AnimatedHeroSection
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            onSearchSubmit={(e) => {
              e?.preventDefault();
              const el = document.getElementById('marketplace-feed');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onVerifyImeiClick={() => setShowSerialModal(true)}
          />

          {/* =========================================================================
              3. MAIN MARKETPLACE CONTENT AREA
              ========================================================================= */}
          <main id="marketplace-feed" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
            {/* Referral Recognition Banner */}
            {referralBanner && (
              <div className="mb-6 p-4 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-600 text-white">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      You were invited by {referralBanner.inviter_name}!
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-0">
                      Sign up today to unlock <strong>1 Free Spotlight Boost</strong> and verified trading privileges.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal('register')}
                  className="text-xs font-semibold px-4 py-2 rounded-xl text-white border-0 cursor-pointer shadow-sm bg-sky-600 hover:bg-sky-500 transition-colors"
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
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className="text-xs font-medium text-slate-500">
                Showing <strong className="text-slate-900 dark:text-white">{filteredItems.length}</strong> active trades
              </div>
            </div>

            {/* Category Chips Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
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
                  className={`px-3 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 font-bold'
                      : 'bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Grid of Clean Item Cards */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 border rounded-2xl p-6 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1 text-slate-900 dark:text-white">No matching items found</h3>
                <p className="text-xs mb-4 max-w-sm mx-auto text-slate-500">
                  Try loosening your filters or post the item you wish to trade with other verified members.
                </p>
                <button
                  onClick={() => {
                    setSelectedMode('all');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {paginatedItems.map(item => {
                    const isFav = favorites.includes(Number(item.id));
                  const isReceipt = Boolean(item.receipt_path);
                  const isSpotlight = Number(item.is_featured) === 1;

                  return (
                    <article
                      key={item.id}
                      className={`border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg bg-white dark:bg-slate-900 group ${
                        isSpotlight ? 'border-sky-400 dark:border-sky-600 ring-1 ring-sky-400/20' : 'border-slate-200 dark:border-slate-800'
                      }`}
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
                          className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm border tracking-wide uppercase ${
                            item.mode === 'Barter Only'
                              ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/80 dark:border-sky-800 dark:text-sky-300'
                              : item.mode === 'Cash or Swap'
                              ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-950/80 dark:border-purple-800 dark:text-purple-300'
                              : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {item.mode}
                        </span>

                        {/* Multi-photo badge */}
                        {item.gallery && item.gallery.length > 1 && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs flex items-center gap-1 shadow-sm">
                            <Images className="w-3 h-3" />
                            <span>{item.gallery.length}</span>
                          </span>
                        )}

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
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-sm">
                              <BadgeCheck className="w-3 h-3" />
                              Receipt Verified
                            </span>
                          ) : <span />}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-sm">
                            {item.item_condition}
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex flex-col flex-1">
                        {/* Location & Trader Rating */}
                        <div className="flex items-center justify-between text-xs mb-1.5 text-slate-500 dark:text-slate-400">
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
                          className="text-sm sm:text-base font-bold tracking-tight mb-1.5 cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 line-clamp-1 text-slate-900 dark:text-white"
                        >
                          {item.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs line-clamp-2 mb-3 flex-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Desired Exchange Box */}
                        <div className="rounded-xl p-2.5 mb-3 border text-xs bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider mb-0.5 text-slate-400">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-sky-500" />
                            <span>Owner Wants in Return</span>
                          </div>
                          <div className="font-semibold line-clamp-1 text-slate-900 dark:text-white">
                            {item.wanted}
                          </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] block font-medium text-slate-400">Est. Valuation</span>
                            <span className="text-sm font-bold text-sky-600 dark:text-sky-400">{formatNaira(item.est_value)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openChatFor(item)}
                              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center gap-1 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                              <span>Inquire</span>
                            </button>
                            <button
                              onClick={() => {
                                if (!user) setShowAuthModal('login');
                                else setActiveSwapItem(item);
                              }}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white border-0 cursor-pointer shadow-sm bg-sky-600 hover:bg-sky-500 transition-colors flex items-center gap-1"
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

              {/* Consumer Marketplace Pagination (Requirement 5) */}
              <div className="mt-8 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                <Pagination
                  currentPage={marketplacePage}
                  totalItems={filteredItems.length}
                  pageSize={MARKETPLACE_PAGE_SIZE}
                  onPageChange={(p) => {
                    setMarketplacePage(p);
                    const el = document.getElementById('marketplace-feed');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  itemLabel="available trades & pawn deals"
                />
              </div>
            </>
          )}
          </main>
        </>
      )}

      {/* =========================================================================
          REALTIME CHAT DRAWER (Requirement 6)
          ========================================================================= */}
      {activeChat && (
        <RealtimeChatDrawer
          item={activeChat.item}
          otherUser={activeChat.otherUser}
          currentUser={user}
          onClose={() => setActiveChat(null)}
          onOpenAuth={() => setShowAuthModal('login')}
          onMessagesRead={() => loadUnreadMessages()}
        />
      )}

      {/* =========================================================================
          NOTIFICATION CENTER (Requirement 7)
          ========================================================================= */}
      {showNotificationCenter && (
        <NotificationCenterModal
          notifications={notifications}
          unreadCount={unreadNotifsCount}
          onClose={() => setShowNotificationCenter(false)}
          onMarkRead={(id) => {
            fetch(`/api/notifications/${id}/read`, { method: 'POST' }).then(() => loadNotifications());
          }}
          onMarkAllRead={() => {
            fetch('/api/notifications/read-all', { method: 'POST' }).then(() => loadNotifications());
          }}
          onNavigate={(link) => {
            setShowNotificationCenter(false);
            if (link?.includes('admin')) {
              setActiveView('admin');
            } else if (link?.includes('chat')) {
              try {
                const url = new URL(link, window.location.origin);
                const itemId = parseInt(url.searchParams.get('item_id') || '0', 10);
                const partnerId = parseInt(url.searchParams.get('partner_id') || '0', 10);
                if (itemId) {
                  const targetItem = items.find(it => it.id === itemId) || { id: itemId };
                  setActiveChat({
                    item: targetItem,
                    otherUser: partnerId ? { id: partnerId } : null
                  });
                } else {
                  setActiveChat({ openList: true });
                }
              } catch (_) {
                setActiveChat({ openList: true });
              }
            } else if (link?.includes('kyc')) {
              setShowKycModal(true);
            }
          }}
        />
      )}

      {/* =========================================================================
          REQUIREMENT 3: KYC REQUIRED MODAL
          ========================================================================= */}
      {kycAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {user?.kyc_status === 'pending_review'
                ? 'KYC Verification Under Review'
                : 'Identity Verification Required'}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {user?.kyc_status === 'pending_review'
                ? 'Your NIN and identity documents are currently under review by an administrator. Once approved, you will be able to post listings immediately.'
                : 'To safeguard our trading ecosystem, members must verify their details and National Identification Number (NIN) before listing items on DFQ Trade Escrow.'}
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                onClick={() => setKycAlertModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Close
              </button>
              {user?.kyc_status !== 'pending_review' && (
                <button
                  onClick={() => {
                    setKycAlertModal(false);
                    setShowKycModal(true);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white border-0 cursor-pointer shadow-sm transition-colors"
                >
                  Verify NIN Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          OTHER MODALS
          ========================================================================= */}
      {/* Detail Modal */}
      {activeDetailItem && (
        <ItemDetailModal
          item={activeDetailItem}
          onClose={() => setActiveDetailItem(null)}
          onOpenChat={(it) => openChatFor(it)}
          onOpenSwap={(it) => {
            if (!user) setShowAuthModal('login');
            else setActiveSwapItem(it);
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
          onSuccess={() => {
            setToastMessage('Verification submitted for admin review!');
            refreshUser();
          }}
        />
      )}

      {/* Auth Modal with OTP Verification */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border p-5 shadow-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                <QrCode className="w-4 h-4 text-sky-500" />
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
                className="flex-1 px-3 py-2 text-xs border rounded-xl outline-none border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-sky-500"
              />
              <button type="submit" className="px-4 py-2 text-xs font-semibold rounded-xl text-white border-0 cursor-pointer bg-sky-600 hover:bg-sky-500 shadow-sm">
                Scan
              </button>
            </form>
            {serialResult && (
              <div className={`p-3 rounded-xl border text-xs ${serialResult.flagged ? 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-700 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-700 dark:text-emerald-400'}`}>
                {serialResult.flagged ? (
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>WARNING: This Serial/IMEI has been reported flagged or stolen. Do NOT proceed!</span>
                  </div>
                ) : (
                  <div className="font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Clean Record: Zero theft reports found on DFQ Trade Escrow records.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-10 transition-colors mt-auto bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-base mb-2 text-slate-900 dark:text-white">
                <div className="w-6 h-6 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </div>
                <span>DFQ Trade Escrow</span>
              </div>
              <p className="text-xs max-w-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Nigeria's verified peer-to-peer barter, cash-top-up, and receipt-verified digital pawn marketplace. Backed by inspection hold escrow and anti-theft screening.
              </p>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-900 dark:text-white">Marketplace</h5>
              <ul className="space-y-1.5 text-xs list-none p-0 text-slate-500">
                <li><button onClick={() => { setActiveView('marketplace'); setSelectedMode('all'); }} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Browse All Swaps</button></li>
                <li><button onClick={handleOpenPostListing} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Post a Listing</button></li>
                <li><button onClick={() => setActiveView('tradedesk')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">My Trade Desk</button></li>
                <li><button onClick={() => setShowSerialModal(true)} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Anti-Theft IMEI Verifier</button></li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider mb-3 text-slate-900 dark:text-white">Trust &amp; Legal</h5>
              <ul className="space-y-1.5 text-xs list-none p-0 text-slate-500">
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Escrow &amp; Refund Policy</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Anti-Theft Regulations</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">NDPR Privacy Compliance</button></li>
                <li><button onClick={() => setActiveView('trust')} className="bg-transparent border-0 p-0 text-slate-500 hover:text-sky-600 cursor-pointer">Safe Meetup Guidelines</button></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs gap-3 text-slate-400">
            <span>&copy; {new Date().getFullYear()} DFQ Trade Escrow Systems Ltd. All rights reserved.</span>
            <span>Operating under Federal Republic of Nigeria Trade &amp; Collateral Regulations.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
