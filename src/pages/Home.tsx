import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  TrendingUp, 
  Star, 
  Clock, 
  ShieldCheck, 
  Truck, 
  Zap,
  ShoppingBag,
  Heart,
  BookOpen,
  Briefcase,
  GraduationCap,
  Sparkles,
  Layers,
  Flag,
  Globe,
  Calendar,
  Feather,
  FileText,
  Plus,
  Check,
  CheckCircle2,
  Users,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Phone,
  Percent
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Book, Category, Banner, StudySet } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';

import { addDoc, collection, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { DECCAN_HOT_RELEASES } from '../data/deccanBooks';
import BookCoverPresenter from '../components/BookCoverPresenter';
import BookCard from '../components/BookCard';

// Icon mapper for categories
const ICON_MAP: Record<string, React.ReactNode> = {
  'sachin-dhawale-publication': <BookOpen className="w-5 h-5" />,
  'mpsc-books': <Briefcase className="w-5 h-5" />,
  'saral-seva-books': <GraduationCap className="w-5 h-5" />,
  'new-books': <Sparkles className="w-5 h-5" />,
  'all-books': <Layers className="w-5 h-5" />,
  'polity': <Flag className="w-5 h-5" />,
  'economics': <TrendingUp className="w-5 h-5" />,
  'science': <Sparkles className="w-5 h-5" />,
  'maths-reasoning': <Layers className="w-5 h-5" />,
  'history': <Globe className="w-5 h-5" />,
  'geography': <Globe className="w-5 h-5" />,
  'current-affairs': <Calendar className="w-5 h-5" />,
  'hindi': <Feather className="w-5 h-5" />,
  'marathi-grammar': <Feather className="w-5 h-5" />,
  'question-papers': <FileText className="w-5 h-5" />,
  'english': <BookOpen className="w-5 h-5" />
};

export default function Home() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [priorityBooks, setPriorityBooks] = useState<Book[]>([]);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Quick box state
  const [quickBoxBook, setQuickBoxBook] = useState<Book | null>(null);

  // Subject wise books state (Maths, Reasoning, Marathi, English)
  const [activeSubject, setActiveSubject] = useState<'maths' | 'reasoning' | 'marathi' | 'english'>('maths');

  // Book wise categories slider state (Maths, Reasoning, MW, RW)
  const [sliderTab, setSliderTab] = useState<'maths' | 'reasoning' | 'mw' | 'rw'>('maths');
  const [sliderQty, setSliderQty] = useState<number>(1);

  // Leads form state
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  // Customized Batch Setup State
  const [selectedBatchBooks, setSelectedBatchBooks] = useState<Record<string, string[]>>({
    'batch-combine': ['SDP-MATH-01', 'SDP-REAS-02', 'LKP-MAR-01'],
    'batch-csat': ['SDP-MATH-01', 'SDP-REAS-02', 'SDP-CSAT-03'],
    'batch-saralseva': ['SDP-PB-04', 'SDP-REAS-02', 'LKP-MAR-01'],
    'batch-master': ['SDP-MATH-01', 'SDP-REAS-02', 'LKP-MAR-01', 'LKP-ENG-02']
  });

  // Simple Notification Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' }>({ show: false, msg: '', type: 'success' });
  const [customTiles, setCustomTiles] = useState<any[]>([]);
  const visualCategoryScrollRef = useRef<HTMLDivElement>(null);
  const sirBooksScrollRef = useRef<HTMLDivElement>(null);
  const [sirBooksTab, setSirBooksTab] = useState<'All' | 'MPSC' | 'UPSC' | 'Banking' | 'Police Bharti' | 'Foundation'>('All');
  const [mainActiveTab, setMainActiveTab] = useState<'combo-wise' | 'batch-wise' | 'sachin-sir-books' | 'combo-offers' | 'best-study-sets' | 'books'>('sachin-sir-books');

  const { addToCart, cart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  const sirBooksStudySets = studySets.map(s => ({
        id: s.id,
        category: s.category || 'MPSC',
        topLabel: s.topLabel || 'SPECIAL SET',
        statusBadge: s.statusBadge || 'Best Seller',
        stats: s.stats || '4.5K Students',
        title: s.title,
        description: s.description,
        price: s.price,
        originalPrice: s.originalPrice,
        booksCount: `+${s.bookIds?.length || 0}`,
        booksIdList: s.bookIds || []
      }));

  const comboStudySets = studySets.filter(s => s.type === 'combo');

  const batchStudySets = studySets.filter(s => s.type === 'batch' || !s.type);

  const triggerToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const handleJoinCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      setFormStatus({ type: 'error', message: 'Please fill in all fields.' });
      return;
    }
    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormStatus({ type: 'success', message: 'Welcome to the circle! We will contact you soon.' });
      setFormData({ name: '', email: '', phone: '' });
      triggerToast('Registration successful! Check your updates.');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'leads');
      setFormStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let bannersData = await storeService.getBanners();
        let allBooksData = await storeService.getBooks(undefined, 40);
        let tilesData = await storeService.getVisualTiles();
        let studySetsData = await storeService.getStudySets();

        if (bannersData.length === 0) {
          console.log("No banners found! Creating default banner...");
          const defaultBanner = {
            title: 'Master Mathematics with Sachin Sir',
            imageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1200',
            mobileImageUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=600',
            link: '/category/sachin-dhawale-publication',
            order: 1,
            active: true
          };
          await storeService.addBanner(defaultBanner);
          bannersData = await storeService.getBanners();
        }
        
        // Display only real books fetched from the database
        const mergedBooks = [...allBooksData];

        setBanners(bannersData);
        setAllBooks(mergedBooks);
        setCustomTiles(tilesData || []);
        setStudySets(studySetsData || []);
        
        // Priority books specifically by Sachin Dhawale's Publication
        const sdpBooks = mergedBooks.filter(b => b.publication && b.publication.includes("Sachin Dhawale"));
        setPriorityBooks(sdpBooks.slice(0, 8));

        // Let's set the Quick Box book to null by default so no popup shows on start
        setQuickBoxBook(null);
      } catch (err) {
        console.error('Error fetching data for Home:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (banners.length === 0 || !isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners, isAutoPlaying]);

  // Integrated Category autoplay slider ticker
  useEffect(() => {
    let intervalId: any;
    const container = visualCategoryScrollRef.current;
    if (!container) return;

    let isHovered = false;
    const handleMouseEnter = () => { isHovered = true; };
    const handleMouseLeave = () => { isHovered = false; };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    intervalId = setInterval(() => {
      if (isHovered) return;
      // Smoothly slide by one card's width
      const cardWidth = window.innerWidth < 640 ? 110 : 154;
      const maxScroll = container.scrollWidth - container.clientWidth;
      
      if (container.scrollLeft >= maxScroll - 15) {
        container.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: cardWidth, behavior: 'smooth' });
      }
    }, 2800);

    return () => {
      clearInterval(intervalId);
      if (container) {
        container.removeEventListener('mouseenter', handleMouseEnter);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [customTiles]);

  // Calculate base categories list
  const baseTiles = React.useMemo(() => {
    const defaultList = [
      {
        name: "Sachin Dhawade Publication",
        slug: "sachin-dhawale-publication",
        icon: (
          <svg viewBox="0 0 100 100" className="w-[68%] h-[68%]">
            <defs>
              <linearGradient id="purpleNeon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d8b4fe" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#581c87" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="43" fill="none" stroke="#e9d5ff" strokeWidth="2.5" opacity="0.8" />
            <circle cx="50" cy="50" r="39" fill="url(#purpleNeon)" />
            <rect x="10" y="32" width="80" height="36" rx="6" fill="#0f052d" transform="rotate(-12 50 50)" stroke="#f472b6" strokeWidth="2.5" />
            <text x="50" y="47" textAnchor="middle" fill="#f472b6" fontSize="10.5" fontWeight="900" fontFamily="system-ui, sans-serif" transform="rotate(-12 50 50)" letterSpacing="1">SACHIN</text>
            <text x="50" y="60" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="system-ui, sans-serif" transform="rotate(-12 50 50)" letterSpacing="0.5">PUBLICATION</text>
          </svg>
        )
      },
      {
        name: "MPSC Books",
        slug: "mpsc",
        icon: (
          <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
            <defs>
              <linearGradient id="domeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#1e40af" />
              </linearGradient>
            </defs>
            <rect x="15" y="70" width="70" height="10" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1.5" />
            <rect x="22" y="52" width="56" height="18" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
            <line x1="28" y1="52" x2="28" y2="70" stroke="#475569" strokeWidth="2" />
            <line x1="36" y1="52" x2="36" y2="70" stroke="#475569" strokeWidth="2" />
            <line x1="44" y1="52" x2="44" y2="70" stroke="#475569" strokeWidth="3" />
            <line x1="52" y1="52" x2="52" y2="70" stroke="#475569" strokeWidth="2" />
            <line x1="60" y1="52" x2="60" y2="70" stroke="#475569" strokeWidth="2" />
            <line x1="68" y1="52" x2="68" y2="70" stroke="#475569" strokeWidth="2" />
            <line x1="76" y1="52" x2="76" y2="70" stroke="#475569" strokeWidth="2" />
            <path d="M34 52 C34 32 66 32 66 52 Z" fill="url(#domeGrad)" stroke="#475569" strokeWidth="1.5" />
            <line x1="50" y1="36" x2="50" y2="18" stroke="#334155" strokeWidth="2.5" />
            <polygon points="50,18 74,24 50,30" fill="#f97316" stroke="#b45309" strokeWidth="0.5" />
          </svg>
        )
      },
      {
        name: "Sarva Seva Books",
        slug: "saral-seva-books",
        icon: (
          <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
            <rect x="36" y="24" width="38" height="52" rx="4" fill="#facc15" stroke="#a16207" strokeWidth="1.5" />
            <line x1="44" y1="38" x2="66" y2="38" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="47" x2="66" y2="47" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="56" x2="66" y2="56" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="65" x2="58" y2="65" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
            <g transform="translate(14, 40) rotate(-45)">
              <rect x="0" y="0" width="8" height="30" fill="#0ea5e9" />
              <polygon points="0,0 4,-8 8,0" fill="#ffedd5" />
              <polygon points="2,-4 4,-8 6,-4" fill="#1e293b" />
              <rect x="0" y="30" width="8" height="5" fill="#f43f5e" />
            </g>
            <circle cx="72" cy="24" r="12" fill="#0284c7" stroke="#000" strokeWidth="1.5" />
            <path d="M72 13 L72 16" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            <line x1="72" y1="24" x2="72" y2="19" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="72" y1="24" x2="77" y2="24" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )
      },
      {
        name: "New Books",
        slug: "new-books",
        icon: (
          <svg viewBox="0 0 100 100" className="w-[62%] h-[62%]">
            <defs>
              <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="65%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            <path d="M50 8C50 8 68 30 68 54C68 72 58 88 46 88C34 88 24 76 24 58C24 38 38 20 50 8Z" fill="url(#flameGrad)" />
            <path d="M50 30C50 30 60 44 60 58C60 70 54 80 46 80C38 80 32 74 32 62C32 48 42 36 54 30Z" fill="#fb923c" opacity="0.9" />
            <path d="M50 48C50 48 55 56 55 64C55 71 50 75 45 75C40 75 36 71 36 65C36 56 44 50 50 48Z" fill="#facc15" />
          </svg>
        )
      },
      {
        name: "All Books",
        slug: "all",
        icon: (
          <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]">
            <rect x="25" y="20" width="50" height="15" rx="2" fill="#a855f7" stroke="#7e22ce" strokeWidth="1.5" />
            <rect x="25" y="40" width="50" height="15" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
            <rect x="25" y="60" width="50" height="15" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <line x1="35" y1="27" x2="65" y2="27" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="35" y1="47" x2="65" y2="47" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <line x1="35" y1="67" x2="65" y2="67" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )
      }
    ];

    const customMapped = (customTiles && customTiles.length > 0) ? customTiles.map(ct => ({
      name: ct.name,
      slug: ct.slug,
      icon: ct.googleDriveUrl || ct.imageUrl ? (
        <img 
          src={getDriveImageUrl(ct.googleDriveUrl || ct.imageUrl)} 
          className="w-full h-full object-contain rounded-lg" 
          alt={ct.name}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-2xl sm:text-4xl select-none">{ct.emoji || "📚"}</span>
      )
    })) : [];

    return [...defaultList, ...customMapped];
  }, [customTiles]);

  // Repeated tiles list so that it fills the entire blank space
  const repeatedTiles = React.useMemo(() => {
    if (baseTiles.length >= 8) {
      return baseTiles;
    }
    return [...baseTiles, ...baseTiles, ...baseTiles, ...baseTiles];
  }, [baseTiles]);

  // Handle direct buy now for Quick Box
  const handleBuyNow = (book: Book) => {
    addToCart(book);
    triggerToast(`Added ${book.title} to cart. Rolling to checkout...`);
    setTimeout(() => {
      navigate('/checkout');
    }, 800);
  };

  // Toggle book selection within a batch package
  const toggleBatchBookSelection = (batchId: string, bookIsbn: string) => {
    setSelectedBatchBooks(prev => {
      const current = prev[batchId] || [];
      const updated = current.includes(bookIsbn)
        ? current.filter(id => id !== bookIsbn)
        : [...current, bookIsbn];
      return { ...prev, [batchId]: updated };
    });
  };

  // Buy entire batch
  const handleBuyCompleteBatch = (batchId: string, packageName: string, flatPrice: number) => {
    const selectedIsbns = selectedBatchBooks[batchId] || [];
    if (selectedIsbns.length === 0) {
      triggerToast('Please select at least one book in this batch.', 'info');
      return;
    }

    let addedCount = 0;
    selectedIsbns.forEach(isbn => {
      const actualBook = allBooks.find(b => b.isbn === isbn);
      if (actualBook && actualBook.status !== 'Out of stock') {
        addToCart(actualBook);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      triggerToast(`Success! Added ${addedCount} coaching books from "${packageName}" to Cart!`, 'success');
    } else {
      triggerToast('Sorry, the selected books in this batch are out of stock.', 'info');
    }
  };

  // Handlers for subject wise catalog navigation
  const getSubjectWiseBooks = () => {
    return allBooks.filter(book => book.subject === activeSubject).slice(0, 8);
  };

  // Pre-configured list of all categories matching EXACT grid request
  const REQ_CATEGORIES = [
    { name: 'Sachin Dhawale Publication', slug: 'sachin-dhawale-publication', type: 'special' },
    { name: 'MPSC Books', slug: 'mpsc-books', type: 'exam' },
    { name: 'Saral Seva Books', slug: 'saral-seva-books', type: 'exam' },
    { name: 'New Books', slug: 'new-books', type: 'special' },
    { name: 'All Books', slug: 'all-books', type: 'special' },
    { name: 'Polity', slug: 'polity', type: 'subject' },
    { name: 'Economics', slug: 'economics', type: 'subject' },
    { name: 'Science', slug: 'science', type: 'subject' },
    { name: 'Maths & Reasoning', slug: 'maths-reasoning', type: 'subject' },
    { name: 'History', slug: 'history', type: 'subject' },
    { name: 'Geography', slug: 'geography', type: 'subject' },
    { name: 'Current Affairs', slug: 'current-affairs', type: 'subject' },
    { name: 'Hindi', slug: 'hindi', type: 'language' },
    { name: 'Marathi Vyakaran', slug: 'marathi-grammar', type: 'language' },
    { name: 'Question Papers', slug: 'question-papers', type: 'practice' },
    { name: 'English', slug: 'english', type: 'language' }
  ];

  // Static combo offers representing gorgeous dual book design
  const staticCombos = [
    {
      id: 'combo-mr',
      title: 'Maths + Reasoning Combo',
      isbn1: 'SDP-MATH-01',
      isbn2: 'SDP-REAS-02',
      badge: 'Bestseller Combo',
      discount: '30% Discount',
      comboPrice: 658,
      normalPrice: 940,
      description: 'The standard conceptual mastery set authored by Sachin Dhawale Sir. Highly recommended starting kit.'
    },
    {
      id: 'combo-saral',
      title: 'Saral Seva Combo Set',
      isbn1: 'SDP-PB-04',
      isbn2: 'SDP-REAS-02',
      badge: 'Recruitment Booster',
      discount: '25% Discount',
      comboPrice: 600,
      normalPrice: 810,
      description: 'TCS/IBPS tailored Arithmetic with master Reasoning shortcut methodology.'
    },
    {
      id: 'combo-lang',
      title: 'Language Mastery Combo',
      isbn1: 'LKP-MAR-01',
      isbn2: 'LKP-ENG-02',
      badge: 'Score Maximiser',
      discount: '20% Discount',
      comboPrice: 699,
      normalPrice: 800,
      description: 'Handpicked Marathi Grammar fast track notes and premium workbook for high-weightage languages.'
    }
  ];

  // Interactive packages for Batch Add
  const staticBatches = [
    {
      id: 'batch-combine',
      title: 'PSI / STI / ASO Combine Batch',
      subtitle: 'Target PSI/STI/ASO Grade-B state services perfectly.',
      discountBadge: '35% Deep Off',
      originalPrice: 1320,
      batchPrice: 850,
      books: [
        { isbn: 'SDP-MATH-01', title: 'Complete Mathematics Guide', author: 'Sachin Dhawale', price: 490 },
        { isbn: 'SDP-REAS-02', title: 'Reasoning Masterclass', author: 'Sachin Dhawale', price: 450 },
        { isbn: 'LKP-MAR-01', title: 'Marathi Grammar Fast Track Booster Sanch', author: 'M. R. Shinde', price: 380 }
      ]
    },
    {
      id: 'batch-csat',
      title: 'MPSC Rajyaseva CSAT Elite Batch',
      subtitle: 'Coaching set to break standard high cut-off barriers.',
      discountBadge: '40% Extreme Value',
      originalPrice: 1460,
      batchPrice: 899,
      books: [
        { isbn: 'SDP-MATH-01', title: 'Complete Mathematics Guide', author: 'Sachin Dhawale', price: 490 },
        { isbn: 'SDP-REAS-02', title: 'Reasoning Masterclass', author: 'Sachin Dhawale', price: 450 },
        { isbn: 'SDP-CSAT-03', title: 'MPSC CSAT Specialist Guidance Book', author: 'Sachin Dhawale', price: 520 }
      ]
    },
    {
      id: 'batch-saralseva',
      title: 'Saral Seva Batch Package',
      subtitle: 'TCS & IBPS examination patterns fully solved.',
      discountBadge: '30% Core Saver',
      originalPrice: 1190,
      batchPrice: 830,
      books: [
        { isbn: 'SDP-PB-04', title: 'Police Bharti Arithmetic & Aptitude Guide', author: 'Sachin Dhawale', price: 360 },
        { isbn: 'SDP-REAS-02', title: 'Reasoning Masterclass', author: 'Sachin Dhawale', price: 450 },
        { isbn: 'LKP-MAR-01', title: 'Marathi Grammar Fast Track Booster Sanch', author: 'M. R. Shinde', price: 380 }
      ]
    },
    {
      id: 'batch-master',
      title: 'Class-One Officers Master Batch',
      subtitle: 'All-inclusive library covering Quant, Logic, Marathi & English.',
      discountBadge: '45% Elite Discount',
      originalPrice: 1740,
      batchPrice: 999,
      books: [
        { isbn: 'SDP-MATH-01', title: 'Complete Mathematics Guide', author: 'Sachin Dhawale', price: 490 },
        { isbn: 'SDP-REAS-02', title: 'Reasoning Masterclass', author: 'Sachin Dhawale', price: 450 },
        { isbn: 'LKP-MAR-01', title: 'Marathi Grammar Fast Track Booster Sanch', author: 'M. R. Shinde', price: 380 },
        { isbn: 'LKP-ENG-02', title: 'English Grammar Workbook', author: 'V. K. Patil', price: 420 }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-neutral-50 min-h-screen font-sans overflow-x-hidden pb-12">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className={cn(
              "fixed bottom-8 left-1/2 z-50 px-8 py-4 rounded-2xl shadow-xl font-display font-bold text-sm tracking-wide text-white min-w-[320px] text-center",
              toast.type === 'success' ? "bg-amber-600" : "bg-neutral-900"
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HERO SECTION */}
      <section className="max-w-[1850px] mx-auto px-4 md:px-12 pt-6 md:pt-10 pb-12">
        <div className="bg-neutral-950 rounded-[2rem] overflow-hidden min-h-[450px] md:h-[550px] lg:h-[600px] relative flex flex-col justify-between group shadow-xl">
          <AnimatePresence mode="wait">
            {banners.length > 0 ? (
              <motion.div
                key={activeBanner}
                initial={{ opacity: 0, scale: 1.01 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.99 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
              >
                {/* Subtle dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent z-10" />
                
                <img
                  src={getDriveImageUrl(banners[activeBanner].imageUrl)}
                  alt={banners[activeBanner].title || 'Offer'}
                  className="w-full h-full object-cover"
                />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:px-14 md:py-12 lg:px-20 lg:py-16">
                  <span className="text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] text-[#f97316] mb-3 leading-none">
                    Featured Academy Spotlight
                  </span>
                  <h2 className="font-display text-3xl md:text-5xl lg:text-[54px] font-bold text-white leading-tight mb-5 max-w-2xl tracking-tight">
                    {banners[activeBanner].title}
                  </h2>
                  {banners[activeBanner].link && (
                    <div>
                      <Link
                        to={banners[activeBanner].link}
                        className="inline-flex items-center gap-3 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-2xl font-display font-bold text-sm transition-all active:scale-95 shadow-lg shadow-amber-500/25"
                      >
                        Explore Catalog <ArrowRight size={18} />
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Fallback static premium slider */
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 to-amber-950 flex flex-col justify-between p-8 md:px-14 md:py-12 lg:px-20 lg:py-16">
                <div className="w-14 h-14 bg-amber-600/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-lg">
                  <Star size={28} className="animate-spin" />
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] text-[#f97316] mb-3 block leading-none">
                    Limited Time Offer
                  </span>
                  <h2 className="font-display text-4xl md:text-5xl lg:text-[54px] font-bold text-white leading-tight mb-5 max-w-2xl tracking-tight">
                    TCS & IBPS Pattern <br/>Reasoning Specialist Notes
                  </h2>
                  <p className="text-neutral-300 font-sans text-sm max-w-xl mb-8 leading-relaxed">
                    Complete shortcut guidelines compiled by Sachin Sir representing verified state administrative formats.
                  </p>
                  <Link
                    to="/category/sachin-dhawale-publication"
                    className="inline-flex items-center gap-3 bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-xl font-display font-bold text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95"
                  >
                    Shop Selections <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Manual Slide Toggles */}
          {banners.length > 1 && (
            <div className="absolute bottom-8 right-12 z-30 flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10">
              <button 
                onClick={() => setActiveBanner(prev => (prev - 1 + banners.length) % banners.length)}
                className="p-1.5 rounded-full text-[#ffffff] hover:bg-white/20 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="text-xs font-bold text-neutral-300 px-2 font-mono">
                {activeBanner + 1}/{banners.length}
              </div>
              <button 
                onClick={() => setActiveBanner(prev => (prev + 1) % banners.length)}
                className="p-1.5 rounded-full text-[#ffffff] hover:bg-white/20 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* PREMIUM DEDICATED SECTION: SACHIN SIR BOOKS */}
      {true && (
        <>
          {/* SUBTLE TOP DIVIDER */}
          <div className="border-t border-neutral-200/40 my-10 max-w-[1850px] mx-auto px-4 md:px-12" id="academic-explorer-divider" />

          <motion.section 
            id="academic-explorer"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="scroll-mt-28 py-14 md:py-16 bg-neutral-50/50 rounded-[3.5rem] px-5 md:px-10 border border-neutral-150/70 max-w-[1850px] mx-auto my-8 relative overflow-hidden"
          >
        {/* Decorative background blur glows */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-950/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full animate-none">
          {/* Top Header Area */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#5c0612] block">
                PREMIUM ACADEMIC PORTAL
              </span>
              <h2 className="font-display font-black text-2xl sm:text-3xl lg:text-4xl text-neutral-900 tracking-tight leading-none uppercase animate-none">
                STUDY CORNER <span className="text-neutral-300 font-normal">/</span> <span className="text-[#5c0612]">अभ्यास दालन</span>
              </h2>
            </div>
            
            <p className="text-xs sm:text-sm font-sans text-neutral-500 leading-relaxed lg:max-w-2xl">
              Switch through our dynamically prepared modules, books, official combo packs, and batch-wise requirements. Built exclusively with Pune's premier competitive standards.
            </p>
          </div>

          {/* Core Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-neutral-150 pb-4 mb-8 overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap font-sans">
              {[
                { id: 'sachin-sir-books' as const, label: "Sachin Sir's Books", mrLabel: "सचิน सर बुक्स" },
                { id: 'combo-wise' as const, label: "Combo Wise", mrLabel: "कॉम्बो नुसार" },
                { id: 'batch-wise' as const, label: "Batch Wise", mrLabel: "बॅच नुसार" },
                { id: 'combo-offers' as const, label: "Combo Offers", mrLabel: "कॉम्बो ऑफर्स" },
                { id: 'best-study-sets' as const, label: "Best Study Sets", mrLabel: "सर्वोत्तम अभ्यास संच" },
                { id: 'books' as const, label: "Books", mrLabel: "पुस्तके" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setMainActiveTab(tab.id)}
                  className={cn(
                    "px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer border flex flex-col items-center justify-center gap-1 min-w-[130px] shadow-xs",
                    mainActiveTab === tab.id
                      ? "bg-[#5c0612] text-white border-[#5c0612] scale-[1.03]"
                      : "bg-[#ffffff] text-neutral-600 hover:text-neutral-900 border-neutral-100 hover:border-[#6d0000]/20"
                  )}
                >
                  <span className="text-[11px] font-black leading-none">{tab.label}</span>
                  <span className="text-[9px] font-bold opacity-80 leading-none">{tab.mrLabel}</span>
                </button>
              ))}
            </div>

            {/* Premium Navigation Arrows for scrollable view row */}
            {mainActiveTab === 'sachin-sir-books' && (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    if (sirBooksScrollRef.current) {
                      sirBooksScrollRef.current.scrollBy({ left: -360, behavior: 'smooth' });
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-all active:scale-95 shadow-sm cursor-pointer animate-none"
                  aria-label="Scroll Back"
                >
                  <ChevronLeft size={18} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => {
                    if (sirBooksScrollRef.current) {
                      sirBooksScrollRef.current.scrollBy({ left: 360, behavior: 'smooth' });
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-neutral-200 hover:border-neutral-400 bg-white hover:bg-neutral-50 flex items-center justify-center text-neutral-700 transition-all active:scale-95 shadow-sm cursor-pointer animate-none"
                  aria-label="Scroll Next"
                >
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              </div>
            )}
          </div>

          {/* Scrolling Book Cards Row */}
          <div 
            ref={sirBooksScrollRef}
            className="flex items-stretch gap-5 overflow-x-auto no-scrollbar scroll-smooth pb-4 px-0.5"
          >
            {sirBooksStudySets
            .filter(set => sirBooksTab === 'All' || set.category === sirBooksTab)
            .map((set) => {
              return (
                <div 
                  key={set.id}
                  className="w-[280px] sm:w-[330px] bg-white rounded-[24px] border border-neutral-100 flex flex-col justify-between p-5 shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group shrink-0"
                >
                  <div>
                    {/* Top badging labels */}
                    <div className="flex items-center justify-between gap-1 mb-4">
                      <span className="text-[9px] font-black uppercase text-[#5c0612]/80 tracking-widest leading-none bg-red-50/70 px-2 py-1 rounded">
                        {set.topLabel}
                      </span>
                      <span className="px-2 py-0.5 bg-green-50/80 border border-green-150 text-green-700 text-[9px] font-bold rounded-full flex items-center gap-0.5 shrink-0">
                        <Users size={9} />
                        {set.stats}
                      </span>
                    </div>

                    {/* Book Stack Overlapping Cover Mockups */}
                    <div className="h-28 relative mb-5 flex items-end">
                      {/* Stack Item 1 */}
                      <div className="relative w-14 h-20 z-10 border border-neutral-200/50 rounded-lg shadow-xs hover:z-50 transition-all overflow-hidden rotate-[-6deg] bg-neutral-100 origin-bottom-left transform group-hover:rotate-[-10deg]">
                        <BookCoverPresenter bookId={set.booksIdList[0]} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Stack Item 2 */}
                      {set.booksIdList[1] && (
                        <div className="absolute left-8 bottom-0 w-14 h-20 z-20 border border-neutral-200/50 rounded-lg shadow-sm hover:z-50 transition-all overflow-hidden rotate-[3deg] bg-neutral-100 origin-bottom transform group-hover:scale-105 group-hover:rotate-0">
                          <BookCoverPresenter bookId={set.booksIdList[1]} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Stack Item 3 */}
                      {set.booksIdList[2] && (
                        <div className="absolute left-16 bottom-1 w-14 h-20 z-30 border border-neutral-200/50 rounded-lg shadow-md hover:z-50 transition-all overflow-hidden rotate-[10deg] bg-neutral-100 origin-bottom-right transform group-hover:rotate-[14deg]">
                          <BookCoverPresenter bookId={set.booksIdList[2]} className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Floating '+X' Counter Badge for extra books */}
                      <div className="absolute left-[110px] top-4 w-8 h-8 rounded-full bg-[#5c0612] text-white flex items-center justify-center text-[10px] font-black tracking-tighter shadow-md z-40 border-2 border-white select-none scale-100 group-hover:scale-110 transition-transform">
                        {set.booksCount}
                      </div>

                      {/* Popular status badge on the right */}
                      <div className="absolute right-0 bottom-1 bg-neutral-900 text-white text-[8px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-inner select-none">
                        {set.statusBadge}
                      </div>
                    </div>

                    {/* Title & Max 2 lines height limited details */}
                    <h3 className="font-display font-black text-sm text-neutral-950 leading-snug tracking-tight mb-2 line-clamp-2 min-h-[40px] group-hover:text-[#5c0612] transition-colors">
                      {set.title}
                    </h3>

                    <p className="text-[11px] text-neutral-500 leading-normal line-clamp-2 min-h-[32px] mb-3">
                      {set.description}
                    </p>
                  </div>

                  <div>
                    {/* Horizontal Divider Line */}
                    <div className="border-t border-neutral-100/80 my-3" />

                    {/* Bottom Row Layout */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-base font-sans font-black text-neutral-950 leading-none">
                          {formatPrice(set.price)}
                        </span>
                        <span className="text-[11px] text-neutral-400 line-through font-semibold mt-1">
                          {formatPrice(set.originalPrice)}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          let foundAny = false;
                          set.booksIdList.forEach(id => {
                            const book = allBooks.find(b => b.id === id);
                            if (book && book.status !== 'Out of stock') {
                              addToCart(book);
                              foundAny = true;
                            }
                          });
                          if (foundAny) {
                            triggerToast(`Added "${set.topLabel}" package successfully to your bag!`, 'success');
                          } else {
                            triggerToast(`"${set.title}" is in high demand! Direct batch links configured.`, 'success');
                          }
                        }}
                        className="px-4 py-2.5 bg-[#5c0612] hover:bg-[#800c1e] text-white text-[10px] font-black tracking-wider uppercase rounded-xl flex items-center gap-1 active:scale-95 hover:shadow-md hover:shadow-red-900/20 shadow-xs transition-all duration-300 cursor-pointer"
                      >
                        <Plus size={11} strokeWidth={2.5} /> Add Set
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>
        </>
      )}

      {/* BRAND NEW SHINY VISUAL CARD CATEGORIES ROW DIRECTLY DOWN TO HERO TAB */}
      <section className="max-w-[1850px] mx-auto px-4 md:px-12 mt-5 pb-4 relative">
        <div className="relative">
          {/* Scrollable Row of Black Cards Container styled with no-scrollbar */}
          <div 
            ref={visualCategoryScrollRef}
            className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth py-3 px-1"
          >
            {repeatedTiles.map((catItem, idx) => (
              <div 
                key={`${catItem.slug}-${idx}`}
                onClick={() => {
                  const targetEl = document.getElementById(`section-${catItem.slug}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    navigate(`/search?q=${catItem.slug}`);
                  }
                }}
                className="flex flex-col items-center shrink-0 group/card cursor-pointer w-[90px] sm:w-[124px] text-center"
                id={`visual-category-${idx}`}
              >
                {/* Visual card box - black background, beautifully rounded, high-contrast, strictly equal-sized */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-950 flex items-center justify-center shadow-lg hover:shadow-black/25 active:scale-95 group-hover/card:scale-105 transform transition-all duration-300 shrink-0">
                  <div className="w-[32px] h-[32px] sm:w-[42px] sm:h-[42px] flex items-center justify-center text-white scale-100 group-hover/card:scale-110 transition-transform">
                    {catItem.icon}
                  </div>
                </div>
                {/* Under-card text label with consistent line clamp and sizing */}
                <span className="text-[11px] sm:text-xs font-sans font-bold text-neutral-800 tracking-tight mt-2.5 text-center leading-snug line-clamp-2 max-w-[80px] sm:max-w-[110px] group-hover/card:text-red-700 transition-colors">
                  {catItem.name}
                </span>
              </div>
            ))}
          </div>

          {/* Right Chevron rounded scroll button exactly as pictured */}
          <button
            onClick={() => {
              if (visualCategoryScrollRef.current) {
                const container = visualCategoryScrollRef.current;
                const maxScroll = container.scrollWidth - container.clientWidth;
                if (container.scrollLeft >= maxScroll - 10) {
                  container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                  container.scrollBy({ left: 240, behavior: 'smooth' });
                }
              }
            }}
            className="absolute right-0 top-[37%] -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center shadow-xl border border-neutral-100 hover:scale-[1.08] active:scale-95 transition-all text-neutral-800 cursor-pointer"
            aria-label="Scroll Categories Right"
          >
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </section>

      {/* 2. SHINY OFFERS TIMER & DYNAMIC ALERTS BAR */}
      <section className="bg-gradient-to-r from-red-950 to-neutral-900 border-y border-red-900/40 text-white py-4 shadow-md overflow-hidden">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            <p className="text-xs md:text-sm font-bold tracking-tight">
              🔥 <span className="text-orange-400 font-extrabold uppercase">TODAY'S SPECIAL DEALS:</span> 40% Discount on selected publications. Offers ending soon!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#a8a29e]">ENDS IN:</span>
            <div className="flex gap-1.5 font-mono text-xs font-black text-orange-400 bg-black/45 px-3 py-1 rounded-lg border border-white/5 shadow-inner">
              <span>04h</span>:<span>52m</span>:<span>18s</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-red-800 text-white rounded font-bold animate-pulse">URGENT</span>
          </div>
        </div>
      </section>

      {/* 3. HORIZONTAL CATEGORISATION CHANNELS WITH MICRO ICONS */}
      <section className="bg-white py-6 border-b border-neutral-100 sticky top-16 md:top-20 z-30 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12 flex items-center justify-between gap-3 text-xs text-neutral-700 font-semibold whitespace-nowrap">
          <div className="flex items-center gap-2 md:gap-4">
            {[
              { label: '🔥 Hot Releases', slug: 'new-books' },
              { label: '🏆 New Arrivals', slug: 'sachin-dhawale-publication' },
              { label: '🌟 Best Sellers', slug: 'best-sellers' },
              { label: '📚 Competitive Exams', slug: 'competitive-exams' },
              { label: '🏫 School Books', slug: 'school-books' },
              { label: '🎓 College Books', slug: 'college-books' },
              { label: '✏️ Stationery', slug: 'stationery' },
              { label: '💡 Current Affairs', slug: 'current-affairs' },
              { label: '🗺️ Geography', slug: 'geography' },
              { label: '⚖️ Polity', slug: 'polity' },
              { label: '📊 Economics', slug: 'economics' },
              { label: '🧪 Science', slug: 'science' },
              { label: '📐 Mathematics', slug: 'mathematics' }
            ].map((cat, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const targetEl = document.getElementById(`section-${cat.slug}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    navigate(`/search?q=${cat.slug}`);
                  }
                }}
                className="px-4 py-2 border border-neutral-100 hover:border-red-900/20 hover:text-red-900 hover:bg-red-50/40 rounded-full transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-red-900/10 cursor-pointer text-xs"
              >
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <Link 
            to="/categories" 
            className="text-xs font-bold text-red-700 hover:underline flex items-center gap-1 shrink-0 bg-red-50/50 px-3 py-2 rounded-full border border-red-50"
          >
            Explore Master Path →
          </Link>
        </div>
      </section>

      {/* 4. DYNAMIC 10 HORIZONTALLY SCROLLABLE BOOK SHELVES */}
      <div className="space-y-12 max-w-[1850px] mx-auto px-4 md:px-12 py-12">
        
        {/* Helper function to generate standardized shelf carousels */}
        {[
          {
            id: 'section-sachin-sir-books',
            title: '👑 Sachin Sir Books',
            badge: 'DIRECT AUTHOR',
            badgeBg: 'bg-[#5c0612]',
            books: allBooks.filter(b => b.isSachinSirBook || b.author?.toLowerCase().includes("sachin dhawale") || b.publication?.toLowerCase().includes("sachin dhawale"))
          },
          {
            id: 'section-new-books',
            title: '1. Hot Releases',
            badge: 'PUNE SPOTLIGHT',
            badgeBg: 'bg-red-900',
            books: allBooks.filter(b => ['rayat-darpan', 'vocab-sanjeevani', 'zero-error-english', 'maharashtra-bhugol', 'rajyaghatana-notes'].includes(b.id))
          },
          {
            id: 'section-new-arrivals',
            title: '2. New Arrivals',
            badge: 'FRESH LOGIC',
            badgeBg: 'bg-emerald-800',
            books: allBooks.filter(b => b.category === 'english' || b.category === 'current-affairs')
          },
          {
            id: 'section-best-sellers',
            title: '3. Best Sellers',
            badge: 'MASTERPIECES',
            badgeBg: 'bg-orange-600',
            books: allBooks.filter(b => b.category === 'mathematics' || b.id === 'vocab-sanjeevani')
          },
          {
            id: 'section-competitive-exams',
            title: '4. Competitive Exam Books',
            badge: 'MPSC FOCUS',
            badgeBg: 'bg-indigo-900',
            books: allBooks.filter(b => b.category === 'competitive-exams' || b.category === 'polity' || b.category === 'history')
          },
          {
            id: 'section-school-books',
            title: '5. School Books',
            badge: 'MAHARASHTRA BOARD',
            badgeBg: 'bg-teal-700',
            books: allBooks.filter(b => b.category === 'school-books' || b.category === 'geography')
          },
          {
            id: 'section-college-books',
            title: '6. College Books',
            badge: 'ACADEMICS',
            badgeBg: 'bg-blue-900',
            books: allBooks.filter(b => b.category === 'college-books')
          },
          {
            id: 'section-stationery',
            title: '7. Stationery & Study Supplies',
            badge: 'CLASSMATE PREMIUM',
            badgeBg: 'bg-amber-600',
            books: allBooks.filter(b => b.category === 'stationery')
          },
          {
            id: 'section-recommended-books',
            title: '8. Recommended Books',
            badge: 'EXPERT RECOMMENDATIONS',
            badgeBg: 'bg-rose-900',
            books: allBooks.filter(b => ['zero-error-english', 'rajyaghatana-notes'].includes(b.id))
          },
          {
            id: 'section-trending-now',
            title: '9. Trending Now',
            badge: 'POPULAR COPIES',
            badgeBg: 'bg-purple-900',
            books: allBooks.filter(b => b.discount >= 35)
          },
          {
            id: 'section-recently-added',
            title: '10. Recently Added',
            badge: 'LATEST PRINTS',
            badgeBg: 'bg-amber-900',
            books: allBooks.slice(0, 5)
          }
        ].map((shelf, shelfIdx) => {
          if (shelf.books.length === 0) return null;

          if (shelf.id === 'section-sachin-sir-books' || shelf.id === 'section-new-books') {
            return (
              <section key={shelf.id} id={shelf.id} className="scroll-mt-28 py-12 md:py-16 bg-neutral-50/50 rounded-[3rem] px-6 md:px-10 border border-neutral-100 my-8">
                {/* Top Header Layout */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 pb-4 border-b border-neutral-200/80 gap-4">
                  {/* Left Side */}
                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
                    {/* Small premium badge/tag */}
                    <span className="bg-[#5c0612] text-white text-[9px] sm:text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                      {shelf.id === 'section-sachin-sir-books' ? 'SACHIN SIR SIGNATURE' : 'SACHIN SIR BOOKS'}
                    </span>
                    {/* Beside it */}
                    <h2 className="font-display font-black text-xl sm:text-2xl md:text-3xl text-neutral-900 tracking-tight flex items-center gap-2">
                      {shelf.title}
                    </h2>
                  </div>
                  
                  {/* Right Side */}
                  <Link 
                    to="/categories"
                    className="text-xs sm:text-sm font-bold text-red-700 hover:text-red-800 transition-colors flex items-center gap-1 hover:translate-x-0.5 duration-200 whitespace-nowrap shrink-0 text-right self-end sm:self-center"
                  >
                    View All Shelf ({shelf.books.length}) →
                  </Link>
                </div>

                {/* Product Shelf Layout */}
                {/* Swipeable on mobile slider, desktop equal columns */}
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-5 md:overflow-x-visible">
                  {shelf.books.map((book) => {
                    const isWishlisted = isInWishlist(book.id);
                    
                    const handleAddToCart = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      addToCart(book);
                      if (triggerToast) {
                        triggerToast(`Added "${book.title}" dynamically to Bag!`, 'success');
                      }
                    };

                    const handleToggleWishlist = (e: React.MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(book);
                      if (triggerToast) {
                        triggerToast(isWishlisted ? 'Removed from Wishlist' : 'Saved to Wishlist', 'success');
                      }
                    };

                    return (
                      <div 
                        key={book.id}
                        className="w-[280px] sm:w-[290px] md:w-auto bg-white border border-neutral-200/80 rounded-[32px] p-6 flex flex-col justify-between group hover:shadow-[0_12px_40px_rgba(92,6,18,0.06)] hover:-translate-y-1.5 transition-all duration-300 snap-start shrink-0 relative h-[525px]"
                      >
                        <div className="flex flex-col flex-1 justify-between h-full">
                          {/* Book image space linking to Product Details */}
                          <Link to={`/book/${book.id}`} className="block flex-shrink-0 relative">
                            <div className="h-[210px] w-full rounded-2xl overflow-hidden relative bg-neutral-900 border border-neutral-100 flex-shrink-0">
                              <BookCoverPresenter bookId={book.id} />
                              <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/10 transition-colors" />

                              {/* Quick View absolute widget */}
                              {setQuickBoxBook && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setQuickBoxBook(book);
                                  }}
                                  className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur shadow-lg text-[10px] font-black text-neutral-900 uppercase py-2 px-3 rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 cursor-pointer text-center"
                                >
                                  👁️ Quick View
                                </button>
                              )}
                            </div>

                            {/* Discount Badge on top-left of image area */}
                            {book.discount > 0 && (
                              <div className="absolute top-3 left-3 bg-orange-500 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm z-10">
                                {book.discount}% OFF
                              </div>
                            )}
                          </Link>

                          {/* Title details */}
                          <div className="space-y-1 mt-4">
                            <Link to={`/book/${book.id}`}>
                              <h4 
                                className="text-neutral-950 font-sans font-extrabold group-hover:text-red-700 transition-colors line-clamp-2 leading-tight tracking-tight scale-y-100 h-[48px] overflow-hidden"
                                style={{ fontSize: '16px' }}
                              >
                                {book.title}
                              </h4>
                            </Link>
                            <p className="text-zinc-400 font-bold tracking-wider uppercase mt-1.5 block truncate text-[10px]">
                              {book.author ? book.author.toUpperCase() : "SACHIN SIR BOOKS"}
                            </p>

                            {/* Star Ratings */}
                            <div className="flex items-center gap-1 text-orange-400 mt-2 h-5">
                              <Star size={11} fill="currentColor" />
                              <Star size={11} fill="currentColor" />
                              <Star size={11} fill="currentColor" />
                              <Star size={11} fill="currentColor" />
                              <Star size={11} fill="currentColor" className="text-neutral-200" />
                              <span className="text-[10px] text-neutral-400 font-bold ml-1.5">(4.2)</span>
                            </div>
                          </div>
                        </div>

                        {/* Pricing metric and controls */}
                        <div className="mt-4 pt-4 border-t border-neutral-100 flex-shrink-0">
                          <div className="flex items-center justify-between mb-4 h-10">
                            <div className="flex items-baseline gap-2">
                              <span className="font-display text-[#5c0612] leading-none text-2xl font-black">
                                {formatPrice(book.finalPrice)}
                              </span>
                              <span className="text-xs text-zinc-400 line-through font-medium leading-none">
                                {formatPrice(book.price)}
                              </span>
                            </div>
                            {book.discount > 0 && (
                              <span className="leading-none text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                                Save {book.discount}%
                              </span>
                            )}
                          </div>

                          {/* Order triggering actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={handleAddToCart}
                              className="flex-1 h-11 bg-black hover:bg-neutral-900 hover:-translate-y-0.5 active:scale-95 text-white text-xs font-bold py-2 px-3 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            >
                              <ShoppingCart size={13} /> Add
                            </button>

                            <button
                              onClick={handleToggleWishlist}
                              className={cn(
                                "h-11 w-11 shrink-0 rounded-full border transition-all active:scale-95 flex items-center justify-center cursor-pointer hover:-translate-y-0.5",
                                isWishlisted
                                  ? "bg-red-50 border-red-100 text-red-500"
                                  : "bg-white border-neutral-200 text-neutral-400 hover:text-red-700 hover:border-neutral-300 animate-none"
                              )}
                            >
                              <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          return (
            <section key={shelf.id} id={shelf.id} className="scroll-mt-28">
              
              {/* Shelf Head */}
              <div className="flex justify-between items-center mb-6 border-b border-neutral-100 pb-3 gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <span className={cn("text-[8px] sm:text-[9px] font-black uppercase text-white px-1.5 sm:px-2 py-0.5 rounded tracking-widest whitespace-nowrap shrink-0", shelf.badgeBg)}>
                    {shelf.badge}
                  </span>
                  <h3 className="font-display font-black text-sm sm:text-xl text-neutral-900 tracking-tight whitespace-nowrap truncate">
                    {shelf.title}
                  </h3>
                </div>
                
                <Link 
                  to="/categories"
                  className="text-[10px] sm:text-xs font-bold text-red-800 hover:text-orange-500 transition-colors flex items-center gap-1 hover:translate-x-0.5 duration-200 whitespace-nowrap shrink-0 text-right self-center"
                >
                  View All Shelf ({shelf.books.length}) →
                </Link>
              </div>

              {/* Horizontally Scrollable Grid container */}
              <div className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory no-scrollbar">
                {shelf.books.map((book) => (
                  <BookCard 
                    key={book.id}
                    book={book}
                    triggerToast={triggerToast}
                    setQuickBoxBook={setQuickBoxBook}
                  />
                ))}
              </div>

              {/* Nested Promotional Combo Banners custom inserts matching requested intervals */}
              {shelfIdx === 2 && (
                <div className="mt-12 bg-gradient-to-r from-red-950 via-red-900 to-[#1a0003] text-white p-8 md:p-10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-red-800/10 mix-blend-color-dodge hover:opacity-80 transition-opacity" />
                  <div className="space-y-4 relative z-10 max-w-xl">
                    <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">PUNE COMMISSIONERS CHOICE</span>
                    <h3 className="font-display text-2xl md:text-3xl font-black leading-tight">MPSC PSI/STI Master Combo Packages</h3>
                    <p className="text-neutral-300 text-xs leading-relaxed">
                      Syllabus-aligned books written by Sachin Dhawale Sir & Appa Hatnure Sir. Complete package includes Mathematics, Indian Constitution notes, and Geography digests.
                    </p>
                    <div className="flex flex-wrap gap-4 items-center">
                      <span className="text-xs font-bold text-white bg-black/35 px-2.5 py-1 rounded border border-white/5">📦 Combo Price: ₹850/- Only</span>
                      <span className="text-xs text-orange-300 line-through">Normal Price: ₹1320</span>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <button 
                      onClick={() => {
                        const sdpMath = allBooks.find(b => b.id === 'maths-dhawale-essential');
                        const rgtNotes = allBooks.find(b => b.id === 'rajyaghatana-notes');
                        if (sdpMath) addToCart(sdpMath);
                        if (rgtNotes) addToCart(rgtNotes);
                        triggerToast("MPSC Master combo packages elements added to your summary cart!", 'success');
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-8 py-3.5 rounded-xl flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                      Buy Combo Pack <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {shelfIdx === 5 && (
                <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-850 text-white p-8 md:p-10 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                  <div className="space-y-4 max-w-xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1a0003]">TCS & IBPS RECRUITMENT FLASH SALE</span>
                    <h3 className="font-display text-2xl md:text-3xl font-black leading-tight">Master Arithmetic & Logical Tricks</h3>
                    <p className="text-neutral-100 text-xs leading-relaxed">
                      Complete revision companion containing previously verified exam answers from 1984 to 2025. Save extreme hours with special fast formulas.
                    </p>
                  </div>
                  <div>
                    <Link
                      to="/category/english"
                      className="inline-block bg-white text-[#800020] hover:bg-[#1a0003] hover:text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg transition-colors cursor-pointer"
                    >
                      Shop Selections Now
                    </Link>
                  </div>
                </div>
              )}

            </section>
          );
        })}

      </div>

      {/* SECTION 1 — CATEGORY GRID */}
      <section className="bg-[#f5f5f5]/60 py-[60px] scroll-mt-24 border-y border-neutral-200/40">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12">
          <div className="max-w-3xl text-left space-y-2 mb-10 px-1">
            <span className="text-[11px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[5px] text-[#6d0000] uppercase block leading-tight break-words">MPSC & GOVERNMENT WORKBOOKS DIRECTORY</span>
            <h2 className="font-display font-black text-[32px] sm:text-[42px] text-[#111111] leading-[1.05] tracking-tight uppercase">
              All Categories / वर्गीकरण
            </h2>
            <p className="text-[18px] leading-[1.7] text-[#7b7b7b] max-w-2xl">
              Complete exam study material, practice papers, and syllabus textbooks written by Sachin Sir Books Pune.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 px-1">
            {[
              { id: '1', name: "Sachin Dhawales", mrName: "ढवळे पब्लिकेशन", slug: "sachin-dhawale-publication", icon: <BookOpen className="w-6 h-6" /> },
              { id: '2', name: "MPSC Books", mrName: "एमपीएससी पुस्तके", slug: "mpsc-books", icon: <Briefcase className="w-6 h-6" /> },
              { id: '3', name: "Police Bharti", mrName: "पोलीस भरती पुस्तके", slug: "saral-seva-books", icon: <ShieldCheck className="w-6 h-6" /> },
              { id: '4', name: "New Books", mrName: "नवीन पुस्तके", slug: "new-books", icon: <Sparkles className="w-6 h-6" /> },
              { id: '5', name: "All Books", mrName: "सर्व पुस्तके", slug: "all-books", icon: <Layers className="w-6 h-6" /> },
              { id: '6', name: "Polity", mrName: "राज्यशास्त्र", slug: "polity", icon: <Flag className="w-6 h-6" /> },
              { id: '7', name: "Economics", mrName: "अर्थशास्त्र", slug: "economics", icon: <TrendingUp className="w-6 h-6" /> },
              { id: '8', name: "Science", mrName: "सामान्य विज्ञान", slug: "science", icon: <Sparkles className="w-6 h-6" /> },
              { id: '9', name: "Maths & Reasoning", mrName: "गणित व बुद्धिमत्ता", slug: "maths-reasoning", icon: <Layers className="w-6 h-6" /> },
              { id: '10', name: "History", mrName: "इतिहास", slug: "history", icon: <Globe className="w-6 h-6" /> },
              { id: '11', name: "Geography", mrName: "भूगोल जर्नल्स", slug: "geography", icon: <Globe className="w-6 h-6" /> },
              { id: '12', name: "Current Affairs", mrName: "चालू घडामोडी", slug: "current-affairs", icon: <Calendar className="w-6 h-6" /> },
              { id: '13', name: "Hindi Vyakaran", mrName: "हिंदी व्याकरण", slug: "hindi", icon: <Feather className="w-6 h-6" /> },
              { id: '14', name: "Marathi Vyakaran", mrName: "मराठी व्याकरण", slug: "marathi-grammar", icon: <Feather className="w-6 h-6" /> },
              { id: '15', name: "Prashna Sanch", mrName: "प्रश्नपत्रिका संच", slug: "question-papers", icon: <FileText className="w-6 h-6" /> },
              { id: '16', name: "Paper Set", mrName: "सराव चाचणी", slug: "paper-set", icon: <Layers className="w-6 h-6" /> }
            ].map((categoryItem, idx) => (
              <button
                key={idx}
                onClick={() => {
                  const targetEl = document.getElementById(`section-${categoryItem.slug}`);
                  if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    navigate(`/search?q=${categoryItem.slug}`);
                  }
                }}
                className="bg-white aspect-square rounded-[28px] border border-neutral-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-[#6d0000]/20 hover:shadow-[0_12px_30px_rgba(109,0,0,0.08)] active:scale-95 hover:scale-[1.02] flex flex-col items-center justify-center text-center group cursor-pointer transition-all duration-300 relative overflow-hidden p-3"
              >
                {/* Soft Neumorphic Circular Icon Container */}
                <div className="w-14 h-14 rounded-full bg-neutral-50 shadow-[inset_1.5px_1.5px_3px_rgba(0,0,0,0.05),_1.5px_1.5px_5px_rgba(255,255,255,0.85)] group-hover:bg-[#6d0000] text-[#6d0000] group-hover:text-white flex items-center justify-center transition-all duration-300 mb-3 shrink-0">
                  {categoryItem.icon}
                </div>
                
                {/* English + Marathi Bilingual Layout with better text wrapping */}
                <span className="font-display font-bold text-xs sm:text-xs text-neutral-900 group-hover:text-[#6d0000] transition-colors leading-tight px-1 block max-w-full truncate">
                  {categoryItem.name}
                </span>
                <span className="text-[10px] text-[#7a7a7a] mt-0.5 font-medium/medium/800 font-sans tracking-tight">
                  {categoryItem.mrName}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 & 3: BOOK-WISE CATEGORY TABS AND FEATURED BOOK CARD */}
      <section className="py-[60px] max-w-[1850px] mx-auto px-4 md:px-12 border-b border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 mb-8">
          <div className="space-y-1.5 max-w-2xl px-1">
            <span className="text-[11px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[5px] text-[#6d0000] uppercase block leading-tight break-words">CONSTRUCT YOUR SELECTIONS</span>
            <h2 className="font-display font-black text-[32px] sm:text-[42px] leading-[1.05] tracking-tight text-[#111111] uppercase">
              Book-Wise Tabs / पुस्तकानुसार
            </h2>
          </div>
          
          {/* Section 2: Horizontal Pill Slider (with smooth scroll, zero vertical noise, equal heights) */}
          <div className="w-full md:w-auto overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 flex items-center gap-2">
            {[
              { id: 'maths' as const, label: 'Maths Book' },
              { id: 'reasoning' as const, label: 'Reasoning Book' },
              { id: 'mw' as const, label: 'MW (Maths Workbook)' },
              { id: 'rw' as const, label: 'RW (Reasoning Workbook)' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setSliderTab(tab.id);
                  setSliderQty(1);
                }}
                className={cn(
                  "h-12 px-6 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap border shrink-0 flex items-center justify-center cursor-pointer hover:scale-[1.02] active:scale-95",
                  sliderTab === tab.id 
                    ? "bg-[#6d0000] text-white border-[#6d0000] shadow-md shadow-[#6d0000]/10" 
                    : "bg-white border-neutral-200 text-neutral-500 hover:text-neutral-800 hover:border-neutral-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Premium Dynamic Featured Book Card Layout */}
        <div className="bg-gradient-to-br from-white to-neutral-50/50 rounded-[36px] p-6 sm:p-10 border border-neutral-200/80 shadow-[0_15px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_25px_60px_rgba(109,0,0,0.06)] hover:border-[#6d0000]/10 transition-all duration-500 max-w-4xl mx-auto">
          {(() => {
            // Generate simulated books for MW & RW
            const mwBookSpec: Book = {
              id: "mw-maths-workbook",
              title: "Ankganit Practical Practice Sanch (Maths Workbook MW)",
              author: "Sachin Dhawale Sir",
              isbn: "SDP-MW-01",
              category: "mathematics",
              subject: "maths",
              publication: "Sachin Dhawale's Publication",
              price: 350,
              discount: 30,
              finalPrice: 245,
              description: "Intensive drill workbook featuring more than 2,500 practice solutions and previous MPSC exam standards.",
              imageUrl: "placeholder_mw",
              weight: 350,
              stockQuantity: 100,
              availableCopies: 92,
              shelfLocation: "SDP-MW-1",
              status: "In stock",
              type: "New"
            };

            const rwBookSpec: Book = {
              id: "rw-reasoning-workbook",
              title: "Logical Reasoning Booster Sanch (Reasoning Workbook RW)",
              author: "Sachin Dhawale Sir",
              isbn: "SDP-RW-02",
              category: "mathematics",
              subject: "reasoning",
              publication: "Sachin Dhawale's Publication",
              price: 320,
              discount: 25,
              finalPrice: 240,
              description: "Specialized reasoning workbook (RW) incorporating advanced time-saving shortcuts for TCS & IBPS tests.",
              imageUrl: "placeholder_rw",
              weight: 300,
              stockQuantity: 120,
              availableCopies: 108,
              shelfLocation: "SDP-RW-1",
              status: "In stock",
              type: "New"
            };

            const activeBook = 
              sliderTab === 'maths' ? allBooks.find(b => b.id === 'maths-dhawale-essential') :
              sliderTab === 'reasoning' ? allBooks.find(b => b.id === 'reasoning-dhawale-essential') :
              sliderTab === 'mw' ? mwBookSpec : rwBookSpec;

            if (!activeBook) return (
              <div className="text-sm font-bold text-neutral-400 py-12 text-center">Loading details...</div>
            );

            return (
              <div className="flex flex-col md:flex-row gap-8 sm:gap-10 items-center">
                
                {/* Left Side: Mockup Image inside rounded structure */}
                <div className="w-full md:w-[42%] shrink-0">
                  <div className="aspect-[3/4] w-full rounded-[24px] overflow-hidden bg-neutral-900 border border-neutral-150 shadow-2xl relative group-hover:scale-105 transition-transform duration-500">
                    {['maths-dhawale-essential', 'reasoning-dhawale-essential'].includes(activeBook.id) ? (
                      <BookCoverPresenter bookId={activeBook.id} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#6d0000] to-neutral-900 text-white flex flex-col justify-between p-6 uppercase font-bold relative">
                        <span className="text-[10px] text-orange-400 tracking-widest font-black">Sachin Sir Books</span>
                        <p className="text-base sm:text-lg font-black tracking-tight leading-snug line-clamp-4 select-none">{activeBook.title}</p>
                        <div className="border-t border-white/10 pt-3 text-[10px] text-neutral-300 tracking-wider">
                          PUNE MASTERWORK
                        </div>
                      </div>
                    )}
                    
                    {activeBook.discount > 0 && (
                      <div className="absolute top-4 left-4 bg-[#ff6a00] text-white font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg z-10">
                        Save {activeBook.discount}% Info
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Visual Specifications & CTA */}
                <div className="w-full flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Badge Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#6d0000] bg-red-50 border border-[#6d0000]/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                        🛡️ Trusted by Pune Students
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#00c853] bg-emerald-50 border border-emerald-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1 shadow-sm">
                        ✓ VERIFIED COURSE
                      </span>
                    </div>

                    {/* Title and Spacing */}
                    <h3 className="font-display font-black text-2xl sm:text-[28px] text-[#111111] leading-tight">
                      {activeBook.title}
                    </h3>
                    
                    {/* Subheading/Author */}
                    <p className="text-xs sm:text-[13px] font-semibold text-[#7a7a7a] tracking-[1.5px] sm:tracking-[3.3px] uppercase break-words">
                      BY {activeBook.author.toUpperCase()} • DECCAN PUBLICATION
                    </p>

                    {/* Short desc */}
                    <p className="text-sm text-neutral-600 leading-relaxed font-sans">
                      {activeBook.description}
                    </p>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 text-amber-500 pt-1">
                      <div className="flex">
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                        <Star size={13} fill="currentColor" />
                      </div>
                      <span className="text-xs font-bold text-neutral-500">(4.9/5 • 4,890 verified student ratings)</span>
                    </div>
                  </div>

                  {/* Stepper, pricing and CTA button */}
                  <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="font-sans font-medium text-xs text-[#7a7a7a] line-through leading-none mb-1">
                        M.R.P: {formatPrice(activeBook.price)}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-sans font-black text-[#111111] text-3xl sm:text-4xl leading-none">
                          {formatPrice(activeBook.finalPrice)}
                        </span>
                        <span className="text-[10px] font-bold text-[#00c853] bg-emerald-50 border border-emerald-500/15 px-2.5 py-0.5 rounded-full inline-block">
                          IN STOCK
                        </span>
                      </div>
                    </div>

                    {/* Quality Stepper & Instant Purchase Bag Action */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-[#f5f5f5] border border-neutral-200/80 rounded-2xl h-12 px-2 gap-2.5 shrink-0">
                        <button 
                          onClick={() => setSliderQty(prev => Math.max(1, prev - 1))}
                          className="w-8 h-8 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center font-bold text-neutral-850 hover:bg-neutral-50 active:scale-90 transition-all text-sm shrink-0 cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-sm text-neutral-900 select-none">
                          {sliderQty}
                        </span>
                        <button 
                          onClick={() => setSliderQty(prev => prev + 1)}
                          className="w-8 h-8 rounded-xl bg-white border border-neutral-200 shadow-sm flex items-center justify-center font-bold text-neutral-850 hover:bg-neutral-50 active:scale-90 transition-all text-sm shrink-0 cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          for (let i = 0; i < sliderQty; i++) {
                            addToCart(activeBook);
                          }
                          triggerToast(`Added ${sliderQty}x ${activeBook.title} to Bag!`, 'success');
                        }}
                        className="h-12 px-6 bg-[#6d0000] hover:bg-[#800020] text-white font-bold text-xs rounded-2xl flex items-center gap-2 shadow-lg shadow-[#6d0000]/15 hover:shadow-[#6d0000]/30 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <ShoppingBag size={14} /> Add to Bag
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* SECTION 4 — COMBO OFFER SECTION */}
      {comboStudySets.length > 0 && (
        <section className="py-[60px] max-w-[1850px] mx-auto px-4 md:px-12 border-b border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-10 px-1">
            <div>
              <span className="text-[11px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[5px] text-[#6d0000] uppercase block mb-1 leading-tight break-words">HIGH SAVING COLLABORATIONS</span>
              <h2 className="font-display font-black text-[32px] sm:text-[42px] leading-[1.05] tracking-tight text-[#111111] uppercase select-none">
                Combo Offers / कॉम्बो ऑफर्स
              </h2>
            </div>
            <p className="text-[18px] leading-[1.7] text-[#7b7b7b] max-w-sm">
              Bundled syllabus packages aligning essential guides for unified subjects. Enjoy flat 30%-40% direct pricing reduction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-1">
            {comboStudySets.map((combo, idx) => (
              <div key={combo.id || idx} className="bg-white rounded-[32px] p-6 sm:p-7 border border-neutral-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(109,0,0,0.07)] hover:border-[#6d0000]/10 transition-all duration-300 flex flex-col justify-between group text-center h-full relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-[#00c853] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md z-20">
                  Save {combo.discount || Math.round(((combo.originalPrice - combo.price)/combo.originalPrice)*100)}%
                </div>

                <div>
                  <div className="flex justify-center items-center gap-1.5 mb-4 px-1">
                    <span className="text-[10px] font-black uppercase text-[#6d0000] bg-red-50 px-3 py-1 rounded-full tracking-wider border border-[#6d0000]/10 shrink-0">
                      {combo.topLabel || combo.category || 'COMBO OFFER'}
                    </span>
                  </div>

                  {/* Premium 3D Overlapping books mockup container with strong visual depth */}
                  <div className="h-48 relative bg-neutral-50 border border-neutral-100 rounded-[24px] flex items-center justify-center overflow-hidden mb-6 group-hover:bg-red-50/10 transition-colors shadow-inner">
                    <div className="absolute left-[24%] transform -rotate-12 translate-y-3 shadow-xl w-24 aspect-[3/4] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 transition-transform duration-300 group-hover:-translate-x-1">
                      <BookCoverPresenter bookId={combo.bookIds?.[0]} />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 to-transparent" />
                    </div>
                    
                    <div className="absolute right-[24%] transform rotate-12 translate-y-3 shadow-2xl w-24 aspect-[3/4] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-200 z-10 transition-transform duration-300 group-hover:translate-x-1">
                      <BookCoverPresenter bookId={combo.bookIds?.[1]} />
                      <div className="absolute inset-0 bg-gradient-to-br from-red-950/10 to-transparent" />
                    </div>
                    
                    <div className="absolute w-9 h-9 rounded-full bg-[#6d0000] text-white font-extrabold text-base flex items-center justify-center shadow-md border-2 border-white z-20">
                      +
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-lg text-neutral-950 leading-snug mb-2 group-hover:text-[#6d0000] transition-colors">
                    {combo.title}
                  </h3>
                  <p className="text-[#a0a0a0] text-xs leading-relaxed max-w-xs mx-auto mb-6 h-10 line-clamp-2">
                    {combo.description}
                  </p>
                </div>

                <div className="border-t border-neutral-100 pt-5">
                  <div className="flex items-baseline justify-center gap-3 mb-4">
                    <span className="font-sans font-bold text-neutral-950 text-[36px] leading-none">{formatPrice(combo.price)}</span>
                    <span className="text-base text-zinc-400 line-through font-semibold leading-none">{formatPrice(combo.originalPrice)}</span>
                  </div>

                  <button
                    onClick={() => {
                      let addedCount = 0;
                      combo.bookIds?.forEach(bookId => {
                        const bookToFind = allBooks.find(b => b.id === bookId);
                        if (bookToFind) {
                          addToCart(bookToFind);
                          addedCount++;
                        }
                      });
                      if (addedCount > 0) {
                        triggerToast(`Combo "${combo.title}" elements saved instantly to Cart!`, 'success');
                      } else {
                        triggerToast("Unable to add combo elements directly.", 'info');
                      }
                    }}
                    className="w-full bg-[#111111] hover:bg-[#6d0000] text-white font-bold text-xs py-3.5 px-6 rounded-xl h-[52px] flex items-center justify-center gap-1.5 cursor-pointer shadow-md active:scale-95 hover:scale-[1.01] transition-all duration-300"
                  >
                    <ShoppingCart size={13} /> Buy Deluxe Combo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 5 — BATCH PREPARATION SECTION */}
      {batchStudySets.length > 0 && (
        <section className="py-[60px] max-w-[1850px] mx-auto px-4 md:px-12 border-b border-neutral-100">
          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-2 mb-10 px-1">
            <div>
              <span className="text-[11px] sm:text-[13px] font-bold tracking-[2px] sm:tracking-[5px] text-[#6d0000] uppercase block mb-1 leading-tight break-words">BATCHWISE PREPARATION COURSES</span>
              <h2 className="font-display font-black text-[32px] sm:text-[42px] leading-[1.05] tracking-tight text-[#111111] uppercase select-none">
                Batch Study Sets / वर्ग अभ्यास संच
              </h2>
            </div>
            <p className="text-[18px] leading-[1.7] text-[#7b7b7b] max-w-sm">
              Enroll your study group or preparation batch directly with unified curriculum book sets. One-tap integration adding all books.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-1">
            {batchStudySets.map((batch, batchIdx) => (
              <div key={batch.id || batchIdx} className="bg-white p-6 rounded-[32px] border border-neutral-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_45px_rgba(109,0,0,0.07)] hover:border-[#6d0000]/10 transition-all duration-300 flex flex-col justify-between group text-left h-full">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-[#6d0000] bg-red-50 tracking-widest border border-[#6d0000]/10 shrink-0 font-sans">
                      {batch.topLabel || batch.category || 'MPSC BATCH'}
                    </span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shrink-0">
                      👥 {batch.stats || '4.8K Enrolled'}
                    </span>
                  </div>
                  
                  {/* Horizontal stacked mini book previews */}
                  <div className="flex -space-x-4 items-center my-4 overflow-hidden py-1">
                    {batch.bookIds?.map((bookId, indexBook) => (
                      <div key={indexBook} className="w-11 h-14 bg-neutral-900 rounded-lg border-2 border-white shadow-md overflow-hidden shrink-0 relative transform hover:scale-110 hover:z-20 transition-all duration-200">
                        <BookCoverPresenter bookId={bookId} />
                      </div>
                    ))}
                    <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-neutral-500 bg-neutral-100 shadow-sm relative z-10 font-sans">
                      +{batch.bookIds?.length || 0}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base text-neutral-900 line-clamp-1 group-hover:text-[#6d0000] transition-colors mb-1.5">
                    {batch.title}
                  </h3>
                  
                  <p className="text-xs text-[#7a7a7a] leading-normal line-clamp-2 min-h-[36px] mb-4 font-sans">
                    {batch.description || "Syllabus-structured complete series for the selective academic batch. Matches PUNE standard criteria."}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-sans font-black text-[#111111] text-lg leading-tight">{formatPrice(batch.price)}</span>
                    <span className="text-[11px] text-zinc-455 line-through font-semibold leading-none">{formatPrice(batch.originalPrice)}</span>
                  </div>

                  <button
                    onClick={() => {
                      let count = 0;
                      batch.bookIds?.forEach(bookId => {
                        const bookToFind = allBooks.find(b => b.id === bookId);
                        if (bookToFind) {
                          addToCart(bookToFind);
                          count++;
                        }
                      });
                      if (count > 0) {
                        triggerToast(`Batch syllabus books (${count}) added elegantly to Bag!`, 'success');
                      } else {
                        triggerToast(`No available books found in this package right now.`, 'info');
                      }
                    }}
                    className="h-10 px-4 bg-[#6d0000] hover:bg-[#800020] text-white text-[11px] font-bold rounded-xl flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-lg shadow-[#6d0000]/10 border-none"
                  >
                    <Plus size={12} strokeWidth={2.5} /> Add Batch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. INTERACTIVE FEATURE/TRUST STRIP */}
      <section className="bg-white border-y border-neutral-100 py-12 my-12 shadow-inner">
        <div className="max-w-[1850px] mx-auto px-4 md:px-12 grid grid-cols-2 lg:grid-cols-6 gap-6">
          {[
            { 
              title: 'Fast Delivery', 
              desc: 'Pune order in 24h, Rest in 48h',
              icon: <Truck className="text-red-900 w-8 h-8" />
            },
            { 
              title: 'Secure Payments', 
              desc: 'UPI, Cards & Razorpay safe options',
              icon: <ShieldCheck className="text-red-900 w-8 h-8" />
            },
            { 
              title: 'Easy Returns', 
              desc: 'Genuine return options if damaged',
              icon: <ArrowRight className="text-red-900 w-8 h-8" />
            },
            { 
              title: 'Direct Support', 
              desc: 'Consulting via +91 9850578039',
              icon: <Phone className="text-red-900 w-8 h-8" />
            },
            { 
              title: '150K+ Trusted', 
              desc: 'Students & administrative officers',
              icon: <Users className="text-red-900 w-8 h-8" />
            },
            { 
              title: 'Best Discounts', 
              desc: 'Flat 30%-40% OFF directly',
              icon: <Percent className="text-red-900 w-8 h-8" />
            }
          ].map((feat, i) => (
            <div key={i} className="flex flex-col items-center text-center p-4 bg-neutral-50/50 hover:bg-red-50/20 border border-neutral-100 hover:border-red-900/10 rounded-2xl transition-all">
              <div className="w-12 h-12 rounded-full bg-red-100/40 flex items-center justify-center mb-3 text-red-900">
                {feat.icon}
              </div>
              <h5 className="font-bold text-xs text-neutral-900 leading-tight mb-1">{feat.title}</h5>
              <p className="text-[10px] text-neutral-400 font-bold leading-normal">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. COAXIAL QUICK VIEW OVERLAY DIALOG MODAL */}
      <AnimatePresence>
        {quickBoxBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickBoxBook(null)}
              className="fixed inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />
            {/* Box modal */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full border border-neutral-100 shadow-2xl relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6"
            >
              {/* Image segment */}
              <div className="w-full md:w-5/12 aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden relative border border-neutral-200 shadow shadow-neutral-950/10 shrink-0">
                {['rayat-darpan', 'vocab-sanjeevani', 'zero-error-english', 'maharashtra-bhugol', 'rajyaghatana-notes'].includes(quickBoxBook.id) ? (
                  <BookCoverPresenter bookId={quickBoxBook.id} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-850 to-red-950 text-white flex flex-col justify-between p-4 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b]">{quickBoxBook.category}</span>
                    <p className="font-display font-black text-xs leading-snug">{quickBoxBook.title}</p>
                    <div className="text-[10px] font-bold text-neutral-400 border-t border-white/5 pt-1 mt-2">
                      {quickBoxBook.author || "Pune Experts"}
                    </div>
                  </div>
                )}
              </div>

              {/* Specs segment */}
              <div className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-black uppercase text-white px-2 py-0.5 rounded tracking-widest bg-red-800">
                      {quickBoxBook.category}
                    </span>
                    <button 
                      onClick={() => setQuickBoxBook(null)}
                      className="p-1 px-2.5 text-xs text-neutral-400 hover:text-neutral-900 bg-neutral-50 rounded-full font-bold"
                    >
                      Close X
                    </button>
                  </div>
                  
                  <h4 className="font-display font-black text-base text-neutral-900 leading-tight">
                    {quickBoxBook.title}
                  </h4>
                  <p className="text-[11px] text-red-900 font-bold uppercase tracking-wider">
                    By {quickBoxBook.author} • {quickBoxBook.publication || "Deccan Publications"}
                  </p>

                  <p className="text-xs text-[#78716c] leading-relaxed line-clamp-4 pt-2 border-t border-neutral-100">
                    {quickBoxBook.description || "The verified course guidebook for standard State administrative exams and Central recruitment papers. Includes exhaustive revisions and practice indices."}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="font-display font-black text-red-900 text-xl leading-none">
                      {formatPrice(quickBoxBook.finalPrice)}
                    </span>
                    <span className="text-xs text-zinc-400 line-through font-medium leading-none">
                      {quickBoxBook.price}
                    </span>
                    <span className="text-xs text-orange-600 font-bold leading-none">
                      ({quickBoxBook.discount}% OFF)
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        addToCart(quickBoxBook);
                        triggerToast(`Added ${quickBoxBook.title} successfully!`, 'success');
                        setQuickBoxBook(null);
                      }}
                      className="flex-1 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                    >
                      <ShoppingCart size={13} /> Add to Summary Bag
                    </button>
                    <Link
                      to={`/book/${quickBoxBook.id}`}
                      className="p-3 bg-neutral-150 text-neutral-700 hover:bg-neutral-200 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-9
5"
                    >
                      View Full Details
                    </Link>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
