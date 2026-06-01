import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Book, KoboOffer, Coupon } from '../types';
import { storeService } from '../services/storeService';

interface CartContextType {
  items: CartItem[];
  addToCart: (book: Book) => void;
  removeFromCart: (bookId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  koboDiscount: number;
  appliedOfferName: string | null;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Error parsing cart from localStorage:', err);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (book: Book) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === book.id);
      if (existing) {
        return prev.map((item) =>
          item.id === book.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...book, quantity: 1 }];
    });
  };

  const removeFromCart = (bookId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== bookId));
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === bookId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0)
    );
  };

  const clearCart = () => setItems([]);

  const [koboOffers, setKoboOffers] = useState<KoboOffer[]>([]);

  useEffect(() => {
    storeService.getKoboOffers()
      .then((offers) => {
        setKoboOffers(offers);
      })
      .catch((err) => {
        console.error('Error fetching Kobo offers:', err);
      });
  }, []);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('appliedCoupon');
      return saved ? JSON.parse(saved) : null;
    } catch (err) {
      console.error('Error parsing applied coupon from localStorage:', err);
      return null;
    }
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.finalPrice * item.quantity, 0);

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    const cleanCode = code.toUpperCase().trim();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a coupon code.' };
    }
    try {
      const coupons = await storeService.getCoupons() as Coupon[];
      const coupon = coupons.find((c: Coupon) => c.code.toUpperCase() === cleanCode);
      if (!coupon) {
        return { success: false, message: 'Invalid coupon code.' };
      }
      if (!coupon.active) {
        return { success: false, message: 'This coupon is no longer active.' };
      }
      if (subtotal < coupon.minCartValue) {
        return { success: false, message: `Minimum order value of ₹${coupon.minCartValue} is required to use this coupon.` };
      }
      setAppliedCoupon(coupon);
      localStorage.setItem('appliedCoupon', JSON.stringify(coupon));
      return { success: true, message: `Coupon "${cleanCode}" applied successfully!` };
    } catch (error) {
      console.error('Error applying coupon:', error);
      return { success: false, message: 'Failed to apply coupon. Please try again.' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    localStorage.removeItem('appliedCoupon');
  };

  // Filter and sort applicable active Kobo offers
  const eligibleOffers = koboOffers.filter(offer => {
    if (!offer.enabled) return false;
    if (offer.expiryDate && new Date(offer.expiryDate) < new Date()) return false;
    return totalItems >= offer.minQuantity;
  });

  let rawKoboDiscount = 0;
  let appliedOfferName: string | null = null;
  let currentKoboOffer: KoboOffer | null = null;

  if (eligibleOffers.length > 0) {
    eligibleOffers.sort((a, b) => b.minQuantity - a.minQuantity);
    const bestOffer = eligibleOffers[0];
    currentKoboOffer = bestOffer;
    rawKoboDiscount = bestOffer.discountAmount;
    appliedOfferName = bestOffer.name;
  } else {
    // Fallback standard tiered combo rules out-of-the-box
    if (totalItems >= 5) {
      rawKoboDiscount = 700;
      appliedOfferName = "Kobo Super Saver (5+ Books)";
    } else if (totalItems >= 3) {
      rawKoboDiscount = 300;
      appliedOfferName = "Kobo Mega Saver (3+ Books)";
    } else if (totalItems >= 2) {
      rawKoboDiscount = 200;
      appliedOfferName = "Kobo Starter Saver (2+ Books)";
    }
  }

  // Calculate Coupon Discount
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (subtotal >= appliedCoupon.minCartValue) {
      if (appliedCoupon.discountType === 'percentage') {
        couponDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      } else {
        couponDiscount = appliedCoupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, subtotal);
    } else {
      couponDiscount = 0;
    }
  }

  // Manage stacking logic
  let koboDiscount = rawKoboDiscount;
  if (appliedCoupon && koboDiscount > 0) {
    if (currentKoboOffer && !currentKoboOffer.stackable) {
      if (koboDiscount > couponDiscount) {
        couponDiscount = 0;
      } else {
        koboDiscount = 0;
      }
    }
  }

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      totalItems, 
      subtotal,
      koboDiscount,
      appliedOfferName,
      appliedCoupon,
      couponDiscount,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
