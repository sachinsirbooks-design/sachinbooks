import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  MapPin, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  BookOpen,
  Zap
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { checkoutService } from '../services/checkoutService';
import { pdfService } from '../services/pdfService';
import { formatPrice, cn } from '../lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import { storeService } from '../services/storeService';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Checkout() {
  const { 
    items, 
    subtotal, 
    clearCart, 
    totalItems, 
    koboDiscount, 
    appliedOfferName,
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'Online Payment' | 'Cash on Delivery'>('Online Payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [showConfigKeys, setShowConfigKeys] = useState(false);
  const [quickKeyId, setQuickKeyId] = useState('');
  const [quickKeySecret, setQuickKeySecret] = useState('');
  const [isSavingQuickKeys, setIsSavingQuickKeys] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.displayName || '',
    phone: '',
    addressLine: '',
    landmark: '',
    postOffice: '',
    taluka: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
  });

  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [publicCoupons, setPublicCoupons] = useState<any[]>([]);

  React.useEffect(() => {
    import('../services/storeService').then(({ storeService }) => {
      storeService.getCoupons()
        .then((allCoupons: any[]) => {
          const activePublic = allCoupons.filter(c => c.active && c.isPublic);
          setPublicCoupons(activePublic);
        })
        .catch((err) => {
          console.error('Error fetching public coupons on checkout:', err);
        });
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



  const handleSaveQuickKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickKeyId || !quickKeySecret) {
      toast.error('Please enter both Razorpay Key ID and Key Secret');
      return;
    }
    setIsSavingQuickKeys(true);
    try {
      const rzpSaveResp = await fetch('/api/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          testMode: true,
          keyId: quickKeyId,
          keySecret: quickKeySecret,
        }),
      });

      if (!rzpSaveResp.ok) {
        throw new Error('Server failed to securely encrypt credentials');
      }

      const rzpEncObj = await rzpSaveResp.json();

      const baseSettings = settings || {
        id: 'site_settings',
        logoUrl: '',
        socialLinks: {},
        seo: { title: 'Sachin Sir Books', description: '', keywords: '' },
        founder: { name: '', tagline: '', description: '', imageUrl: '' },
        whatsappChatbot: { phoneNumber: '', message: '', enabled: false }
      };

      const updatedSettings = {
        ...baseSettings,
        razorpay: {
          enabled: true,
          testMode: true,
          keyId: quickKeyId,
          encryptedKeySecret: rzpEncObj.encryptedKeySecret || '',
          encryptedWebhookSecret: rzpEncObj.encryptedWebhookSecret || '',
          keySecret: '',
          webhookSecret: ''
        }
      } as any;

      await storeService.updateSettings(updatedSettings);
      toast.success('Razorpay API keys saved successfully! Ready for real API test.');
      setShowConfigKeys(false);
      setQuickKeyId('');
      setQuickKeySecret('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save API keys: ' + (err.message || String(err)));
    } finally {
      setIsSavingQuickKeys(false);
    }
  };

  const SHIPPING_THRESHOLD = 999;
  const shippingCost = subtotal >= SHIPPING_THRESHOLD ? 0 : 60;
  const grandTotal = Math.max(0, subtotal + shippingCost - koboDiscount - couponDiscount);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
      // 1. Create order in Firebase first (Pending status)
      const orderData = {
        userId: user.uid,
        items,
        total: grandTotal,
        weight: 0,
        discount: koboDiscount + couponDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        couponApplied: !!appliedCoupon,
        status: 'pending' as const,
        address,
        createdAt: new Date().toISOString(),
      };

      const orderId = await checkoutService.createOrder(orderData);

      // 2. If Online Payment, handle Razorpay
      if (paymentMethod === 'Online Payment') {
        let rzpOrder: any = null;
        try {
          // Create Razorpay order on our server securely (no keys sent from browser)
          const rzpResponse = await fetch('/api/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: grandTotal,
              currency: "INR",
              receipt: orderId,
            }),
          });

          if (!rzpResponse.ok) {
            const errBody = await rzpResponse.json().catch(() => ({}));
            throw new Error(errBody.error || 'Failed to initiate secure payment gateway');
          }

          rzpOrder = await rzpResponse.json();
        } catch (gatewayErr: any) {
          console.error("Standard Razorpay initialization failed:", gatewayErr);
          toast.error(gatewayErr.message || 'Failed to initiate secure payment gateway');
          setIsProcessing(false);
          return;
        }

        // Load Razorpay script
        const loadScript = () => {
          return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const res = await loadScript();
        if (!res) {
          toast.error('Razorpay SDK failed to load. Are you online?');
          setIsProcessing(false);
          return;
        }

        const options = {
          key: rzpOrder.keyId || (settings?.razorpay?.keyId || ""),
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: settings?.seo?.title || "Sachin Sir Books",
          description: "Purchase from Sachin Sir Books",
          order_id: rzpOrder.id,
          handler: async (response: any) => {
             // Verify payment on server securely
             const verifyResp = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderId,
                }),
             });

             if (verifyResp.ok) {
                toast.success('Payment successful!');
                clearCart();
                navigate('/payment-success', { state: { orderId, paymentId: response.razorpay_payment_id } });
             } else {
                toast.error('Payment verification failed');
                await fetch('/api/record-failed-payment', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: orderId,
                    errorReason: 'Signature evaluation failed on server verification route',
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id
                  }),
                });
             }
          },
          prefill: {
            name: address.fullName,
            email: user.email,
            contact: address.phone,
          },
          theme: {
            color: "#D97706",
          },
          modal: {
            ondismiss: async () => {
               setIsProcessing(false);
               toast('Payment cancelled', { icon: 'ℹ️' });
               await fetch('/api/record-failed-payment', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({
                   orderId: orderId,
                   errorReason: 'Razorpay payment checkout modal closed by customer',
                   razorpayOrderId: rzpOrder.id
                 })
               });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async (response: any) => {
          toast.error('Payment failed: ' + response.error.description);
          await fetch('/api/record-failed-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderId,
              errorReason: response.error.description,
              razorpayOrderId: response.error.metadata.order_id,
              razorpayPaymentId: response.error.metadata.payment_id
            })
          });
          setIsProcessing(false);
        });
        rzp.open();
        return;
      }

      // 3. Default path (COD or Razorpay disabled)
      toast.success('Order placed successfully via Cash on Delivery!');
      
      /*
      pdfService.generateInvoice({
        ...orderData,
        id: orderId,
      });
      */

      clearCart();
      navigate('/profile');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to place order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return <div className="min-h-screen flex items-center justify-center"><Link to="/cart">Go back to cart</Link></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-10 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation */}
        <Link to="/cart" className="inline-flex items-center gap-2 text-neutral-400 hover:text-neutral-900 font-display font-bold text-xs uppercase tracking-widest group mb-12">
          <div className="p-2 bg-white rounded-lg border border-neutral-100 group-hover:bg-neutral-950 group-hover:text-white transition-all shadow-sm">
            <ArrowLeft size={16} />
          </div>
          Back to Shopping Bag
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Main Flow */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-8 mb-12 overflow-x-auto pb-4 no-scrollbar">
              {[
                { n: 1, label: 'Delivery Details' },
                { n: 2, label: 'Payment Gateway' },
                { n: 3, label: 'Order Summary' }
              ].map(s => (
                <div key={s.n} className="flex items-center gap-3 shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold transition-all",
                    step >= s.n ? "bg-neutral-950 text-white" : "bg-neutral-100 text-neutral-400"
                  )}>
                    {s.n}
                  </div>
                  <span className={cn(
                    "font-display font-bold whitespace-nowrap uppercase tracking-widest text-[10px]",
                    step >= s.n ? "text-neutral-900" : "text-neutral-300"
                  )}>
                    {s.label}
                  </span>
                  {s.n < 3 && <ChevronRight size={14} className="text-neutral-200" />}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[3rem] p-8 md:p-12 border border-neutral-100 shadow-2xl shadow-neutral-900/5"
                >
                  <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                      <MapPin size={24} />
                    </div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">Shipping Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Full Name</label>
                       <input 
                        required
                        name="fullName" value={address.fullName} onChange={handleInputChange} 
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="Sachin Kumar"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Phone Number</label>
                       <input 
                        required
                        name="phone" value={address.phone} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="+91 99999 88888"
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Full Address (Building, Road, Area)</label>
                       <input 
                        required
                        name="addressLine" value={address.addressLine} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="H No. 42 / Flat 301, Appa Balwant Chowk"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Landmark</label>
                       <input 
                        required
                        name="landmark" value={address.landmark} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="Near Balaji Temple"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Post Office</label>
                       <input 
                        required
                        name="postOffice" value={address.postOffice} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="Pune G.P.O."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Taluka / Sub-District</label>
                       <input 
                        required
                        name="taluka" value={address.taluka} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="Haveli"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">City</label>
                       <input 
                        required
                        name="city" value={address.city} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="Pune"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">State</label>
                       <select 
                        required
                        name="state" value={address.state} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs text-neutral-800"
                       >
                         {[
                           "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
                           "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
                           "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
                           "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
                           "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
                           "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
                         ].map(st => (
                           <option key={st} value={st}>{st}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2 col-span-1 md:col-span-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Pincode</label>
                       <input 
                        required
                        name="pincode" value={address.pincode} onChange={handleInputChange}
                        className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-bold focus:ring-2 focus:ring-blue-500/20 text-xs" 
                        placeholder="411002"
                       />
                    </div>
                  </div>

                  <div className="mt-12 flex justify-end">
                    <button 
                      onClick={() => setStep(2)}
                      className="bg-neutral-950 text-white px-10 py-5 rounded-2xl font-display font-bold hover:bg-neutral-800 transition-all flex items-center gap-2 group active:scale-95"
                    >
                      Continue to Payment <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl shadow-neutral-900/5 text-center py-24"
                >
                  <div className="w-24 h-24 bg-blue-100 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto mb-10">
                    <CreditCard size={48} />
                  </div>
                  <h2 className="text-4xl font-display font-bold tracking-tight mb-4">Secure Payment Method</h2>
                  <p className="text-neutral-500 max-w-md mx-auto mb-12">Choose how you'd like to pay for your learning resources. All transactions are end-to-end encrypted.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    {['Online Payment', 'Cash on Delivery'].map((method: any) => (
                      <button 
                        key={method}
                        onClick={() => {
                          setPaymentMethod(method);
                          setStep(3);
                        }}
                        className={cn(
                          "p-6 border-2 rounded-3xl transition-all flex flex-col items-center gap-3 group active:scale-95",
                          paymentMethod === method ? "border-blue-600 bg-blue-50/50" : "border-neutral-100 hover:border-blue-200"
                        )}
                      >
                         <div className={cn(
                           "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                           paymentMethod === method ? "bg-blue-600 text-white" : "bg-neutral-50 text-neutral-300"
                         )}>
                            <Zap size={18} />
                         </div>
                         <span className="font-display font-bold text-neutral-900">{method}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setStep(1)} className="mt-12 text-sm font-sans font-bold text-neutral-400 hover:text-neutral-950 transition-colors uppercase tracking-widest underline underline-offset-8">Go back to address</button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white rounded-[3rem] p-12 border border-neutral-100 shadow-2xl shadow-neutral-900/5"
                >
                  <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-neutral-950 rounded-2xl flex items-center justify-center text-white">
                      <ShieldCheck size={24} />
                    </div>
                    <h2 className="text-3xl font-display font-bold tracking-tight">Final Confirmation</h2>
                  </div>

                  <div className="space-y-8 mb-12">
                    <div className="flex justify-between items-start p-6 bg-neutral-50 rounded-2xl group border border-transparent hover:border-neutral-100 transition-all">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Ship To</h4>
                        <p className="font-display font-bold text-neutral-900">{address.fullName}</p>
                        <p className="text-sm text-neutral-500 font-sans leading-relaxed">
                          {address.addressLine}
                          {address.landmark && `, Landmark: ${address.landmark}`}
                          {address.postOffice && `, P.O: ${address.postOffice}`}
                          {address.taluka && `, Taluka: ${address.taluka}`}
                          , {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                      <button onClick={() => setStep(1)} className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:underline">Change</button>
                    </div>

                    <div className="bg-neutral-50 rounded-[2.5rem] p-8">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-6">Review Items</h4>
                       <div className="space-y-4">
                          {items.map(item => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                               <span className="font-sans font-medium text-neutral-600">{item.title} (x{item.quantity})</span>
                               <span className="font-display font-bold text-neutral-900">{formatPrice(item.finalPrice * item.quantity)}</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  {paymentMethod === 'Online Payment' && (
                    <div className="bg-neutral-50 rounded-[2rem] p-6 border border-neutral-200/60 mb-8 text-left space-y-4">
                      <div className="flex justify-between items-center text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Payment Gateway</span>
                        <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-250">
                          Secure Razorpay Gateway
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        {settings?.razorpay?.keyId 
                          ? isAdmin 
                            ? `🔑 SECURE PAYMENT ACTIVE: Identified registered Razorpay Credentials (Key ID: "${settings.razorpay.keyId}"). Clicking the button below will securely launch the authentic Razorpay checkout gateway.` 
                            : "🔑 SECURE PAYMENT ACTIVE: Clicking the button below will securely launch the authentic Razorpay checkout gateway."
                          : isAdmin 
                            ? "⚠️ No standard credentials detected in site settings. Click below to enter your Razorpay test or live Key ID & Secret to receive standard online student payments."
                            : "💳 Online Payment is ready. Clicking the button below will securely process your order."}
                      </p>

                      {isAdmin && (
                        <div className="pt-2 border-t border-neutral-200/50">
                          {!showConfigKeys ? (
                            <button
                              type="button"
                              onClick={() => setShowConfigKeys(true)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              ⚙️ {settings?.razorpay?.keyId ? 'Update Credentials / Reconfigure API Keys' : 'Configure Razorpay API Keys Directly'}
                            </button>
                          ) : (
                            <div className="space-y-4 bg-white p-4 rounded-xl border border-neutral-150 mt-2">
                              <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-800">⚙️ Live API Key Setup</h4>
                                <button
                                  type="button"
                                  onClick={() => setShowConfigKeys(false)}
                                  className="text-neutral-400 hover:text-rose-600 font-bold text-xs"
                                >
                                  Close
                                </button>
                              </div>
                              <form onSubmit={handleSaveQuickKeys} className="space-y-3">
                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Razorpay Key ID</label>
                                  <input
                                    type="text"
                                    required
                                    value={quickKeyId}
                                    onChange={(e) => setQuickKeyId(e.target.value)}
                                    placeholder="rzp_live_... or rzp_test_..."
                                    className="w-full text-xs font-bold bg-neutral-50 px-3.5 py-2.5 rounded-lg border border-neutral-200 outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-wider text-neutral-400 mb-1">Key Secret</label>
                                  <input
                                    type="password"
                                    required
                                    value={quickKeySecret}
                                    onChange={(e) => setQuickKeySecret(e.target.value)}
                                    placeholder="your_razorpay_key_secret"
                                    className="w-full text-xs font-bold bg-neutral-50 px-3.5 py-2.5 rounded-lg border border-neutral-200 outline-none focus:border-blue-500"
                                  />
                                </div>
                                <div className="text-[9px] text-neutral-400 leading-tight">
                                  💡 Stored securely using standard server-side encryption. You can get yours from <strong>dashboard.razorpay.com</strong> under Settings → API Keys.
                                </div>
                                <button
                                  type="submit"
                                  disabled={isSavingQuickKeys}
                                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider hover:bg-blue-700 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  {isSavingQuickKeys ? 'Saving to Database...' : '⚡ Save & Apply Keys'}
                                </button>
                              </form>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className={cn(
                      "w-full py-6 rounded-3xl font-display font-black text-2xl transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4",
                      paymentMethod === 'Online Payment' 
                        ? "bg-blue-600 text-white shadow-blue-500/20" 
                        : "bg-neutral-900 text-white hover:bg-neutral-800 shadow-neutral-950/20"
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-6 h-6 border-4 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'Online Payment' ? 'Pay Now & Confirm' : 'Confirm Order (COD)'}
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="bg-white rounded-[2.5rem] border border-neutral-100 p-8 shadow-sm">
               <h3 className="font-display font-bold text-xl mb-8 flex items-center gap-2">
                 Cart Total <div className="h-px flex-1 bg-neutral-100" />
               </h3>
               
               <div className="space-y-6">
                  <div className="flex justify-between text-neutral-500 font-sans text-sm">
                    <span>Preparation Subtotal</span>
                    <span className="font-bold text-neutral-900">{formatPrice(subtotal)}</span>
                  </div>
                   {koboDiscount > 0 && (
                      <div className="flex justify-between items-center bg-[#5c0612]/5 text-[#5c0612] px-4 py-3 rounded-xl font-sans text-xs font-bold leading-normal mb-6">
                         <div className="flex flex-col">
                            <span className="font-black text-[9px] uppercase tracking-wider">Kobo Combo Offer:</span>
                            <span className="text-[10px] text-[#5c0612]/80 leading-tight block">{appliedOfferName}</span>
                         </div>
                         <span className="font-extrabold text-sm whitespace-nowrap">- {formatPrice(koboDiscount)}</span>
                      </div>
                   )}
                  <div className="flex justify-between text-neutral-500 font-sans text-sm pb-6 border-b border-neutral-100">
                    <span>Shipping Fee</span>
                    <span className={cn("font-bold text-neutral-900", shippingCost === 0 ? "text-green-500" : "")}>
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}
                    </span>
                  </div>
                   {couponDiscount > 0 && (
                      <div className="flex justify-between items-center bg-green-500/5 text-green-700 px-4 py-3 rounded-xl font-sans text-xs font-bold leading-normal mb-4">
                         <div className="flex flex-col text-left">
                            <span className="font-black text-[9px] uppercase tracking-wider text-green-600">Coupon Discount:</span>
                            <span className="text-[10px] text-green-700/80 leading-tight block font-mono">{appliedCoupon?.code}</span>
                         </div>
                         <span className="font-extrabold text-sm whitespace-nowrap">- {formatPrice(couponDiscount)}</span>
                      </div>
                   )}

                   {/* Promo Coupon on Checkout */}
                   <div className="border-t border-neutral-100 pt-6 mt-4 pb-2 mb-6">
                     <p className="text-[10px] font-black uppercase tracking-[0.12em] text-neutral-400 mb-2 text-left">Have a Promo Coupon?</p>
                     {!appliedCoupon ? (
                       <div className="flex gap-2">
                         <input 
                           type="text" 
                           placeholder="ENTER CODE" 
                           value={couponInput}
                           onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                           className="flex-1 min-w-0 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs font-bold placeholder-neutral-400 focus:outline-none focus:border-blue-500 text-neutral-900 font-mono"
                         />
                         <button 
                           type="button"
                           onClick={handleApplyCoupon}
                           disabled={isApplyingCoupon}
                           className="bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shrink-0 cursor-pointer"
                         >
                           {isApplyingCoupon ? '...' : 'Apply'}
                         </button>
                       </div>
                     ) : (
                       <div className="flex justify-between items-center bg-green-50 border border-green-150 text-green-700 px-4 py-3 rounded-xl font-sans text-xs font-bold leading-normal">
                         <div className="flex flex-col text-left">
                           <span className="font-black text-[9px] uppercase tracking-wider text-green-600">Applied Coupon:</span>
                           <span className="text-xs font-extrabold text-neutral-900 block mt-0.5">{appliedCoupon.code}</span>
                         </div>
                         <button 
                           type="button"
                           onClick={removeCoupon}
                           className="text-[9px] uppercase font-black tracking-widest text-neutral-400 hover:text-rose-600 px-2.5 py-1 bg-white hover:bg-neutral-50 rounded-lg transition-colors border border-neutral-150 cursor-pointer"
                         >
                           Remove
                         </button>
                       </div>
                     )}

                     {/* Public Coupons Selection on Checkout */}
                     {publicCoupons.length > 0 && !appliedCoupon && (
                       <div className="mt-3">
                         <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5 text-left">Available Coupon Offers:</p>
                         <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                           {publicCoupons.map((cp) => (
                             <button
                               key={cp.id}
                               type="button"
                               onClick={() => handleQuickApply(cp.code)}
                               className="bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 hover:border-blue-500/30 text-[10px] font-mono text-neutral-600 hover:text-neutral-900 px-2 py-1 rounded-lg transition-all text-left flex flex-col shrink-0 cursor-pointer"
                             >
                               <span className="font-extrabold text-blue-600">{cp.code}</span>
                               <span className="text-[8px] text-neutral-400">
                                 {cp.discountType === 'percentage' ? `${cp.discountValue}% Off` : `₹${cp.discountValue} Off`}
                               </span>
                             </button>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                  <div className="pt-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400 mb-2 text-left">Amount Payable</p>
                     <p className="text-5xl font-display font-bold text-neutral-950 mb-8 text-left">{formatPrice(grandTotal)}</p>
                  </div>
               </div>

                <div className="flex items-center gap-4 bg-green-50 rounded-2xl p-4 border border-green-100">
                   <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                      <Truck size={20} />
                   </div>
                   <p className="text-[11px] font-sans font-medium text-green-900 leading-tight">
                     Estimated delivery in <span className="font-bold">2-4 working days</span> for Maharashtra addresses.
                   </p>
                </div>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-neutral-400">
               <BookOpen size={24} />
               <div className="h-px w-8 bg-neutral-200" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validated by MBC Staff</span>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
