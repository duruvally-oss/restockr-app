import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  db,
  subscribeToDBUpdates,
  loadShopData,
  subscribeToRealtime,
  unsubscribeFromRealtime,
  signInWithShopCredentials,
  registerShopWithCredentials,
  signOutFromSupabase,
  restoreSession,
} from "./lib/database";
import { Product, Sale, Customer, Staff, Shop, AppNotification } from "./types";
import DashboardOverview from "./components/DashboardOverview";
import InventoryManager from "./components/InventoryManager";
import SalesManager from "./components/SalesManager";
import CustomerManager from "./components/CustomerManager";
import ReportsManager from "./components/ReportsManager";
import StaffManager from "./components/StaffManager";
import WebsiteSettings from "./components/WebsiteSettings";
import SettingsSubscription from "./components/SettingsSubscription";
import WhatsAppEmulator from "./components/WhatsAppEmulator";
import ResellerWebsite from "./components/ResellerWebsite";

import { Package, ShoppingCart, Users, FileText, Globe, Key, Bell, Smartphone, LogOut, Check, Sparkles, LayoutDashboard, Settings, Lock, TriangleAlert as AlertTriangle, Menu, X, ArrowUpRight, ChevronDown } from "lucide-react";

export default function App() {
  // ----------------------------------------------------
  // ROUTER STATE (Handles /#/shop/:slug or standard view)
  // ----------------------------------------------------
  const [currentPath, setCurrentPath] = useState(window.location.hash || "#/");

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Parse path to check if we are visiting a public reseller storefront
  const isPublicWebsitePath = currentPath.startsWith("#/shop/");
  const publicShopSlug = isPublicWebsitePath ? currentPath.replace("#/shop/", "").split("?")[0] : "";

  // ----------------------------------------------------
  // DATABASE SUBSCRIPTIONS & SYNC
  // ----------------------------------------------------
  const [shops, setShops] = useState<Shop[]>([]);
  const [currentShop, setCurrentShop] = useState<Shop | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Reactive DB States
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Expiry lock state (can be forced via subscription settings)
  const [isSimulatedExpired, setIsSimulatedExpired] = useState(false);

  // Sync state from in-memory cache (kept fresh by realtime subscriptions)
  const syncStates = () => {
    const updatedShops = db.getShops();
    setShops(updatedShops);

    const activeShop = updatedShops.find(s => s.id === (currentShop?.id || "")) || null;
    if (activeShop) {
      setProducts(db.getProducts(activeShop.id));
      setSales(db.getSales(activeShop.id));
      setCustomers(db.getCustomers(activeShop.id));
      setStaff(db.getStaff(activeShop.id));
      setNotifications(db.getNotifications(activeShop.id));
    } else {
      setProducts([]);
      setSales([]);
      setCustomers([]);
      setStaff([]);
      setNotifications([]);
    }
  };

  // Restore session on mount (auto-login from Supabase Auth)
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      const { shop } = await restoreSession();
      if (shop) {
        await loadShopData(shop.id);
        subscribeToRealtime(shop.id);
        setCurrentShop(shop);
        setIsLoggedIn(true);
        setShops(db.getShops());
        setProducts(db.getProducts(shop.id));
        setSales(db.getSales(shop.id));
        setCustomers(db.getCustomers(shop.id));
        setStaff(db.getStaff(shop.id));
        setNotifications(db.getNotifications(shop.id));
      }
      setIsAuthLoading(false);

      // Subscribe to in-memory cache updates (triggered by realtime)
      unsubscribe = subscribeToDBUpdates(() => {
        syncStates();
      });
    })();
    return () => {
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------
  // OWNER AUTH STATE (declared before effects that reference it)
  // ----------------------------------------------------
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState<"select" | "signin" | "register">("select");
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Re-sync when shop changes
  useEffect(() => {
    if (currentShop?.id && isLoggedIn) {
      syncStates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentShop?.id, isLoggedIn]);

  // Profile Menu Dropdown & Logout Confirmation Modal states
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsProfileMenuOpen(false);
        setShowLogoutConfirmModal(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    if (isProfileMenuOpen) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (isLoggedIn && currentShop) {
      localStorage.setItem("restockr_currentShopId", currentShop.id);
    } else {
      localStorage.removeItem("restockr_currentShopId");
    }
  }, [isLoggedIn, currentShop?.id]);

  // Registration states
  const [regShopName, setRegShopName] = useState("");
  const [regShopSlug, setRegShopSlug] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regWhatsApp, setRegWhatsApp] = useState("");

  const handleShopNameChange = (name: string) => {
    setRegShopName(name);
    // Auto-generate slug from name (alphanumeric and hyphens only)
    const suggestedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // remove non-alphanumeric except space and hyphen
      .replace(/\s+/g, "-")         // replace spaces with hyphens
      .replace(/-+/g, "-");         // replace multiple hyphens with single
    setRegShopSlug(suggestedSlug);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      setLoginError("Credentials cannot be left blank.");
      return;
    }

    setIsAuthSubmitting(true);
    setLoginError("");

    const result = await signInWithShopCredentials(authUsername, authPassword);
    if (result.success && result.shop) {
      await loadShopData(result.shop.id);
      subscribeToRealtime(result.shop.id);
      setCurrentShop(result.shop);
      setIsLoggedIn(true);
      setActiveModule("dashboard");
    } else {
      setLoginError(result.error || "Login failed.");
    }
    setIsAuthSubmitting(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regShopName.trim() || !regShopSlug.trim() || !regUsername.trim() || !regPassword.trim() || !regWhatsApp.trim()) {
      setLoginError("All fields are required to register your store.");
      return;
    }

    // Check slug formatting (must be lowercase alphanumeric)
    const slugRegex = /^[a-z0-9-]+$/;
    const sanitizedSlug = regShopSlug.trim().toLowerCase();
    if (!slugRegex.test(sanitizedSlug)) {
      setLoginError("Store link can only contain lowercase letters, numbers, and hyphens.");
      return;
    }

    setIsAuthSubmitting(true);
    setLoginError("");

    const result = await registerShopWithCredentials({
      shopName: regShopName.trim(),
      slug: sanitizedSlug,
      username: regUsername.trim(),
      password: regPassword,
      whatsappNumber: regWhatsApp.trim(),
    });

    if (result.success && result.shop) {
      await loadShopData(result.shop.id);
      subscribeToRealtime(result.shop.id);
      setCurrentShop(result.shop);
      setIsLoggedIn(true);
      setActiveModule("dashboard");
    } else {
      setLoginError(result.error || "Registration failed.");
    }
    setIsAuthSubmitting(false);
  };

  const handleLogout = async () => {
    unsubscribeFromRealtime();
    await signOutFromSupabase();
    setIsLoggedIn(false);
    setCurrentShop(null);
    resetQuickActions();
    setAuthUsername("");
    setAuthPassword("");
    setRegShopName("");
    setRegShopSlug("");
    setRegUsername("");
    setRegPassword("");
    setRegWhatsApp("");
    setAuthMode("select");
    setProducts([]);
    setSales([]);
    setCustomers([]);
    setStaff([]);
    setNotifications([]);
  };

  // ----------------------------------------------------
  // MODULES NAVIGATION & QUICK ACTIONS
  // ----------------------------------------------------
  const [activeModule, setActiveModule] = useState<string>(() => localStorage.getItem("restockr_activeModule") || "dashboard");

  useEffect(() => {
    localStorage.setItem("restockr_activeModule", activeModule);
  }, [activeModule]);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showAddProductWizard, setShowAddProductWizard] = useState(false);
  const [showSellProductWizard, setShowSellProductWizard] = useState(false);

  // Notifications Bell dropdown
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const resetQuickActions = () => {
    setShowAddProductWizard(false);
    setShowSellProductWizard(false);
  };

  const handleQuickAction = (action: "add_product" | "sell_product") => {
    resetQuickActions();
    if (action === "add_product") {
      setActiveModule("inventory");
      setShowAddProductWizard(true);
    } else if (action === "sell_product") {
      setActiveModule("sales");
      setShowSellProductWizard(true);
    }
  };

  // ----------------------------------------------------
  // RENDER SELECTION: PUBLIC SITE VS. DASHBOARD
  // ----------------------------------------------------

  // If path matches a public catalog route, render public reseller store
  if (isPublicWebsitePath) {
    const publicShop = shops.find(s => s.slug.toLowerCase() === publicShopSlug.toLowerCase());
    if (!publicShop) {
      return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-300">
          <AlertTriangle className="w-12 h-12 text-rose-500 mb-3" />
          <h1 className="text-xl font-bold text-white">404: Storefront Not Found</h1>
          <p className="text-sm text-slate-400 mt-1">We couldn't resolve the reseller domain *{publicShopSlug}.restockr.app*.</p>
          <a href="#/" className="mt-6 text-xs text-indigo-400 hover:underline">Return to Restockr Main Login</a>
        </div>
      );
    }

    const publicProducts = db.getProducts(publicShop.id);
    return (
      <ResellerWebsite 
        shop={publicShop} 
        products={publicProducts} 
        isExpired={isSimulatedExpired || publicShop.subscriptionStatus === "Expired"} 
      />
    );
  }

  // If restoring session, show loading state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white font-sans">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#B7BCC7]">Restoring your session...</p>
      </div>
    );
  }

  // If not logged in, show Owner credentials authentication flow with premium Black & Ash design
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col justify-center items-center p-4 select-none relative overflow-hidden text-white" id="owner-login-screen">
        
        {/* Decorative background grid line */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#FFF_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Brand Banner with Arial Black display headings */}
        <div className="text-center mb-8 space-y-2 animate-fade-in">
          <h1 className="font-display font-black text-4xl text-white tracking-tight flex items-center justify-center gap-2 uppercase">
            RESTOCKR <span className="bg-teal-500 text-[#0A0A0A] text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded tracking-widest font-black">v2.0</span>
          </h1>
          <p className="text-sm text-[#B7BCC7] font-sans">The Operating System for Nigerian Phone & Gadget Stores</p>
        </div>

        {/* Auth Mode switcher / Content */}
        {authMode === "select" && (
          <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[22px] p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-scale-up z-10 text-center" id="auth-select-container">
            <div className="space-y-3 border-b border-[#2A2A2A] pb-6">
              <div className="mx-auto w-12 h-12 bg-[#121212] border border-[#2A2A2A] rounded-2xl flex items-center justify-center text-teal-400">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">Welcome to Restockr</h2>
              <p className="text-xs text-[#B7BCC7] leading-relaxed">
                Empower your business with a premium catalog website, staff ledger controls, and integrated WhatsApp receipt systems.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <button
                onClick={() => {
                  setAuthMode("register");
                  setLoginError("");
                }}
                className="w-full py-3.5 px-4 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] text-white hover:from-[#666666] hover:to-[#464646] rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2"
                id="btn-goto-register"
              >
                <Sparkles className="w-4 h-4 text-white" />
                Create Shop
              </button>

              <button
                onClick={() => {
                  setAuthMode("signin");
                  setLoginError("");
                }}
                className="w-full py-3.5 px-4 bg-[#121212] border border-[#2A2A2A] hover:bg-zinc-800 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
                id="btn-goto-signin"
              >
                <Lock className="w-4 h-4 text-[#B7BCC7]" />
                Sign In
              </button>
            </div>

            <p className="text-[10px] text-[#B7BCC7]/60 leading-normal">
              Staff members can sign in directly through invited staff channels or use the WhatsApp integration bot.
            </p>
          </div>
        )}

        {authMode === "signin" && (
          <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[22px] p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-scale-up z-10 text-white" id="login-form-container">
            <div className="space-y-1.5 border-b border-[#2A2A2A] pb-4 flex justify-between items-start">
              <div>
                <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">Sign In</h2>
                <p className="text-xs text-[#B7BCC7]">Enter your registered owner credentials.</p>
              </div>
              <button
                onClick={() => {
                  setAuthMode("select");
                  setLoginError("");
                }}
                className="text-xs font-bold font-display uppercase tracking-wider text-[#B7BCC7] hover:text-white flex items-center gap-1 hover:underline"
              >
                Back
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Shop Username field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Shop Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. autogadgets"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-mono"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                id="btn-owner-login"
                disabled={isAuthSubmitting}
                className="w-full py-3.5 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:scale-[0.98] transition-transform cursor-pointer shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAuthSubmitting ? "Signing in..." : "Enter Workspace"} {!isAuthSubmitting && <ArrowUpRight className="w-4 h-4 text-white/60" />}
              </button>
            </form>
          </div>
        )}

        {authMode === "register" && (
          <div className="bg-[#1B1B1B] border border-[#2A2A2A] rounded-[22px] p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-scale-up z-10 text-white" id="register-form-container">
            <div className="space-y-1.5 border-b border-[#2A2A2A] pb-4 flex justify-between items-start">
              <div>
                <h2 className="font-display font-black text-xl text-white uppercase tracking-tight">Create New Shop</h2>
                <p className="text-xs text-[#B7BCC7]">Launch your Nigerian phone & gadget store.</p>
              </div>
              <button
                onClick={() => {
                  setAuthMode("select");
                  setLoginError("");
                }}
                className="text-xs font-bold font-display uppercase tracking-wider text-[#B7BCC7] hover:text-white flex items-center gap-1 hover:underline"
              >
                Back
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/40 border border-rose-900 rounded-xl text-rose-400 text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Business Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Store / Business Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kano Gadgets"
                  value={regShopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-semibold"
                />
              </div>

              {/* Subdomain / Slug */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Store Link Subdomain
                </label>
                <div className="flex items-center bg-black border border-[#2A2A2A] rounded-xl overflow-hidden px-3 focus-within:ring-1 focus-within:ring-teal-500">
                  <input
                    type="text"
                    required
                    placeholder="kanogadgets"
                    value={regShopSlug}
                    onChange={(e) => setRegShopSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="flex-1 py-2.5 text-sm focus:outline-none text-white font-mono bg-transparent"
                  />
                  <span className="text-xs text-[#B7BCC7] font-mono">.restockr.app</span>
                </div>
              </div>

              {/* Shop Username */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Shop Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. autogadgets"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-mono"
                />
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block">
                  Set Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-mono"
                />
              </div>

              {/* WhatsApp Phone Number */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[#B7BCC7] uppercase tracking-wider block flex items-center justify-between">
                  <span>WhatsApp Number</span>
                  <span className="text-[9px] text-[#B7BCC7]/60 lowercase font-normal">(with country code)</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. +2348031234567"
                  value={regWhatsApp}
                  onChange={(e) => setRegWhatsApp(e.target.value)}
                  className="w-full px-3 py-2.5 bg-black border border-[#2A2A2A] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 text-white font-mono"
                />
              </div>

              <button
                type="submit"
                id="btn-owner-register"
                disabled={isAuthSubmitting}
                className="w-full py-3.5 bg-gradient-to-b from-[#565656] to-[#3A3A3A] border border-[#555555] text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:scale-[0.98] transition-all cursor-pointer shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isAuthSubmitting ? "Creating shop..." : "Register & Open Shop"} {!isAuthSubmitting && <Sparkles className="w-4 h-4 text-white/60" />}
              </button>
            </form>
          </div>
        )}

        {/* Technical Footer */}
        <p className="text-[10px] font-mono text-[#B7BCC7]/40 mt-12 uppercase tracking-widest">
          RESTOCKR v2.0 • Nigerian Gadget Business OS
        </p>

      </div>
    );
  }

  // ----------------------------------------------------
  // LOGGED IN DASHBOARD FRAME (Fully themed Black & Ash)
  // ----------------------------------------------------
  if (!currentShop) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center text-white font-sans">
        <p className="text-sm text-[#B7BCC7] animate-pulse">Initializing shop environment...</p>
      </div>
    );
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col font-sans text-white select-none" id="owner-app-dashboard">
      
      {/* 1. APP BAR HEADER */}
      <header className="bg-[#121212]/90 backdrop-blur border-b border-[#2A2A2A] px-6 py-4 flex justify-between items-center shrink-0 z-40 sticky top-0 text-white">
        
        {/* Mobile menu trigger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 hover:bg-[#1B1B1B] rounded-lg text-white cursor-pointer"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-teal-500 text-[#0A0A0A] rounded-lg flex items-center justify-center font-display font-black text-xs">
              R
            </span>
            <h1 className="font-display font-black text-lg tracking-tight text-white uppercase flex items-center gap-1.5">
              RESTOCKR <span className="text-[10px] bg-[#1B1B1B] border border-[#2A2A2A] text-teal-400 font-mono font-bold px-1.5 py-0.5 rounded uppercase">OS</span>
            </h1>
          </div>
        </div>

        {/* Right workspace utilities */}
        <div className="flex items-center gap-4">
          
          {/* Active Shop tag */}
          <div className="hidden md:flex items-center gap-2 bg-[#1B1B1B] border border-[#2A2A2A] rounded-xl px-3.5 py-1.5 text-xs text-white font-bold">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-pulse" />
            <span>Store: {currentShop.name}</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                db.markNotificationsAsRead(currentShop.id);
                setNotifications(db.getNotifications(currentShop.id));
              }}
              className="p-2.5 bg-[#1B1B1B] border border-[#2A2A2A] hover:bg-[#2A2A2A] rounded-xl text-[#B7BCC7] hover:text-white relative cursor-pointer transition-colors"
              title="Recent alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown Drawer */}
            {showNotifDropdown && (
              <div className="fixed md:absolute left-4 right-4 md:left-auto md:right-0 mt-2 top-[72px] md:top-auto md:w-80 bg-[#1B1B1B] border border-[#2A2A2A] rounded-2xl shadow-2xl z-50 p-4 divide-y divide-[#2A2A2A] animate-fade-in text-xs max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center pb-2 mb-2">
                  <span className="font-display font-black text-white uppercase tracking-tight">Workspace Alerts</span>
                  <button
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-[10px] text-[#B7BCC7] hover:text-white font-bold uppercase font-display"
                  >
                    Close
                  </button>
                </div>
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-[#B7BCC7]/60">No recent alerts.</div>
                ) : (
                  notifications.map(notif => (
                    <div key={notif.id} className="py-2.5 space-y-1">
                      <p className="font-semibold text-white flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          notif.type === "success" ? "bg-teal-500" : notif.type === "warning" ? "bg-amber-500" : "bg-teal-500/60"
                        }`} />
                        {notif.title}
                      </p>
                      <p className="text-[#B7BCC7] text-[11px] leading-relaxed pl-3">{notif.message}</p>
                      <p className="text-[9px] text-[#B7BCC7]/40 font-mono pl-3">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Trigger WhatsApp Assistant Side-Drawer */}
          <button
            onClick={() => setIsWhatsAppOpen(!isWhatsAppOpen)}
            className={`p-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors ${
              isWhatsAppOpen 
                ? "bg-[#075E54] text-white" 
                : "bg-[#075E54]/10 text-[#075E54] hover:bg-[#075E54]/20 border border-[#075E54]/30"
            }`}
            title="Toggle WhatsApp Assistant Emulator"
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">WhatsApp Emulator</span>
          </button>

          {/* Profile & Account Dropdown Trigger */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2 p-1.5 pl-2.5 bg-[#1B1B1B] border border-[#2A2A2A] hover:border-teal-500/50 rounded-xl text-white cursor-pointer transition-colors"
              title="Profile & Account Menu"
              id="btn-profile-menu-trigger"
            >
              <span className="w-6 h-6 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-xs uppercase">
                {currentShop?.name ? currentShop.name.charAt(0) : "R"}
              </span>
              <span className="hidden sm:inline text-xs font-bold text-slate-200 max-w-[120px] truncate">
                {currentShop?.name || "Account"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-[#121212] border border-[#3F3F46] rounded-2xl shadow-2xl z-50 p-4 space-y-3 animate-scale-up text-white"
                id="profile-dropdown-menu"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="w-10 h-10 rounded-full bg-teal-500 text-slate-950 font-black flex items-center justify-center text-base uppercase shrink-0">
                      {currentShop?.name ? currentShop.name.charAt(0) : "R"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-white truncate">{currentShop?.name}</p>
                      <p className="text-xs text-slate-400 font-mono truncate">{currentShop?.ownerUsername}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[10px] font-bold uppercase rounded-md">
                        Pro Store Active
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                    title="Close Profile Menu"
                    id="btn-close-profile-menu-x"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule("website");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#1B1B1B] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-teal-400" /> Store Website Settings
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule("subscription");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#1B1B1B] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-teal-400" /> Subscription & Billing
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModule("staff");
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-[#1B1B1B] hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <Users className="w-4 h-4 text-teal-400" /> Staff Management
                  </button>
                </div>

                <div className="pt-2 border-t border-[#2A2A2A] space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setShowLogoutConfirmModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                    id="btn-logout-from-profile-menu"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" /> Log Out
                  </button>

                  {/* Cancel Button at Bottom of Dropdown */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full py-2 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-center"
                    id="btn-cancel-profile-menu"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. MAIN APPLICATION CONTENT WRAPPER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* MOBILE SIDEBAR BACKDROP OVERLAY */}
        {isMobileSidebarOpen && (
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-30 transition-opacity cursor-pointer"
            id="mobile-sidebar-backdrop"
          />
        )}

        {/* SIDEBAR NAVIGATION RAIL */}
        <aside className={`
          fixed md:relative inset-y-0 left-0 w-64 bg-[#121212] border-r border-[#2A2A2A] z-40 transition-transform duration-300 md:translate-x-0 shrink-0
          ${isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="flex flex-col h-full justify-between p-4 bg-[#121212]" id="sidebar-box">
            
            {/* Mobile Header with Cancel / Exit (X) button */}
            <div className="flex items-center justify-between pb-3 mb-1 border-b border-[#2A2A2A] md:hidden">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 bg-teal-500 text-[#0A0A0A] rounded-md flex items-center justify-center font-display font-black text-xs">
                  R
                </span>
                <span className="font-display font-black text-xs tracking-tight text-white uppercase">
                  Navigation Menu
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                id="btn-close-mobile-sidebar-x"
                title="Exit navigation menu"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Nav Menu */}
            <nav className="space-y-1.5" id="nav-rail">
              
              <button
                onClick={() => { setActiveModule("dashboard"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "dashboard" 
                    ? "bg-teal-500 text-black shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" /> Dashboard
              </button>

              <button
                onClick={() => { setActiveModule("inventory"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "inventory" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <Package className="w-4 h-4 shrink-0" /> Inventory
              </button>

              <button
                onClick={() => { setActiveModule("sales"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "sales" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <ShoppingCart className="w-4 h-4 shrink-0" /> Sales
              </button>

              <button
                onClick={() => { setActiveModule("customers"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "customers" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" /> Customers
              </button>

              <button
                onClick={() => { setActiveModule("reports"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "reports" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <FileText className="w-4 h-4 shrink-0" /> Reports
              </button>

              <button
                onClick={() => { setActiveModule("website"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "website" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <Globe className="w-4 h-4 shrink-0" /> Website
              </button>

              <button
                onClick={() => { setActiveModule("staff"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "staff" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" /> Staff
              </button>

              <button
                onClick={() => { setActiveModule("subscription"); resetQuickActions(); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold font-display uppercase tracking-wider text-left transition-all cursor-pointer ${
                  activeModule === "subscription" 
                    ? "bg-teal-500 text-[#0A0A0A] shadow-lg shadow-teal-500/10 font-black" 
                    : "text-[#B7BCC7] hover:bg-[#1B1B1B] hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </button>

            </nav>

            {/* Profile context footer */}
            <div className="border-t border-[#2A2A2A] pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 p-1 text-xs">
                <span className="w-8 h-8 rounded-full bg-teal-500 text-[#0A0A0A] font-display font-black flex items-center justify-center text-xs uppercase">
                  {currentShop.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{currentShop.name}</p>
                  <p className="text-[10px] text-[#B7BCC7]/60 font-mono truncate">{currentShop.ownerUsername}</p>
                </div>
              </div>
              <a 
                href={`/#/shop/${currentShop.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-2 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-xl text-[10px] font-bold font-display uppercase tracking-wider text-white flex items-center justify-center gap-1"
              >
                <span>View Store Catalog</span> <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
              </a>

              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(true)}
                className="w-full py-2 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center justify-center gap-2 cursor-pointer transition-colors mt-1"
                id="btn-sidebar-logout"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>

          </div>
        </aside>

        {/* ACTIVE MODULE CONTAINER VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 relative bg-[#0F1115]">
          
          {/* SUBSCRIPTION LOCKED BANNER BLOCK (IF SIMULATED AS EXPIRED) */}
          {isSimulatedExpired && (
            <div className="bg-rose-950/40 border border-rose-900 p-4 rounded-2xl mb-6 flex items-start gap-3 text-xs text-rose-300 animate-pulse">
              <Lock className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-wider font-mono">⚠️ RESTOCKR SYSTEM SUSPENDED (Expired Plan)</p>
                <p className="text-rose-400">
                  Your store subscription has expired. This workspace is locked in <b>read-only mode</b>. You can view historic stock and sales ledger, but stock upload actions, recording sales, and modifying profiles are disabled. Complete subscription renewal inside billing settings to reactivate.
                </p>
              </div>
            </div>
          )}

          {/* ACTIVE SUB-MODULE RENDERING */}
          <div className={`${isSimulatedExpired ? "pointer-events-none opacity-85" : ""}`}>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeModule === "dashboard" && (
                  <DashboardOverview
                    products={products}
                    sales={sales}
                    staff={staff}
                    unreadNotificationsCount={unreadNotificationsCount}
                    onNavigate={(m) => setActiveModule(m)}
                    onQuickAction={handleQuickAction}
                  />
                )}

                {activeModule === "inventory" && (
                  <InventoryManager
                    shopId={currentShop.id}
                    shop={currentShop}
                    products={products}
                    onSaveProduct={(p) => {
                      db.saveProduct(p);
                      // log audit
                      db.addAuditLog(currentShop.id, "Owner", "Owner", "Product Modified", `Modified product: ${p.brand} ${p.model} (${p.storage})`);
                    }}
                    onDeleteProduct={(id) => {
                      db.deleteProduct(currentShop.id, id);
                      db.addAuditLog(currentShop.id, "Owner", "Owner", "Product Removed", "Deleted a product line from active inventory.");
                    }}
                    onSaveSale={(sale) => {
                      db.saveSale(sale);
                    }}
                    showAddFormImmediately={showAddProductWizard}
                    onCloseQuickForm={() => setShowAddProductWizard(false)}
                  />
                )}

                {activeModule === "sales" && (
                  <SalesManager
                    products={products}
                    sales={sales}
                    shop={currentShop}
                    onSaveSale={(sale) => db.saveSale(sale)}
                    onUndoSale={(id, perf) => db.undoSale(currentShop.id, id, perf)}
                    onRequestNavigateToInventory={() => setActiveModule("inventory")}
                  />
                )}

                {activeModule === "customers" && (
                  <CustomerManager
                    customers={customers}
                    onSaveCustomer={(c) => {
                      db.saveCustomer(c);
                      db.addAuditLog(currentShop.id, "Owner", "Owner", "Customer Updated", `Configured notes on customer ${c.name}.`);
                    }}
                  />
                )}

                {activeModule === "reports" && (
                  <ReportsManager
                    products={products}
                    sales={sales}
                  />
                )}

                {activeModule === "website" && (
                  <WebsiteSettings
                    shop={currentShop}
                    onSaveSettings={(settings) => db.updateShopSettings(currentShop.id, settings)}
                    onSaveProfile={(profile) => db.updateShopProfile(currentShop.id, profile)}
                  />
                )}

                {activeModule === "staff" && (
                  <StaffManager
                    shopId={currentShop.id}
                    staffList={staff}
                    onSaveStaff={(member) => db.saveStaff(member)}
                    onDeleteStaff={(id) => db.deleteStaff(currentShop.id, id)}
                  />
                )}

                {activeModule === "subscription" && (
                  <SettingsSubscription
                    shop={currentShop}
                    onUpdateSubscription={(plan, status, expiry) => {
                      const shopsCopy = [...shops];
                      const idx = shopsCopy.findIndex(s => s.id === currentShop.id);
                      if (idx >= 0) {
                        shopsCopy[idx].subscriptionPlan = plan;
                        shopsCopy[idx].subscriptionStatus = status;
                        shopsCopy[idx].subscriptionExpiry = expiry;
                        db.saveShop(shopsCopy[idx]);
                      }
                    }}
                    onSimulateExpiryToggle={setIsSimulatedExpired}
                    isSimulatedExpired={isSimulatedExpired}
                  />
                )}
              </motion.div>
            </AnimatePresence>

          </div>

          {/* Locked Read-only Viewport Mask block to fully lock UI inputs */}
          {isSimulatedExpired && (
            <div className="absolute inset-0 bg-slate-950/10 cursor-not-allowed z-30 select-none" />
          )}

        </main>

        {/* 3. FLOATING WHATSAPP ASSISTANT SIDE-DRAWER */}
        {isWhatsAppOpen && (
          <aside className="fixed inset-y-0 right-0 w-full md:w-[420px] bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-scale-up" id="whatsapp-phone-sidebar">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#075E54] text-white shrink-0 pt-7">
              <span className="text-xs font-mono font-bold">WHATSAPP NATIVE ASSISTANT</span>
              <button
                onClick={() => setIsWhatsAppOpen(false)}
                className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-[#E5DDD5]">
              <WhatsAppEmulator
                shopId={currentShop.id}
                products={products}
                sales={sales}
                staffList={staff}
                onSaveProduct={(p) => db.saveProduct(p)}
                onSaveSale={(s) => db.saveSale(s)}
                onUndoLastSale={async (shopId, saleId, perf) => db.undoSale(shopId, saleId, perf)}
                isExpired={isSimulatedExpired}
              />
            </div>
          </aside>
        )}

      </div>

      {/* 4. LOGOUT CONFIRMATION DIALOG MODAL */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-fade-in" id="logout-confirmation-modal">
          <div className="bg-[#121212] border border-[#3F3F46] rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-scale-up text-white space-y-5" id="logout-modal-container">
            <div className="flex items-center gap-3.5 text-rose-400">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 shrink-0">
                <LogOut className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-black text-lg text-white">Log out?</h3>
                <p className="text-xs text-slate-400">Are you sure you want to log out of RESTOCKR?</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2A2A]">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="px-4 py-2.5 bg-[#1B1B1B] hover:bg-[#2A2A2A] border border-[#2A2A2A] rounded-xl text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors"
                id="btn-cancel-logout-dialog"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  handleLogout();
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-rose-600/20"
                id="btn-confirm-logout-dialog"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
