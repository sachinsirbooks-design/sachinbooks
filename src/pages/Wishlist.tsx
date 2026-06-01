import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Trash2, 
  ShoppingBag, 
  ArrowRight,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Wishlist() {
  const { items, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-300 mb-8">
          <Heart size={40} fill="currentColor" />
        </div>
        <h2 className="text-4xl font-display font-bold text-neutral-950 mb-4 tracking-tight">Your Wishlist is Empty</h2>
        <p className="text-neutral-500 font-sans max-w-sm text-center mb-10 leading-relaxed">Planning your preparation? Save books here to track your syllabus collection.</p>
        <Link to="/categories" className="bg-neutral-950 text-white px-10 py-5 rounded-3xl font-display font-bold text-xl hover:bg-neutral-800 transition-all shadow-xl active:scale-95">
          Find My Resources
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-20">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">My Interests</span>
              <div className="h-px w-12 bg-rose-200" />
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-neutral-950 tracking-tight">Saved Favorites</h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs font-sans font-bold text-neutral-400 uppercase tracking-widest mb-1">Total Saved</p>
            <p className="text-4xl font-display font-bold text-neutral-900">{items.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8">
          <AnimatePresence>
            {items.map((book) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={book.id} 
                className="group bg-white rounded-[2.5rem] p-4 border border-neutral-100 hover:shadow-2xl transition-all"
              >
                <div className="relative aspect-[3/4] rounded-[2rem] overflow-hidden mb-6 bg-neutral-50">
                   <img src={getDriveImageUrl(book.imageUrl)} alt={book.title} className="w-full h-full object-cover" />
                   <button 
                    onClick={() => toggleWishlist(book)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-rose-500 shadow-lg hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                   >
                     <Trash2 size={20} />
                   </button>
                </div>

                <div className="px-2 pb-2">
                   <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2 block">{book.category}</span>
                   <Link to={`/book/${book.id}`}>
                    <h3 className="font-display font-bold text-lg text-neutral-900 line-clamp-1 mb-3 hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                   </Link>
                   
                   <div className="flex items-center justify-between gap-4 mt-6">
                      <p className="font-display font-bold text-xl text-neutral-950">{formatPrice(book.finalPrice)}</p>
                      <button 
                        onClick={() => addToCart(book)}
                        className="bg-neutral-950 text-white px-6 py-3 rounded-2xl font-display font-bold text-xs flex items-center gap-2 hover:bg-neutral-800 transition-all active:scale-95"
                      >
                        <ShoppingBag size={16} /> Add to Bag
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Suggestion Section */}
        <div className="mt-40 bg-neutral-900 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full -mr-48 -mt-48" />
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                 <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 tracking-tight">Need help building your <br/><span className="text-blue-500 italic font-medium">prep collection?</span></h2>
                 <p className="text-neutral-400 font-sans text-lg mb-8 leading-relaxed max-w-md">Our counselors offer free book synchronization sessions to match your exam targets with the most efficient reading material.</p>
                 <a href="https://wa.me/919172203333" target="_blank" rel="noopener" className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-3xl font-display font-bold text-xl hover:bg-blue-700 transition-all group active:scale-95 shadow-xl shadow-blue-500/20">
                   Request Prep Guidance <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                 </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 {[
                   { icon: <Bookmark />, title: 'Mapped Subjects', val: '45+' },
                   { icon: <TrendingUp />, title: 'Success Rate', val: '86%' },
                   { icon: <Heart />, title: 'User Trust', val: '50k+' },
                   { icon: <ShoppingBag />, title: 'Titles Stock', val: '12k+' }
                 ].map(stat => (
                   <div key={stat.title} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
                      <div className="text-blue-500 mb-4">{stat.icon}</div>
                      <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-1">{stat.title}</p>
                      <p className="text-2xl font-display font-bold text-white">{stat.val}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
