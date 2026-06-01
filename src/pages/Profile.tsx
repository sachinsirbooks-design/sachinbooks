import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  LogOut, 
  ListOrdered, 
  Heart, 
  Settings, 
  ChevronRight,
  ArrowRight,
  Clock,
  ShieldCheck,
  Zap,
  BookOpen,
  Download,
  ExternalLink
} from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { storeService } from '../services/storeService';
import { Order } from '../types';
import CourierLabelModal from '../components/CourierLabelModal';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, profile, logout, isAdmin } = useAuth();
  const { items: wishlistItems } = useWishlist();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = React.useState(true);
  const [selectedLabelOrder, setSelectedLabelOrder] = React.useState<Order | null>(null);

  React.useEffect(() => {
    let active = true;
    const fetchUserOrders = async () => {
      if (!user) return;
      try {
        const allOrders = await storeService.getOrders();
        if (active) {
          const userOrders = allOrders.filter(o => o.userId === user.uid);
          setOrders(userOrders);
        }
      } catch (err) {
        console.error("Failed to load user orders", err);
      } finally {
        if (active) setLoadingOrders(false);
      }
    };
    fetchUserOrders();
    return () => { active = false; };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-neutral-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] rounded-full -mr-16 -mt-16" />
               <div className="flex flex-col items-center text-center relative z-10">
                  <div className="w-32 h-32 rounded-[2.5rem] bg-neutral-900 flex items-center justify-center border-4 border-white shadow-xl mb-6 relative group transition-all cursor-pointer">
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="" className="w-full h-full rounded-[2.2rem] object-cover" />
                     ) : (
                       <UserIcon size={48} className="text-neutral-600" />
                     )}
                     <div className="absolute inset-0 bg-black/40 rounded-[2.2rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Settings className="text-white" size={24} />
                     </div>
                  </div>
                  <h2 className="text-3xl font-display font-bold text-neutral-950 mb-2">{profile?.name || user.displayName}</h2>
                  <p className="text-neutral-400 font-sans text-sm mb-8">{user.email}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-4">
                     <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Status</span>
                        <span className="font-display font-bold text-neutral-900">
                          {profile?.role === 'student' ? 'Student' : (isAdmin ? 'Staff' : 'Aspirant')}
                        </span>
                     </div>
                     <div className="bg-neutral-50 rounded-2xl p-4 flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Badge</span>
                        <span className="font-display font-bold text-blue-600">
                          {isAdmin ? 'Master' : 'Premium'}
                        </span>
                     </div>
                  </div>
                  
                  {/* Admin actions removed from client-facing profile tab */}
               </div>

               <div className="mt-10 pt-10 border-t border-neutral-50 space-y-2">
                  {[
                    { id: 'orders', icon: <ListOrdered size={20} />, label: 'My Orders', badge: '0' },
                    { id: 'wishlist', icon: <Heart size={20} />, label: 'Wishlist', badge: wishlistItems.length.toString(), color: 'rose' },
                    { id: 'cart', icon: <BookOpen size={20} />, label: 'Basket', badge: totalItems.toString() },
                    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' }
                  ].map(item => (
                    <button 
                      key={item.id}
                      onClick={() => item.id === 'wishlist' ? navigate('/wishlist') : item.id === 'cart' ? navigate('/cart') : null}
                      className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-neutral-50 transition-all group"
                    >
                       <div className="flex items-center gap-4 text-neutral-500 group-hover:text-black transition-colors">
                          {item.icon}
                          <span className="font-display font-bold text-sm uppercase tracking-wider">{item.label}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          {item.badge && item.badge !== '0' && (
                            <span className={cn(
                               "px-2.5 py-0.5 rounded-lg text-[10px] font-black",
                               item.color === 'rose' ? "bg-rose-500 text-white" : "bg-neutral-950 text-white"
                            )}>
                               {item.badge}
                            </span>
                          )}
                          <ChevronRight size={14} className="text-neutral-200" />
                       </div>
                    </button>
                  ))}
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <LogOut size={20} />
                    <span className="font-display font-bold text-sm uppercase tracking-wider">Logout Session</span>
                  </button>
               </div>
            </div>

            <div className="bg-neutral-950 text-white rounded-[2.5rem] p-10 overflow-hidden relative border border-white/5">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/10 blur-3xl" />
                <Zap size={40} className="text-blue-500 mb-6" />
                <h3 className="text-2xl font-display font-bold mb-4">Study Sync Pro</h3>
                <p className="text-neutral-400 text-sm font-sans mb-8 leading-relaxed">Upgrade to unlock personalized syllabus tracking and 24/7 expert counseling priority.</p>
                <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-display font-bold hover:bg-blue-500 transition-all active:scale-95">
                   Upgrade Now
                </button>
            </div>
          </div>

          {/* Activity Content */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-10">
               <div className="w-12 h-12 bg-neutral-900 rounded-2xl flex items-center justify-center text-white">
                  <Clock size={24} />
               </div>
               <div>
                  <h2 className="text-4xl font-display font-bold text-neutral-950 tracking-tight leading-tight">Order Pipeline</h2>
                  <p className="text-neutral-400 font-sans text-xs uppercase font-black tracking-widest mt-1">Live Tracking History</p>
               </div>
            </div>

            <div className="space-y-6">
               {loadingOrders ? (
                  <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 flex items-center justify-center">
                    <p className="font-display font-bold text-xs uppercase tracking-widest text-neutral-400">Loading your pipeline history...</p>
                  </div>
               ) : orders.length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-12 border border-neutral-100 flex flex-col items-center text-center justify-center">
                     <div className="w-24 h-24 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-200 mb-8 border-2 border-dashed border-neutral-200">
                        <BookOpen size={40} />
                     </div>
                     <h3 className="text-2xl font-display font-bold text-neutral-950 mb-4 tracking-tight">No Active Prep Orders</h3>
                     <p className="text-neutral-500 font-sans max-w-sm mb-10 leading-relaxed">Your journey begins when you pick your first weapon. Our shop is optimized for your victory.</p>
                     <Link to="/categories" className="bg-neutral-950 text-white px-10 py-5 rounded-2xl font-display font-bold text-lg hover:bg-neutral-800 transition-all flex items-center gap-3 active:scale-95">
                        Start Browsing <ArrowRight size={20} />
                     </Link>
                  </div>
               ) : (
                  <div className="space-y-4">
                     {orders.map(order => (
                        <div key={order.id} className="bg-white rounded-[2rem] p-6 md:p-8 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4 mb-4">
                              <div>
                                 <p className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Order Reference</p>
                                 <p className="font-mono text-xs font-bold text-neutral-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                   order.status === 'delivered' ? "bg-green-100 text-green-700" :
                                   order.status === 'cancelled' ? "bg-rose-100 text-rose-700" :
                                   "bg-amber-100 text-amber-700"
                                 )}>
                                    {order.status}
                                 </span>
                                 <span className="text-[10px] text-neutral-400 font-bold">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                 </span>
                              </div>
                           </div>
                           
                           <div className="space-y-2 mb-4">
                              {order.items.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-xs text-neutral-700 font-sans font-bold">
                                    <div className="flex items-center gap-2">
                                       <span className="text-neutral-400">Qty: {item.quantity} ×</span>
                                       <span className="text-neutral-900 line-clamp-1">{item.title}</span>
                                    </div>
                                    <span className="text-neutral-900 font-black">₹{item.finalPrice * item.quantity}</span>
                                 </div>
                              ))}
                           </div>

                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-neutral-100">
                              <div className="text-[10px] font-bold text-neutral-500 uppercase font-mono">
                                 Transport: <span className="font-sans font-black text-neutral-800">Registered Indian Parcel</span>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                                 <div className="text-right">
                                    <p className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Invoice Value</p>
                                    <p className="text-sm font-display font-black text-neutral-950">₹{order.total}</p>
                                 </div>
                                 <button 
                                    onClick={() => setSelectedLabelOrder(order)}
                                    className="px-4 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
                                 >
                                    <Download size={12} /> Get Invoice
                                 </button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>

            {selectedLabelOrder && (
               <CourierLabelModal 
                  order={selectedLabelOrder} 
                  onClose={() => setSelectedLabelOrder(null)} 
               />
            )}

            <div className="mt-20">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="font-display font-bold text-2xl">Security Insights</h3>
                  <ShieldCheck className="text-blue-600" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-white border border-neutral-100 rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Member Since</p>
                     <p className="font-display font-bold text-neutral-900">May 2024</p>
                  </div>
                  <div className="p-6 bg-white border border-neutral-100 rounded-3xl">
                     <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-2">Login Method</p>
                     <p className="font-display font-bold text-neutral-900">
                       {user.providerData[0]?.providerId === 'password' ? 'Email & Password' : 'Google Authentication'}
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
