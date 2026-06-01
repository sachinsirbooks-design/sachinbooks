import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search as SearchIcon, 
  X, 
  ShoppingBag, 
  Heart,
  TrendingUp,
  ArrowRight,
  Filter
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Book, AppSettings } from '../types';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';
import BookCard from '../components/BookCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedPublication, setSelectedPublication] = useState(searchParams.get('publication') || '');

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    Promise.all([
      storeService.getBooks(),
      storeService.getSettings()
    ]).then(([books, settingsData]) => {
      setAllBooks(books);
      setSettings(settingsData);
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get('q');
    const pub = searchParams.get('publication');
    if (q) setQuery(q);
    if (pub) setSelectedPublication(pub);
  }, [searchParams]);

  useEffect(() => {
    if (!query.trim() && !selectedPublication) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      const filtered = allBooks.filter(book => {
        const matchesQuery = !query.trim() || 
          book.title.toLowerCase().includes(query.toLowerCase()) ||
          book.category.toLowerCase().includes(query.toLowerCase()) ||
          book.author?.toLowerCase().includes(query.toLowerCase()) ||
          book.publication?.toLowerCase().includes(query.toLowerCase());
        
        const matchesPub = !selectedPublication || book.publication === selectedPublication;
        
        return matchesQuery && matchesPub;
      });

      // Priority Sorting
      if (settings?.publicationPriorities && settings.publicationPriorities.length > 0) {
        const priorities = settings.publicationPriorities;
        filtered.sort((a, b) => {
          const indexA = priorities.indexOf(a.publication);
          const indexB = priorities.indexOf(b.publication);
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0;
        });
      }

      setResults(filtered);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [query, allBooks, selectedPublication, settings]);

  const publications = Array.from(new Set(allBooks.map(b => b.publication))).filter(Boolean) as string[];

  const handlePubSelect = (pub: string) => {
    const newPub = selectedPublication === pub ? '' : pub;
    setSelectedPublication(newPub);
    setSearchParams(prev => {
      if (newPub) prev.set('publication', newPub);
      else prev.delete('publication');
      return prev;
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 pt-10">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12">
        <div className="relative mb-20 max-w-4xl mx-auto">
          <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full scale-110 pointer-events-none" />
          <div className="relative flex items-center">
            <SearchIcon className="absolute left-8 text-neutral-400" size={32} />
            <input 
              type="text" 
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, category, or author..." 
              className="w-full bg-white border border-neutral-100 rounded-[2.5rem] py-10 pl-24 pr-24 font-display font-medium text-3xl shadow-2xl shadow-neutral-900/5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all placeholder:text-neutral-200"
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="absolute right-8 p-3 bg-neutral-50 rounded-2xl text-neutral-400 hover:text-neutral-900 transition-colors"
              >
                <X size={24} />
              </button>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 py-2">Quick Picks:</span>
             {['MPSC', 'History', 'Geography', 'UPSC', 'Polity'].map(q => (
               <button 
                key={q} 
                onClick={() => setQuery(q)}
                className="bg-white border border-neutral-100 rounded-full px-4 py-1.5 text-xs font-display font-bold text-neutral-600 hover:bg-neutral-950 hover:text-white transition-all shadow-sm"
               >
                 {q}
               </button>
             ))}
          </div>

          {publications.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="w-full text-center text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-2">Filter by Publication:</span>
              {publications.map(pub => (
                <button
                  key={pub}
                  onClick={() => handlePubSelect(pub)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    selectedPublication === pub 
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                      : "bg-white text-neutral-500 border-neutral-100 hover:border-blue-600"
                  )}
                >
                  {pub}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="font-display font-bold text-neutral-400 uppercase tracking-[0.1em] sm:tracking-[0.2em] animate-pulse">Syncing Library...</p>
          </div>
        ) : query ? (
          <div>
            <div className="flex items-end justify-between mb-12 border-b border-neutral-100 pb-8">
              <div>
                <h2 className="text-4xl font-display font-bold text-neutral-950 tracking-tight">Search Results</h2>
                <p className="text-neutral-400 font-sans text-xs sm:text-sm font-medium uppercase tracking-[0.08em] sm:tracking-[0.25em]">{results.length} resources discovered</p>
              </div>
            </div>

            {results.length === 0 ? (
               <div className="py-20 text-center flex flex-col items-center">
                <div className="w-20 h-20 border-2 border-dashed border-neutral-200 rounded-full flex items-center justify-center text-neutral-200 mb-6">
                  <SearchIcon size={32} />
                </div>
                <h3 className="text-2xl font-display font-bold text-neutral-950 mb-4">No results for "{query}"</h3>
                <p className="text-neutral-500 font-sans max-w-sm mx-auto">Try checking your spelling or search for wider categories like "MPSC" or "Math".</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 gap-y-12 mb-20 max-w-[1850px] mx-auto">
                {results.map((book) => (
                  <div key={book.id} className="flex justify-center">
                    <BookCard book={book} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
             <div className="flex items-center gap-3 mb-10">
                <TrendingUp size={24} className="text-blue-600" />
                <h3 className="font-display font-bold text-xl uppercase tracking-widest text-neutral-900">Trending Searches</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'State Services Exam 2024', cat: 'MPSC' },
                  { title: 'Complete Indian Polity', cat: 'Subjects' },
                  { title: 'Maharashtra Geography Hub', cat: 'Map Books' },
                  { title: 'Monthly Current Affairs', cat: 'Preparation' }
                ].map((t, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setQuery(t.title)}
                    className="bg-white p-6 rounded-[2rem] border border-neutral-100 flex items-center justify-between group hover:bg-neutral-950 transition-all hover:-translate-x-2"
                  >
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{t.cat}</p>
                        <p className="font-display font-bold text-neutral-900 group-hover:text-white transition-colors">{t.title}</p>
                     </div>
                     <ArrowRight size={20} className="text-neutral-200 group-hover:text-white transition-all group-hover:translate-x-1" />
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
