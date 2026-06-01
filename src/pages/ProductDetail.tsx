import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Heart, 
  Share2, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Truck, 
  FileText,
  Bookmark,
  ChevronRight,
  Zap
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Book } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import BookCoverPresenter from '../components/BookCoverPresenter';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;
      try {
        const data = await storeService.getBook(id);
        setBook(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
        <h2 className="text-4xl font-display font-bold text-neutral-900 mb-4">Book not found</h2>
        <p className="text-neutral-500 mb-8">The book you are looking for might have been moved or removed.</p>
        <Link to="/" className="bg-neutral-950 text-white px-8 py-4 rounded-2xl font-display font-bold">
          Back to Bookstore
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12 pt-10">
        {/* Navigation */}
        <Link to={`/category/${book.category}`} className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-900 font-display font-bold text-xs uppercase tracking-widest group mb-12">
          <div className="p-2 bg-white rounded-lg border border-neutral-100 group-hover:bg-neutral-950 group-hover:text-white transition-all shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Back to {book.category}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Image Space */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-[3rem] p-4 border border-neutral-100 shadow-2xl shadow-neutral-900/5 aspect-[3/4] group relative overflow-hidden flex items-center justify-center">
              {['rayat-darpan', 'vocab-sanjeevani', 'zero-error-english', 'maharashtra-bhugol', 'rajyaghatana-notes'].includes(book.id) ? (
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden shadow-inner">
                  <BookCoverPresenter bookId={book.id} />
                </div>
              ) : (
                <motion.img 
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  src={getDriveImageUrl(book.imageUrl)} 
                  alt={book.title} 
                  className="w-full h-full object-cover rounded-[2.5rem] shadow-inner"
                />
              )}
              {book.discount > 0 && (
                <div className="absolute top-10 left-10 bg-rose-500 text-white font-display font-black text-xs uppercase tracking-[0.2em] px-5 py-2 rounded-full shadow-2xl z-10 -rotate-3">
                  SAVE {book.discount}% NOW
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-[3/4] bg-white rounded-2xl border border-neutral-100 p-2 overflow-hidden cursor-pointer hover:border-blue-600 transition-colors flex items-center justify-center">
                  {['rayat-darpan', 'vocab-sanjeevani', 'zero-error-english', 'maharashtra-bhugol', 'rajyaghatana-notes'].includes(book.id) ? (
                    <div className="w-full h-full rounded-xl overflow-hidden pointer-events-none opacity-80">
                      <BookCoverPresenter bookId={book.id} />
                    </div>
                  ) : (
                    <img src={getDriveImageUrl(book.imageUrl)} alt="" className="w-full h-full object-cover rounded-xl" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Details Space */}
          <div className="lg:col-span-7 flex flex-col pt-4">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{book.category}</span>
              <div className="flex text-yellow-500">
                {[1,2,3,4,5].map(i => <Star key={i} size={14} fill={i < 5 ? "currentColor" : "none"} />)}
              </div>
              <span className="text-[10px] font-sans font-bold text-neutral-400 uppercase tracking-widest">128 Reviews</span>
            </div>

                    <h1 className="text-4xl md:text-6xl font-display font-bold text-neutral-950 tracking-tight leading-[1.1] mb-4">
                      {book.title}
                    </h1>
                    <div className="flex flex-col mb-8">
                       <p className="text-xl md:text-2xl font-display font-bold text-blue-600 italic tracking-tight mb-1">
                          By {book.author || 'Sachin Dhawale Sir'}
                       </p>
                       <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">
                          {book.publication || 'Sachin Sir Books'}
                       </p>
                    </div>

            <div className="flex items-center gap-6 mb-10">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-display font-bold text-neutral-900">{formatPrice(book.finalPrice)}</span>
                {book.discount > 0 && (
                  <span className="text-xl font-sans font-medium text-neutral-300 line-through mb-1">
                    {formatPrice(book.price)}
                  </span>
                )}
              </div>
              <div className="h-10 w-px bg-neutral-100" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-1">Availability</p>
                <div className="flex items-center gap-1.5">
                  <div className={cn("w-2 h-2 rounded-full", book.status === 'In stock' ? "bg-green-500" : "bg-rose-500")} />
                  <span className="font-display font-bold text-sm text-neutral-900">{book.status}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-12">
              <button 
                disabled={book.status === 'Out of stock'}
                onClick={() => { 
                  addToCart(book); 
                  toast.success('Added to Bag. Rolling to checkout...'); 
                  setTimeout(() => {
                    navigate('/checkout');
                  }, 800);
                }}
                className={cn(
                  "flex-1 min-w-[200px] h-16 rounded-[1.25rem] font-display font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl",
                  book.status === 'Out of stock' ? "bg-neutral-200 text-neutral-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20"
                )}
              >
                <ShoppingBag size={24} /> Buy This Book
              </button>
              <button 
                onClick={() => toggleWishlist(book)}
                className={cn(
                  "w-16 h-16 rounded-[1.25rem] border-2 flex items-center justify-center transition-all active:scale-95",
                  isInWishlist(book.id) ? "border-rose-500 bg-rose-500 text-white" : "border-neutral-100 text-neutral-400 hover:border-neutral-900 hover:text-neutral-900"
                )}
              >
                <Heart size={24} fill={isInWishlist(book.id) ? "currentColor" : "none"} />
              </button>
              <button 
                onClick={handleCopyLink}
                className="w-16 h-16 rounded-[1.25rem] border-2 border-neutral-100 text-neutral-400 flex items-center justify-center hover:border-neutral-900 hover:text-neutral-900 transition-all active:scale-95"
              >
                <Share2 size={24} />
              </button>
            </div>

            {/* Preparation Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 p-8 bg-white rounded-[2.5rem] border border-neutral-100 mb-12">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <Bookmark size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Weight</span>
                </div>
                <p className="font-display font-bold text-lg text-neutral-900">{book.weight ? `${book.weight}g` : '450g'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Edition</span>
                </div>
                <p className="font-display font-bold text-lg text-neutral-900">2024 Revised</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-neutral-400 mb-2">
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Stock Info</span>
                </div>
                <p className="font-display font-bold text-lg text-neutral-900">{book.stockQuantity} Units Left</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="space-y-8">
              <div className="flex border-b border-neutral-100 gap-8">
                {['description', 'details', 'reviews'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "pb-4 font-display font-bold text-sm uppercase tracking-widest relative transition-colors",
                      activeTab === tab ? "text-blue-600" : "text-neutral-400 hover:text-neutral-600"
                    )}
                  >
                    {tab}
                    {activeTab === tab && (
                      <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              <div className="min-h-[200px]">
                <AnimatePresence mode="wait">
                  {activeTab === 'description' && (
                    <motion.div 
                      key="description"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="font-sans text-neutral-600 leading-relaxed space-y-4"
                    >
                      <p>{book.description || "The definitive resource for Maharashtra state services aspirants. This book covers the latest syllabus patterns with focus on core conceptual clarity and extensive practice model questions. Prepared by expert faculty with years of experience in administrative training."}</p>
                      
                      <div className="bg-blue-50 rounded-2xl p-6 border-l-4 border-blue-600">
                        <p className="text-blue-800 font-medium italic">"Concept is Power. This edition includes the latest 2024 revised pattern integration directly into the syllabus chapters."</p>
                      </div>

                      {book.sampleFileUrl && (
                        <a 
                          href={book.sampleFileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-3 text-neutral-900 font-display font-bold py-3 px-6 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-all border border-neutral-200 mt-4"
                        >
                          <FileText size={20} /> View Sample Reader (PDF)
                        </a>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'details' && (
                    <motion.div 
                      key="details"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12"
                    >
                      {[
                        { label: 'Category', value: book.category },
                        { label: 'Original Price', value: formatPrice(book.price) },
                        { label: 'Admin Discount', value: `${book.discount}% off` },
                        { label: 'Shipping Weight', value: book.weight ? `${book.weight}g` : '450g' },
                        { label: 'Publisher', value: book.publication || 'Sachin Sir Books' },
                        { label: 'Author', value: book.author || 'Sachin Dhawale Sir' },
                        { label: 'Inquiry SKU', value: book.id.substring(0, 8).toUpperCase() }
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between py-3 border-b border-neutral-100">
                          <span className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest">{item.label}</span>
                          <span className="text-sm font-display font-bold text-neutral-900">{item.value}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Books */}
        <div className="mt-40">
           <div className="flex items-end justify-between mb-12">
            <div>
              <h4 className="text-blue-600 font-display font-black text-xs uppercase tracking-[0.3em] mb-3">Recommendations</h4>
              <h2 className="text-4xl md:text-5xl font-display font-black italic uppercase text-neutral-950 tracking-tight">You Might Also Need</h2>
            </div>
          </div>
          
          {/* We'll just show the category's books as similar books here */}
          <SimilarBooksGrid category={book.category} currentId={book.id} />
        </div>
      </div>
    </div>
  );
}

function SimilarBooksGrid({ category, currentId }: { category: string, currentId: string }) {
  const [books, setBooks] = useState<Book[]>([]);
  
  useEffect(() => {
    // getBooks already handles priority sorting
    storeService.getBooks(category, 6).then(data => {
      setBooks(data.filter(b => b.id !== currentId).slice(0, 4));
    });
  }, [category, currentId]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {books.map(book => (
        <Link key={book.id} to={`/book/${book.id}`} className="group">
          <div className="relative bg-white rounded-3xl aspect-[3/4] mb-4 overflow-hidden border border-neutral-100 group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all">
            <img src={getDriveImageUrl(book.imageUrl)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/20 transition-colors" />
          </div>
          <h3 className="font-display font-bold text-sm line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">{book.title}</h3>
          <p className="font-display font-bold text-neutral-900">{formatPrice(book.finalPrice)}</p>
        </Link>
      ))}
    </div>
  );
}
