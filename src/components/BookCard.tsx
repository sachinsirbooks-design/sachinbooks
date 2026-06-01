import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { formatPrice, getDriveImageUrl, cn } from '../lib/utils';
import { Book } from '../types';
import BookCoverPresenter from './BookCoverPresenter';

interface BookCardProps {
  key?: React.Key;
  book: Book;
  triggerToast?: (msg: string, type?: 'success' | 'info') => void;
  setQuickBoxBook?: (book: Book) => void;
}

export default function BookCard({ book, triggerToast, setQuickBoxBook }: BookCardProps) {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
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

  const hasSpecialPresenter = ['rayat-darpan', 'vocab-sanjeevani', 'zero-error-english', 'maharashtra-bhugol', 'rajyaghatana-notes', 'maths-dhawale-essential', 'reasoning-dhawale-essential'].includes(book.id);

  return (
    <div 
      className="w-[280px] md:w-[300px] max-w-[300px] bg-white border border-neutral-150 rounded-[28px] p-7 flex flex-col justify-between group hover:shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 transition-all duration-300 snap-start shrink-0 relative h-[530px]"
    >
      <div className="flex flex-col flex-1 justify-between h-full">
        {/* Book image space linking to Product Details */}
        <Link to={`/book/${book.id}`} className="block flex-shrink-0">
          <div className="h-[220px] w-full rounded-2xl overflow-hidden relative group bg-neutral-900 border border-neutral-100 flex-shrink-0">
            {hasSpecialPresenter ? (
              <BookCoverPresenter bookId={book.id} />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-red-950 text-white flex flex-col justify-between p-4 flex-wrap select-none">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#f59e0b] leading-tight">{book.category}</span>
                <p className="font-display font-bold text-xs line-clamp-3 leading-snug">{book.title}</p>
                <div className="text-[9px] font-bold text-neutral-400 border-t border-white/10 pt-1">
                  {book.author || "DECCAN"}
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/10 transition-colors" />

            {/* Quick View absolute widget */}
            {setQuickBoxBook && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuickBoxBook(book);
                }}
                className="absolute inset-x-3 bottom-3 bg-white/95 backdrop-blur shadow-lg text-[10px] font-black text-neutral-900 uppercase py-2 px-3 rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
              >
                👁️ Quick View
              </button>
            )}

            {/* Float discount badge */}
            {book.discount > 0 && (
              <div className="absolute top-3 left-3 bg-orange-500 text-white font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow">
                {book.discount}% OFF
              </div>
            )}
          </div>
        </Link>

        {/* Title details */}
        <div className="space-y-1 mt-3">
          <Link to={`/book/${book.id}`}>
            <h4 
              className="text-neutral-900 group-hover:text-red-700 transition-colors line-clamp-2"
              style={{ fontSize: '22px', fontWeight: 600, lineHeight: '32px', height: '64px' }}
            >
              {book.title}
            </h4>
          </Link>
          <p 
            className="text-zinc-400 block truncate mt-1"
            style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}
          >
            {book.author ? book.author.toUpperCase() : "PUNE EXPERTS"}
          </p>

          {/* Star Ratings */}
          <div className="flex items-center gap-1 text-orange-400 mt-1 h-5">
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
        <div className="flex items-baseline justify-between mb-3 h-10">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-red-950 leading-none" style={{ fontSize: '36px', fontWeight: 700 }}>
              {formatPrice(book.finalPrice)}
            </span>
            <span className="text-sm text-zinc-400 line-through font-medium leading-none">
              {formatPrice(book.price)}
            </span>
          </div>
          {book.discount > 0 && (
            <span className="leading-none" style={{ fontSize: '16px', fontWeight: 600, color: '#16a34a' }}>
              Save {book.discount}%
            </span>
          )}
        </div>

        {/* Order triggering actions */}
        <div className="flex gap-2.5">
          <button
            onClick={handleAddToCart}
            className="flex-1 h-11 bg-neutral-900 hover:bg-neutral-800 hover:-translate-y-0.5 active:scale-95 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <ShoppingCart size={13} /> Add
          </button>

          <button
            onClick={handleToggleWishlist}
            className={cn(
              "h-11 w-11 shrink-0 rounded-xl border transition-all active:scale-95 flex items-center justify-center cursor-pointer hover:-translate-y-0.5",
              isWishlisted
                ? "bg-red-50 border-red-100 text-red-500"
                : "bg-neutral-50 border-neutral-100 text-neutral-400 hover:text-red-700"
            )}
          >
            <Heart size={13} fill={isWishlisted ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
}
