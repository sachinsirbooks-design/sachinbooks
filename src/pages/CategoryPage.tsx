import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Filter, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  ShoppingBag, 
  Heart,
  ArrowRight,
  Search as SearchIcon
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Book, Category, AppSettings } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';
import BookCard from '../components/BookCard';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { settings } = useSettings();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cats, allBooks] = await Promise.all([
          storeService.getCategories(),
          storeService.getBooks(slug)
        ]);
        setCategories(cats);
        setBooks(allBooks);
        setCurrentCategory(cats.find(c => c.slug === slug) || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const [selectedPublication, setSelectedPublication] = useState('');

  const publications = Array.from(new Set(books.map(b => b.publication))).filter(Boolean) as string[];

  const sortedBooks = [...books]
    .filter(b => !selectedPublication || b.publication === selectedPublication)
    .sort((a, b) => {
    // Basic Price Sort
    if (sortBy === 'price-low') return a.finalPrice - b.finalPrice;
    if (sortBy === 'price-high') return b.finalPrice - a.finalPrice;
    
    // Default: Priority Publication first, then newest
    if (settings?.publicationPriorities && settings.publicationPriorities.length > 0) {
      const priorities = settings.publicationPriorities;
      const indexA = priorities.indexOf(a.publication);
      const indexB = priorities.indexOf(b.publication);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    
    return 0; // Maintain original order (which is newest from storeService)
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-10">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-widest text-neutral-400 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <ArrowRight size={10} />
          <Link to="/categories" className="hover:text-black transition-colors">Categories</Link>
          <ArrowRight size={10} />
          <span className="text-amber-600">{currentCategory?.name || slug}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-neutral-950 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{currentCategory?.type || 'Subject'}</span>
              <div className="h-px w-12 bg-neutral-200" />
            </div>
            <h1 className="text-5xl md:text-8xl font-display font-black text-neutral-950 tracking-tighter uppercase italic leading-[0.9]">
              {currentCategory?.name || slug}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Items Found</p>
              <p className="text-2xl font-display font-bold text-neutral-900">{books.length}</p>
            </div>
          </div>
        </div>

        {/* Publication Filter */}
        {publications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            <button
              onClick={() => setSelectedPublication('')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                selectedPublication === '' 
                  ? "bg-neutral-950 text-white border-neutral-950" 
                  : "bg-white text-neutral-400 border-neutral-100 hover:border-neutral-900"
              )}
            >
              All Publications
            </button>
            {publications.map(pub => (
              <button
                key={pub}
                onClick={() => setSelectedPublication(pub)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                  selectedPublication === pub 
                    ? "bg-amber-600 text-white border-amber-600 shadow-lg shadow-amber-500/10" 
                    : "bg-white text-neutral-400 border-neutral-100 hover:border-amber-600"
                )}
              >
                {pub}
              </button>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className="sticky top-24 z-30 bg-white/80 backdrop-blur-xl border border-neutral-100 rounded-3xl p-4 mb-12 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-neutral-900/5">
          <div className="flex items-center gap-4">
            <div className="flex bg-neutral-50 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-400 hover:text-neutral-600")}
              >
                <List size={18} />
              </button>
            </div>
            <div className="h-6 w-px bg-neutral-100 hidden sm:block" />
            <span className="text-sm font-sans font-medium text-neutral-500 hidden sm:block">
              Sort by:
            </span>
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-neutral-50 border-none rounded-xl px-4 py-2 pr-10 text-sm font-sans font-bold focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 bg-neutral-950 text-white px-5 py-2.5 rounded-xl text-sm font-display font-medium hover:bg-neutral-800 transition-all">
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>

        {/* Content */}
        {books.length === 0 ? (
          <div className="py-40 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-8">
              <SearchIcon size={40} />
            </div>
            <h3 className="text-3xl font-display font-bold text-neutral-900 mb-4">No books found in this path</h3>
            <p className="text-neutral-500 font-sans max-w-md mx-auto mb-10 text-lg">We couldn't find any resources in this category yet. Check back soon or browse other subjects.</p>
            <Link to="/categories" className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-display font-bold hover:bg-amber-700 transition-all">
              Browse All Subjects
            </Link>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6 mb-24",
            viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 max-w-[1850px] mx-auto" : "grid-cols-1"
          )}>
            <AnimatePresence mode="popLayout">
              {sortedBooks.map((book) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={book.id} 
                  className={viewMode === 'grid' ? "flex justify-center" : "group flex items-center gap-8 bg-white p-6 rounded-[2.5rem] border border-neutral-100 hover:shadow-2xl transition-all"}
                >
                  {viewMode === 'grid' ? (
                    <BookCard book={book} />
                  ) : (
                    <>
                      <Link 
                        to={`/book/${book.id}`} 
                        className="w-40 aspect-[3/4] flex-shrink-0 relative bg-white rounded-[2rem] overflow-hidden border border-neutral-100 transition-all group-hover:shadow-2xl group-hover:shadow-neutral-200 group-hover:-translate-y-1.5"
                      >
                        <img src={getDriveImageUrl(book.imageUrl)} alt={book.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        {book.discount > 0 && (
                          <div className="absolute top-4 left-4 bg-rose-500 text-white font-display font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full z-10">
                            -{book.discount}%
                          </div>
                        )}
                        {book.status === 'Out of stock' && (
                          <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                            <span className="bg-white text-black px-4 py-2 rounded-xl font-display font-black text-xs uppercase tracking-widest">Sold Out</span>
                          </div>
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 truncate mr-2">
                            {book.category}
                          </span>
                          <div className="flex items-center gap-2">
                             <span className="font-display font-bold text-2xl text-neutral-900">{formatPrice(book.finalPrice)}</span>
                             {book.discount > 0 && (
                               <span className="font-sans font-medium text-base text-neutral-400 line-through opacity-70">
                                 {formatPrice(book.price)}
                               </span>
                             )}
                          </div>
                        </div>
                        <Link to={`/book/${book.id}`}>
                          <h3 className="font-display font-bold text-neutral-900 group-hover:text-amber-600 transition-colors line-clamp-2 text-2xl mb-4">
                            {book.title}
                          </h3>
                        </Link>
                        
                        <p className="text-neutral-500 text-sm font-sans mb-8 line-clamp-3">
                          {book.description || "Detailed preparation resources for aspirants looking for high-quality study materials."}
                        </p>

                        <div className="flex items-center gap-2 justify-start">
                          <button 
                            onClick={() => toggleWishlist(book)}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95",
                              isInWishlist(book.id) ? "bg-rose-50 text-rose-500" : "bg-neutral-100 text-neutral-400 hover:text-neutral-900"
                            )}
                          >
                            <Heart size={18} fill={isInWishlist(book.id) ? "currentColor" : "none"} />
                          </button>
                          <button 
                            disabled={book.status === 'Out of stock'}
                            onClick={() => addToCart(book)}
                            className={cn(
                              "h-10 px-6 rounded-full font-display font-bold text-xs transition-all active:scale-95 flex items-center gap-2",
                              book.status === 'Out of stock' ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-amber-600 text-white shadow-lg shadow-amber-500/10 hover:bg-amber-700"
                            )}
                          >
                            <ShoppingBag size={16} /> 
                            Add to Shopping Bag
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
