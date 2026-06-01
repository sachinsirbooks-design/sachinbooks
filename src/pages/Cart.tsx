import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Info,
  CircleHelp
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getDriveImageUrl, formatPrice, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { Coupon } from '../types';
import { storeService } from '../services/storeService';
import toast from 'react-hot-toast';

export default function Cart() {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    subtotal, 
    totalItems, 
    koboDiscount, 
    appliedOfferName,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = React.useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = React.useState(false);
  const [publicCoupons, setPublicCoupons] = React.useState<Coupon[]>([]);

  React.useEffect(() => {
    storeService.getCoupons()
      .then((allCoupons: any[]) => {
        const activePublic = allCoupons.filter(c => c.active && c.isPublic);
        setPublicCoupons(activePublic as Coupon[]);
      })
      .catch((err) => {
        console.error('Error fetching public coupons:', err);
      });
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponInput) {
      toast.error('Please enter a coupon code.');
      return;
    }
    setIsApplyingCoupon(true);
    const result = await applyCoupon(couponInput);
    setIsApplyingCoupon(false);
    if (result.success) {
      toast.success(result.message);
      setCouponInput('');
    } else {
      toast.error(result.message);
    }
  };

  const handleQuickApply = async (code: string) => {
    setIsApplyingCoupon(true);
    const result = await applyCoupon(code);
    setIsApplyingCoupon(false);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const SHIPPING_THRESHOLD = 999;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : 60;
  const grandTotal = Math.max(0, subtotal + shippingCost - koboDiscount - couponDiscount);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-300 mb-8">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-4xl font-display font-bold text-neutral-950 mb-4 tracking-tight">Your bag is empty</h2>
        <p className="text-neutral-500 font-sans max-w-sm text-center mb-10 leading-relaxed">Preparation starts with the right gear. Browse our curated catalogs to find your study essentials.</p>
        <Link to="/categories" className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-display font-bold text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <span className="bg-neutral-950 text-white px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest">My Basket</span>
              <div className="h-px w-8 md:w-12 bg-neutral-200" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-bold text-neutral-950 tracking-tight">Shopping Bag</h1>
          </div>
          <div className="bg-white rounded-2xl px-5 md:px-6 py-3 md:py-4 border border-neutral-100 flex items-center gap-4 shadow-sm w-full md:w-auto">
            <div className="flex flex-col flex-1 md:flex-none">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Items</span>
              <span className="font-display font-bold text-xl md:text-2xl text-neutral-900">{totalItems}</span>
            </div>
            <div className="h-8 w-px bg-neutral-100" />
             <div className="flex flex-col flex-1 md:flex-none">
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">Total</span>
              <span className="font-display font-bold text-xl md:text-2xl text-neutral-900">{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Cart Items */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={item.id} 
                  className="bg-white rounded-[2.5rem] p-6 border border-neutral-100 flex flex-col sm:flex-row items-center gap-6 group hover:shadow-2xl hover:shadow-neutral-900/5 transition-all"
                >
                  <Link to={`/book/${item.id}`} className="w-full sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-50 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                    <img src={getDriveImageUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                  </Link>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div>
                        <Link to={`/category/${item.category}`} className="text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-blue-600 mb-2 block break-all truncate">
                          {item.category}
                        </Link>
                        <Link to={`/book/${item.id}`}>
                          <h3 className="font-display font-bold text-xl text-neutral-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-2">
                            {item.title}
                          </h3>
                        </Link>
                        <p className="text-xs font-sans text-neutral-400 mb-4">ISBN: MBC-MOD-{item.id.substring(0, 6).toUpperCase()}</p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4 bg-neutral-50 rounded-2xl p-1 px-4 border border-neutral-100">
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-display font-bold text-lg min-w-[2ch] text-center">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-10 h-10 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300 mb-1">Line Total</p>
                             <p className="font-display font-bold text-xl text-neutral-900">{formatPrice(item.finalPrice * item.quantity)}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-12 h-12 bg-neutral-50 rounded-2xl flex items-center justify-center text-neutral-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex flex-col md:flex-row items-center gap-6">
               <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 flex-shrink-0">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <h4 className="font-display font-bold text-neutral-900 mb-1">Official Trust Guarantee</h4>
                  <p className="text-sm font-sans text-blue-900/60 leading-relaxed font-semibold">Every book in your bag is carefully source-verified to match the latest official MPSC/UPSC curricula. If you find a mismatch within 7 days, we offer a full replacement.</p>
               </div>
            </div>
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-neutral-900 text-white rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 overflow-hidden relative shadow-2xl shadow-neutral-900/20">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
              
              <h3 className="font-display font-bold text-2xl mb-10 relative z-10 flex items-center gap-3">
                Order Summary <div className="h-px flex-1 bg-white/10" />
              </h3>

              <div className="space-y-6 mb-12 relative z-10">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-sans text-sm">Subtotal</span>
                  <span className="font-display font-bold">{formatPrice(subtotal)}</span>
                </div>
                
                {koboDiscount > 0 && (
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl font-sans text-xs font-bold leading-normal relative z-10">
                     <div className="flex flex-col text-left">
                        <span className="text-[9px] text-[#22c55e] font-black uppercase tracking-wider">Combo Discount:</span>
                        <span className="text-[10px] text-neutral-400 font-medium leading-tight block mt-1">{appliedOfferName}</span>
                     </div>
                     <span className="font-display font-bold text-[#22c55e] text-sm whitespace-nowrap">- {formatPrice(koboDiscount)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between items-center bg-white/5 border border-white/5 p-4 rounded-xl font-sans text-xs font-bold leading-normal relative z-10">
                     <div className="flex flex-col text-left">
                        <span className="text-[9px] text-[#22c55e] font-black uppercase tracking-wider">Coupon Discount:</span>
                        <span className="text-[10px] text-neutral-400 font-medium leading-tight block mt-1">{appliedCoupon?.code}</span>
                     </div>
                     <span className="font-display font-bold text-[#22c55e] text-sm whitespace-nowrap">- {formatPrice(couponDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-neutral-400 font-sans text-sm">Delivery Fee</span>
                  <span className={cn("font-display font-bold", shippingCost === 0 ? "text-green-500" : "")}>
                    {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                  </span>
                </div>

                {shippingCost > 0 && (
                  <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <Info size={16} className="text-blue-500 shrink-0" />
                    <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                      Add <span className="text-white font-bold">{formatPrice(SHIPPING_THRESHOLD - subtotal)}</span> more to unlock <span className="text-green-500 font-bold italic">FREE SHIPPING</span>
                    </p>
                  </div>
                )}

                {/* Coupon Code Entry */}
                <div className="border-t border-white/10 pt-6 relative z-10">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400 mb-2">Have a Promo Coupon?</p>
                  {!appliedCoupon ? (
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="ENTER CODE" 
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                        className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold placeholder-neutral-600 focus:outline-none focus:border-blue-500 text-white"
                      />
                      <button 
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shrink-0"
                      >
                        {isApplyingCoupon ? '...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl font-sans text-xs font-bold leading-normal">
                      <div className="flex flex-col text-left">
                        <span className="font-black text-[9px] uppercase tracking-wider text-green-500">Coupon Code Applied:</span>
                        <span className="text-xs font-extrabold text-white block mt-0.5">{appliedCoupon.code}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={removeCoupon}
                        className="text-[9px] uppercase font-black tracking-widest text-[#22c55e]/80 hover:text-white px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Public Active Coupons List */}
                  {publicCoupons.length > 0 && !appliedCoupon && (
                    <div className="mt-3">
                      <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mb-1.5">Available Coupon Offers:</p>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {publicCoupons.map((cp) => (
                          <button
                            key={cp.id}
                            type="button"
                            onClick={() => handleQuickApply(cp.code)}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-blue-500/30 text-[10px] font-mono text-neutral-300 hover:text-white px-2.5 py-1 rounded-lg transition-all text-left flex flex-col shrink-0 cursor-pointer"
                          >
                            <span className="font-extrabold text-blue-400">{cp.code}</span>
                            <span className="text-[8px] text-neutral-500">
                              {cp.discountType === 'percentage' ? `${cp.discountValue}% Off` : `₹${cp.discountValue} Off`}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                   <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-2">Grand Total</p>
                    <span className="text-4xl font-display font-bold text-blue-500">{formatPrice(grandTotal)}</span>
                   </div>
                   <div className="text-neutral-500 text-[10px] font-sans font-bold uppercase tracking-wider text-right">
                     incl. all taxes
                   </div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                {user ? (
                   <button 
                    onClick={() => navigate('/checkout')}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-display font-black text-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-blue-500/20"
                  >
                    Checkout <ArrowRight size={22} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-xs text-neutral-500 font-sans mb-4 uppercase tracking-widest">Login required for secure checkout</p>
                    <button 
                      onClick={login}
                      className="w-full py-5 bg-white text-black rounded-2xl font-display font-black text-xl hover:bg-neutral-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                    >
                      Login to Pay
                    </button>
                  </div>
                )}
                
                <p className="flex items-center justify-center gap-2 text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] pt-4">
                  <ShieldCheck size={14} className="text-blue-500" /> Secure Payments Powered by Razorpay
                </p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
               <div className="bg-white p-4 rounded-3xl border border-neutral-100 flex items-center gap-3">
                  <Truck size={20} className="text-neutral-300" />
                  <span className="text-[10px] font-display font-bold uppercase text-neutral-900 leading-tight">Fast<br/>Dispatch</span>
               </div>
               <div className="bg-white p-4 rounded-3xl border border-neutral-100 flex items-center gap-3">
                  <CircleHelp size={20} className="text-neutral-300" />
                  <span className="text-[10px] font-display font-bold uppercase text-neutral-900 leading-tight">24/7<br/>Support</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
