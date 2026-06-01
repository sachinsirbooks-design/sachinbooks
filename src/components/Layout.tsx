import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Phone, 
  Mail, 
  MapPin,
  ShoppingBag, 
  Search, 
  User as UserIcon, 
  Heart, 
  Menu, 
  X, 
  MessageCircle,
  BookOpen,
  ArrowRight,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ClipboardList,
  Sparkles,
  Percent,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { cn } from '../lib/utils';
import { DECCAN_HOT_RELEASES } from '../data/deccanBooks';
import toast from 'react-hot-toast';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    login, 
    logout, 
    isAdmin, 
    isAuthModalOpen, 
    setAuthModalOpen, 
    loginWithEmail, 
    signUpWithEmail, 
    loginWithGoogle 
  } = useAuth();
  const { settings } = useSettings();

  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setAuthEmail('');
      setAuthPassword('');
      setAuthConfirmPassword('');
      setAuthName('');
      setAuthLoading(false);
      setShowPassword(false);
      setAuthError(null);
    }
  }, [isAuthModalOpen]);

  useEffect(() => {
    setAuthError(null);
  }, [authTab]);

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      console.error(e);
      setAuthError(e?.message || String(e));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      await loginWithEmail(authEmail, authPassword);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        setAuthError('operation-not-allowed');
      } else {
        setAuthError(err?.message || String(err));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword !== authConfirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signUpWithEmail(authEmail, authPassword, authName);
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed')) {
        setAuthError('operation-not-allowed');
      } else {
        setAuthError(err?.message || String(err));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const getDriveImageUrl = (driveUrl: string) => {
    if (!driveUrl) return '';
    const match = driveUrl.match(/[-\w]{25,}/);
    return match ? `https://lh3.googleusercontent.com/d/${match[0]}` : driveUrl;
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      let url = `/search?q=${encodeURIComponent(searchQuery)}`;
      if (selectedCategory !== 'all') {
        url += `&cat=${encodeURIComponent(selectedCategory)}`;
      }
      navigate(url);
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  // Generate real search suggestions based on current keypresses
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const filtered = DECCAN_HOT_RELEASES.filter(b => 
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
    setSuggestions(filtered);
  }, [searchQuery]);

  const { totalItems } = useCart();
  const { items: wishlistItems } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setShowSuggestions(false);
  }, [location.pathname]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 selection:bg-red-100 selection:text-red-900">
      {settings && (
        <Helmet>
          <title>{settings.seo.title}</title>
          <meta name="description" content={settings.seo.description} />
          <meta name="keywords" content={settings.seo.keywords} />
        </Helmet>
      )}

      {/* Top Mini Bar / Announcements Banner */}
      <div className="bg-[#1a0003] text-neutral-300 text-[10px] md:text-xs py-2 text-center select-none font-medium z-50">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12 flex items-center justify-center gap-2">
          <span className="inline-block px-1.5 py-0.5 bg-orange-600 text-white font-black text-[9px] rounded uppercase">OFFER</span>
          <span>{settings?.announcement || "🎉 Free shipping on orders above ₹3,000! Standard delivery in 48 Hours. Helpline: +91 9850578039"}</span>
        </div>
      </div>

      {/* Header Layout (Sticky top with Deccan Maroon Identity) */}
      <header className="sticky top-0 bg-white shadow-md shadow-neutral-100 border-b border-neutral-100 z-40 transition-all">
        {/* Main interactive row */}
        <div className="max-w-[1850px] mx-auto px-4 md:px-12 py-3.5 flex items-center justify-between gap-4 md:gap-8">
          
          {/* Deccan-Inspired Premium Brand Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            {/* Elegant Circle Logo conforming back to Indian Red Maroon styling requested */}
            {settings?.logoUrl ? (
              <img 
                src={getDriveImageUrl(settings.logoUrl)} 
                alt="SSB Logo" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallbackEl = document.getElementById('fallback-logo-circle');
                  if (fallbackEl) fallbackEl.style.display = 'flex';
                }}
                className="w-12 h-12 rounded-2xl object-cover shadow-lg ring-2 ring-red-500/10 group-hover:scale-105 transition-transform duration-300" 
              />
            ) : null}
            <div 
              id="fallback-logo-circle"
              style={{ display: settings?.logoUrl ? 'none' : 'flex' }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-700 to-red-950 flex flex-col items-center justify-center text-white font-display font-black text-xs shadow-lg ring-2 ring-red-500/10 group-hover:scale-105 transition-transform duration-300"
            >
              <span className="leading-none text-orange-400">SSB</span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 font-sans">
                <span className="font-display font-black text-base text-neutral-900 tracking-tight leading-none group-hover:text-red-700 transition-colors uppercase">Sachin Sir</span>
                <span className="font-sans font-black text-[10px] text-orange-500 tracking-widest leading-none">BOOKS</span>
              </div>
              <span className="text-[8px] text-neutral-400 font-sans font-black tracking-wider uppercase mt-1">SUCCESS SIMPLIFIED • PUNE</span>
            </div>
          </Link>

          {/* Center Search Engine with Auto-Suggestion Dropdown */}
          <div className="flex-1 max-w-xl mx-auto hidden md:block relative">
            <form onSubmit={handleSearch} className="flex items-center bg-neutral-100/90 hover:bg-neutral-100 border border-neutral-200/60 rounded-xl px-2.5 py-1.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-red-700/15 focus-within:border-red-700/40 relative">
              
              <Search size={15} className="text-neutral-400 mr-2 shrink-0" />
              
              <input 
                type="text" 
                value={searchQuery}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search authors, MPSC books, publications..." 
                className="bg-transparent border-none outline-none text-xs w-full text-neutral-800 font-semibold placeholder-neutral-400"
              />
              
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); setSuggestions([]); }}
                  className="p-1 text-neutral-400 hover:text-neutral-900"
                >
                  <X size={13} />
                </button>
              )}
            </form>

            {/* Smart Suggestion Overlay Drawer */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[110%] left-0 right-0 bg-white border border-neutral-200/75 shadow-2xl rounded-2xl p-2 z-50 overflow-hidden max-h-96">
                <p className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-3 py-1.5 border-b border-neutral-50 flex items-center gap-1.5">
                  <Sparkles size={11} className="text-orange-500" /> Auto Suggestions Matches ({suggestions.length})
                </p>
                <div className="divide-y divide-neutral-50">
                  {suggestions.map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleSuggestionClick(book.id)}
                      className="w-full text-left px-3 py-2 hover:bg-neutral-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-10 bg-red-950/5 border border-neutral-100 rounded overflow-hidden select-none shrink-0 flex items-center justify-center text-[7px] font-bold text-red-900 font-serif p-0.5">
                        र
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-neutral-800 truncate leading-tight">{book.title}</p>
                        <p className="text-[10px] text-neutral-400 truncate leading-tight mt-0.5">{book.author} • <span className="text-red-700 font-semibold">{book.publication}</span></p>
                      </div>
                      <span className="text-xs font-mono font-bold text-red-700 shrink-0">₹{book.finalPrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Click-out barrier */}
            {showSuggestions && searchQuery && (
              <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)} />
            )}
          </div>

          {/* Right side functional labeled grid */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0 text-neutral-700">
            {/* Search toggle on mobile */}
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="md:hidden p-2 hover:text-red-700 hover:bg-neutral-50 rounded-xl transition-colors shrink-0"
            >
              <Search size={20} />
            </button>

            {/* Account / Login Tab */}
            {user ? (
              <Link to="/profile" className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors">
                <UserIcon size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Account</span>
              </Link>
            ) : (
              <button onClick={login} className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors cursor-pointer">
                <UserIcon size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Login</span>
              </button>
            )}

            {/* Wishlist Link item */}
            <Link to="/wishlist" className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors relative">
              <div className="relative">
                <Heart size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                    {wishlistItems.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Wishlist</span>
            </Link>

            {/* Cart with count */}
            <Link to="/cart" className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors relative">
              <div className="relative">
                <ShoppingBag size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-[#800020] text-white text-[9px] font-black rounded-full px-1.5 flex items-center justify-center leading-none ring-1 ring-white">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Cart</span>
            </Link>

            {/* Direct Orders Dashboard link */}
            {user ? (
              <Link to="/profile?tab=orders" className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors">
                <ClipboardList size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Orders</span>
              </Link>
            ) : (
              <button 
                onClick={async () => {
                  toast.error("Please login/sign in first to view your orders.");
                  await login();
                }} 
                className="flex flex-col items-center group text-neutral-500 hover:text-red-700 transition-colors cursor-pointer bg-transparent border-0 p-0"
              >
                <ClipboardList size={18} className="text-neutral-500 group-hover:text-red-700 group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Orders</span>
              </button>
            )}

            {/* Dedicated Staff Portal Button - Only visible to authenticated Staff */}
            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex flex-col items-center group text-teal-600 hover:text-teal-700 transition-colors"
                title="Staff Panel (Administrators)"
                id="staff-portal-header-btn"
              >
                <ShieldCheck size={18} className="text-teal-600 group-hover:scale-105 transition-transform shrink-0" />
                <span className="text-[9px] font-extrabold uppercase mt-1 tracking-wide hidden sm:block">Staff Hub</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Overlay Drawer */}
        <AnimatePresence>
           {isSearchOpen && (
             <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="md:hidden bg-white border-t border-neutral-100 overflow-hidden"
             >
                <form onSubmit={handleSearch} className="p-3 flex items-center gap-2">
                   <div className="flex-1 flex items-center bg-neutral-100 border border-neutral-200/80 rounded-xl px-3 py-1.5 mt-1">
                      <Search size={14} className="text-neutral-400 mr-2 shrink-0" />
                      <input 
                        autoFocus
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..." 
                        className="bg-transparent border-none outline-none text-xs w-full font-semibold"
                      />
                   </div>
                   <button 
                     type="button" 
                     onClick={() => setIsSearchOpen(false)}
                     className="text-xs font-bold text-red-700 uppercase"
                   >
                     Cancel
                   </button>
                </form>
             </motion.div>
           )}
        </AnimatePresence>

        {/* Categories Ribbon bar stretching at the bottom of header */}
        <div className="border-t border-neutral-100 bg-[#7a0016] text-white overflow-x-auto no-scrollbar scroll-smooth">
          <div className="max-w-[1850px] mx-auto px-4 md:px-12 flex items-center justify-between gap-4 h-11 whitespace-nowrap text-xs text-neutral-150 font-medium">
            <div className="flex items-center gap-1.5 md:gap-5 text-white/90">
              {[
                { label: 'चालू घडामोडी', path: '/category/current-affairs' },
                { label: 'इतिहास', path: '/category/history' },
                { label: 'भूगोल', path: '/category/geography' },
                { label: 'अर्थशास्त्र', path: '/category/economics' },
                { label: 'राज्यव्यवस्था', path: '/category/polity' },
                { label: 'विज्ञान', path: '/category/science' },
                { label: 'गणित / बुद्धिमत्ता', path: '/category/maths-reasoning' },
                { label: 'मराठी व्याकरण', path: '/category/marathi-grammar' },
                { label: 'इंग्रजी व्याकरण', path: '/category/english' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact Us', path: '/contact' }
              ].map((sub, i) => (
                <React.Fragment key={i}>
                  <Link 
                    to={sub.path}
                    className="hover:text-amber-300 font-bold transition-colors py-1 focus:outline-none"
                  >
                    {sub.label}
                  </Link>
                  {i < 10 && (
                    <span className="text-white/20 text-[10px] select-none">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Mobile Sidebar Hamburger pull Trigger */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1 px-2.5 bg-black/15 hover:bg-black/35 rounded-full text-white transition-all flex items-center gap-1 border border-white/10 shrink-0"
            >
              <Menu size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">MENU</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu slide in */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
               initial={{ x: '-100%' }}
               animate={{ x: 0 }}
               exit={{ x: '-100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[101] flex flex-col p-6 overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 border-b border-neutral-100 pb-4">
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#800020] rounded-lg flex items-center justify-center text-white font-black text-[10px]">
                    SSB
                  </div>
                  <span className="font-display font-black text-base text-neutral-800 tracking-tight">SACHIN SIR BOOKS</span>
                </Link>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-neutral-400 hover:text-neutral-900 bg-neutral-50 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-5">
                <Link to="/" className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                  Home <ArrowRight size={16} />
                </Link>
                <Link to="/categories" className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                  All Categories <ArrowRight size={16} />
                </Link>
                <Link to="/wishlist" className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                  Wishlist <ArrowRight size={16} />
                </Link>
                {user ? (
                  <Link to="/profile?tab=orders" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                    My Orders <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button 
                    onClick={async () => {
                      setIsMobileMenuOpen(false);
                      toast.error("Please login/sign in first to view your orders.");
                      await login();
                    }}
                    className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between text-left w-full bg-transparent border-0 p-0 cursor-pointer"
                  >
                    My Orders <ArrowRight size={16} />
                  </button>
                )}
                <Link to="/about" className="text-lg font-bold text-neutral-850 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                  Our Story <ArrowRight size={16} />
                </Link>

                {/* Dedicated Staff Portal Link in Mobile menu */}
                {isAdmin && (
                  <Link to="/admin" className="text-lg font-black text-teal-600 hover:text-red-700 pb-2 border-b border-neutral-50 flex items-center justify-between">
                    <span className="flex items-center gap-2">🔒 Staff Hub</span> <ArrowRight size={16} />
                  </Link>
                )}
              </div>

              <div className="mt-auto pt-10">
                {!user && (
                  <button 
                    onClick={login}
                    className="w-full py-3 bg-[#800020] text-white rounded-xl font-bold text-sm mb-4 shadow hover:bg-neutral-900 active:scale-95 transition-transform cursor-pointer"
                  >
                    Login / Register
                  </button>
                )}
                <div className="bg-neutral-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-9 h-9 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <MessageCircle size={18} />
                  </div>
                  <div>
                    <h4 className="font-black text-[9px] uppercase tracking-wider text-neutral-400">Direct Support</h4>
                    <span className="font-bold text-xs">+91 9850578039</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>{children}</main>

      {/* Upgraded Premium DeccanBooks Styled Footer */}
      <footer className="bg-neutral-950 text-white pt-16 pb-10 border-t border-white/5">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12">
          
          {/* Main sections grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 md:gap-12 mb-16 border-b border-white/5 pb-16">
            
            {/* Colon 1: Brand details & Newsletter Subscription */}
            <div className="lg:col-span-2 space-y-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center text-white text-xs font-black font-display">
                  SSB
                </div>
                <div className="flex flex-col text-left">
                  <h1 className="font-display text-base font-black leading-none uppercase">
                    Sachin Sir <span className="text-orange-500">Books</span>
                  </h1>
                  <span className="text-[9px] font-black tracking-widest uppercase text-neutral-500 mt-1">
                    EXAM ACADEMIC DIRECTORY
                  </span>
                </div>
              </Link>
              <p className="text-neutral-400 text-xs leading-relaxed max-w-sm">
                Sachin Sir Books is Pune's leading academic, state service, and competitive exam bookstores. Find complete, discounted syllabus notes for MPSC, UPSC, TCS/IBPS preparation.
              </p>
              
              {/* Newsletter subscription form */}
              <div className="space-y-3">
                <h5 className="text-xs font-black uppercase text-orange-400 tracking-wider">Stay Updated with Notes:</h5>
                <form onSubmit={handleNewsletterSubmit} className="flex max-w-sm bg-neutral-900 border border-white/10 rounded-xl overflow-hidden p-1 shadow-inner focus-within:border-orange-500">
                  <input 
                    type="email" 
                    required
                    placeholder="Enter your email ID" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="flex-1 bg-transparent px-3 py-2 text-xs text-white outline-none placeholder-neutral-500"
                  />
                  <button 
                    type="submit"
                    className="bg-red-800 hover:bg-orange-500 text-white px-4 py-2 text-xs font-bold rounded-lg transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
                {newsletterSubscribed && (
                  <p className="text-green-400 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Successfully subscribed for free notes!
                  </p>
                )}
              </div>
            </div>

            {/* Colon 2: Directory subjects */}
            <div>
              <div className="flex items-center gap-2 mb-6 text-orange-400">
                <span className="w-1 h-3.5 bg-red-800" />
                <h4 className="font-display font-black text-xs uppercase tracking-wider">Subjects directory</h4>
              </div>
              <ul className="space-y-3 text-xs text-neutral-400 font-bold">
                <li><Link to="/category/current-affairs" className="hover:text-amber-300 transition-colors">चालू घडामोडी (Current Affairs)</Link></li>
                <li><Link to="/category/geography" className="hover:text-amber-300 transition-colors">भूगोल (Geography)</Link></li>
                <li><Link to="/category/economics" className="hover:text-amber-300 transition-colors">अर्थशास्त्र (Economics)</Link></li>
                <li><Link to="/category/polity" className="hover:text-amber-300 transition-colors">राज्यशास्त्र (Polity)</Link></li>
                <li><Link to="/category/science" className="hover:text-amber-300 transition-colors">विज्ञान (Science)</Link></li>
                <li><Link to="/category/maths" className="hover:text-amber-300 transition-colors">गणित (Mathematics)</Link></li>
              </ul>
            </div>

            {/* Colon 3: Corporate links */}
            <div>
              <div className="flex items-center gap-2 mb-6 text-orange-400">
                <span className="w-1 h-3.5 bg-red-800" />
                <h4 className="font-display font-black text-xs uppercase tracking-wider">Help & Trust Policies</h4>
              </div>
              <ul className="space-y-3 text-xs text-neutral-400 font-bold">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link to="/refund-policy" className="hover:text-white transition-colors">Refund & Return Policy</Link></li>
                <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery Policy</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">About Our Stores</Link></li>
              </ul>
            </div>

            {/* Colon 4: Contact details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-6 text-orange-400">
                <span className="w-1 h-3.5 bg-red-800" />
                <h4 className="font-display font-black text-xs uppercase tracking-wider">Information Desk</h4>
              </div>
              <div className="space-y-4 text-xs text-neutral-400 font-bold leading-relaxed">
                <div className="flex gap-3">
                  <MapPin size={16} className="text-red-700 shrink-0 mt-0.5" />
                  <p>Address: 4th Floor, Nikhil Pride Building, Tilak Rd, Above Siddhi Vinayak DIning Hall, Vijayanagar Colony, Maharshi Nagar, Pune, Maharashtra 411030</p>
                </div>
                <div className="flex gap-3">
                  <Phone size={15} className="text-red-700 shrink-0 mt-0.5" />
                  <p>+91 9850578039</p>
                </div>
                <div className="flex gap-3">
                  <Mail size={15} className="text-red-700 shrink-0 mt-0.5" />
                  <p className="truncate">Shermale4009@gmail.com</p>
                </div>
              </div>
            </div>

          </div>

          {/* Social media footer strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8 text-neutral-500 font-bold text-[11px] uppercase tracking-wider">
            <p className="text-center sm:text-left">
              © 2026 SACHIN SIR BOOKS PUNE. ALL RIGHTS RESERVED.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-2 items-center justify-center sm:justify-end">
              <Link to="/privacy" className="hover:text-orange-500 transition-colors">PRIVACY</Link>
              <Link to="/terms" className="hover:text-orange-500 transition-colors">TERMS</Link>
              <Link to="/refund-policy" className="hover:text-orange-500 transition-colors">REFUNDS</Link>
              <Link to="/shipping-policy" className="hover:text-orange-500 transition-colors">SHIPPING</Link>
              <Link 
                to="/admin/login" 
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-800 text-amber-500 hover:text-white hover:border-red-800 rounded-lg transition-all font-display text-[9px] font-black tracking-widest leading-none"
                title="Secure Staff Area Access Portal"
                id="staff-footer-portal-link"
              >
                🔒 STAFF ONLY
              </Link>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Chat assistance (Premium Custom Smaller Glassmorphic Version) */}
      {settings?.whatsappChatbot?.enabled && settings?.whatsappChatbot?.phoneNumber && (
        <a 
          href={`https://wa.me/${settings.whatsappChatbot.phoneNumber.replace('+', '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[40] flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-xl backdrop-blur-md border border-white/20 select-none scale-100 hover:scale-115 active:scale-90 transition-all duration-300 group"
          title="WhatsApp Support"
        >
          <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 animate-ping pointer-events-none group-hover:opacity-0 transition-opacity" />
          <MessageCircle size={20} className="relative z-10 shrink-0" />
        </a>
      )}

      {/* Dynamic Email / Password Student Auth Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!authLoading) setAuthModalOpen(false);
              }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white rounded-[2rem] w-full max-w-md relative z-10 overflow-hidden shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setAuthModalOpen(false)}
                disabled={authLoading}
                className="absolute top-4 right-4 text-neutral-400 hover:text-red-750 transition-colors p-2 rounded-full hover:bg-neutral-50 cursor-pointer disabled:opacity-50"
              >
                <X size={20} />
              </button>

              <div className="p-8 sm:p-10 flex-1 overflow-y-auto">
                {/* Logo and Label */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-[#800020] rounded-2xl flex items-center justify-center text-white mx-auto mb-3 font-black text-xl rotate-3 shadow-lg shadow-red-900/20">
                    SD
                  </div>
                  <h3 className="text-2xl font-display font-medium tracking-tight text-neutral-900">
                    Student <span className="text-[#800020] italic font-bold">Portal.</span>
                  </h3>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#800020] mt-1">Sachin Dhawale's Academy</p>
                </div>

                {/* Sub-tab Switch */}
                <div className="flex bg-neutral-100 p-1.5 rounded-full mb-6">
                  <button 
                    onClick={() => { setAuthTab('signin'); }}
                    className={cn(
                      "flex-1 py-2 rounded-full font-display font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                      authTab === 'signin' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => { setAuthTab('signup'); }}
                    className={cn(
                      "flex-1 py-2 rounded-full font-display font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer",
                      authTab === 'signup' ? "bg-white text-[#800020] shadow-sm" : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    Register / Sign Up
                  </button>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="mb-6 rounded-2xl text-left text-xs leading-relaxed overflow-hidden">
                    {authError === 'operation-not-allowed' ? (
                      <div className="text-amber-800 bg-amber-50 border border-amber-200/60 p-4">
                        <p className="font-bold mb-1.5 flex items-center gap-1.5 text-amber-900">
                          ⚠️ Email Provider is Disabled
                        </p>
                        <p className="text-[11px] text-neutral-600 mb-3">
                          Firebase Email/Password Authentication is disabled by default for this Firebase project.
                        </p>
                        <div className="bg-white p-3 rounded-xl border border-amber-200/50 space-y-1.5 text-[11px] text-neutral-700">
                          <p className="font-bold text-neutral-800">To enable Email/Password auth:</p>
                          <ol className="list-decimal pl-4 space-y-1 text-neutral-600">
                            <li>Open the <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-amber-900 hover:text-amber-700">Firebase Console</a></li>
                            <li>Navigate to <span className="font-medium text-neutral-900">Build &gt; Authentication</span></li>
                            <li>Select the <span className="font-medium text-neutral-900">Sign-in method</span> tab</li>
                            <li>Click <span className="font-medium text-neutral-900">Add new provider</span> &gt; choose <span className="font-bold text-neutral-900">Email/Password</span></li>
                            <li>Turn on **Enable** and click <span className="font-bold text-neutral-900">Save</span>.</li>
                          </ol>
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-2 font-medium">
                          💡 <strong>Instant Test:</strong> You can skip setup and sign in immediately with your Google account using the <strong>Continue with Google</strong> option below!
                        </p>
                      </div>
                    ) : (
                      <div className="text-red-800 bg-red-50 border border-red-200 p-3.5 rounded-2xl flex flex-col gap-1">
                        <span className="font-bold text-red-900">Authentication Error:</span>
                        <span className="text-neutral-700 text-[11px]">{authError}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Forms */}
                {authTab === 'signin' ? (
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type="email" 
                          required
                          value={authEmail}
                          onChange={e => setAuthEmail(e.target.value)}
                          placeholder="student@example.com"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Signing in...' : 'Sign In'} <LogIn size={15} />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleEmailSignUp} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Full Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type="text" 
                          required
                          value={authName}
                          onChange={e => setAuthName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type="email" 
                          required
                          value={authEmail}
                          onChange={e => setAuthEmail(e.target.value)}
                          placeholder="student@example.com"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black tracking-widest text-neutral-400">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input 
                          type="password" 
                          required
                          value={authConfirmPassword}
                          onChange={e => setAuthConfirmPassword(e.target.value)}
                          placeholder="Repeat password"
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#800020] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-3.5 bg-[#800020] text-white hover:bg-neutral-900 rounded-xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {authLoading ? 'Signing up...' : 'Create Account'} <UserPlus size={15} />
                    </button>
                  </form>
                )}

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                    <span className="bg-white px-3 font-extrabold text-neutral-400">OR</span>
                  </div>
                </div>

                {/* Google Sign In option */}
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full py-3.5 border border-neutral-250 bg-white text-neutral-700 hover:bg-neutral-50 rounded-xl font-sans font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Continue with Google
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

