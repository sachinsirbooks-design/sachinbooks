import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, ArrowRight, ShoppingBag, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { pdfService } from '../services/pdfService';
import { formatPrice } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, paymentId } = location.state || {};
  const [orderData, setOrderData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        const docRef = doc(db, 'orders', orderId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setOrderData(snap.data());
        }
      } catch (err) {
        console.error("Error loading success order details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate]);

  const handleDownloadInvoice = () => {
    if (!orderData || !orderId) return;
    pdfService.generateInvoice({
      ...orderData,
      id: orderId,
      status: 'processing'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-[3rem] p-8 md:p-14 border border-neutral-100 shadow-xl text-center shadow-neutral-100/50"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', damping: 10, stiffness: 80, delay: 0.2 }}
            className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border-2 border-emerald-100 shadow-inner"
          >
            <CheckCircle2 size={54} />
          </motion.div>
        </div>

        <h1 className="font-display font-black text-4xl text-neutral-900 leading-tight mb-3">
          Payment Successful!
        </h1>
        <p className="text-neutral-500 font-sans text-sm md:text-base mb-8 max-w-md mx-auto">
          Thank you for your purchase! Your payment has been securely verified and processed. Your invoice has been generated below.
        </p>

        {loading ? (
          <div className="py-6 flex justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          orderData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-50 rounded-[2rem] p-6 mb-8 text-left border border-neutral-100 font-sans text-xs space-y-3"
            >
              <div className="flex justify-between border-b border-neutral-200/50 pb-3">
                <span className="text-neutral-400 font-bold uppercase tracking-wider">Transaction ID</span>
                <span className="font-mono font-bold text-neutral-800 uppercase">{(orderId || '').substring(0, 12)}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between border-b border-neutral-200/50 pb-3">
                  <span className="text-neutral-400 font-bold uppercase tracking-wider">Razorpay Payment ID</span>
                  <span className="font-mono font-bold text-neutral-800">{paymentId}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-neutral-200/50 pb-3">
                <span className="text-neutral-400 font-bold uppercase tracking-wider">Amount Paid</span>
                <span className="font-display font-black text-sm text-neutral-900">{formatPrice(orderData.total)}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200/50 pb-3">
                <span className="text-neutral-400 font-bold uppercase tracking-wider">Customer Name</span>
                <span className="font-bold text-neutral-800">{orderData.address?.fullName}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-neutral-400 font-bold uppercase tracking-wider">Items Purchased</span>
                <span className="font-bold text-neutral-800">{orderData.items?.length || 0} items</span>
              </div>
            </motion.div>
          )
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleDownloadInvoice}
            disabled={loading || !orderData}
            className="w-full sm:w-auto px-8 py-4 bg-amber-500 text-black hover:bg-neutral-900 hover:text-white transition-all rounded-2xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10 disabled:opacity-50"
          >
            <Download size={16} />
            Download Invoice PDF
          </button>
          
          <Link
            to="/profile"
            className="w-full sm:w-auto px-8 py-4 bg-neutral-900 text-white hover:bg-neutral-800 transition-all rounded-2xl font-display font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            View My Orders
          </Link>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-amber-500 text-xs font-black uppercase tracking-wider font-display transition-colors"
          >
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
