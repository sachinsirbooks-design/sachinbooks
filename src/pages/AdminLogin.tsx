import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail,
  BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginWithGoogle, isAdmin, user } = useAuth();
  const navigate = useNavigate();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithGoogle();
      // AuthContext handles profile fetching
      // we check for isAdmin in useEffect or right after
    } catch (err) {
      toast.error('Authentication failed');
    }
  };

  React.useEffect(() => {
    if (user && isAdmin) {
      navigate('/admin');
    } else if (user && !isAdmin) {
      toast.error('Unauthorized access. Administrator credentials required.');
    }
  }, [user, isAdmin, navigate]);

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full -ml-40 -mt-40" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full -mr-40 -mb-40" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-amber-600 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-amber-500/20 rotate-3 font-black text-4xl">
             SD
          </div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight leading-tight mb-4">
             Academy <span className="text-amber-500 italic font-medium">Portal.</span>
          </h1>
          <h2 className="text-neutral-500 font-sans text-[10px] font-black uppercase tracking-[0.4em]">Administrative Access Only</h2>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-12 shadow-inner">
           <div className="space-y-8">
              <div className="bg-neutral-900 border border-white/5 p-6 rounded-2xl flex items-start gap-4">
                 <ShieldCheck className="text-amber-500 shrink-0 mt-1" size={24} />
                 <div className="space-y-2">
                   <p className="text-xs text-white font-display font-bold uppercase tracking-widest">Master Identity Check</p>
                   <p className="text-[10px] text-neutral-400 font-sans leading-relaxed tracking-wider uppercase">
                     The system will verify your email against the administrative roster. Please use your registered Google Workspace account to proceed.
                   </p>
                 </div>
              </div>

              <button 
                onClick={handleAdminLogin}
                className="w-full py-6 bg-amber-600 text-white rounded-2xl font-display font-black text-xl hover:bg-amber-500 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-amber-500/10"
              >
                Sign In with Google <ArrowRight size={24} />
              </button>
           </div>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="mt-12 text-[10px] font-black text-neutral-600 uppercase tracking-[0.4em] block w-full text-center hover:text-white transition-colors"
        >
          ← Return to Student Platform
        </button>
      </div>
    </div>
  );
}
