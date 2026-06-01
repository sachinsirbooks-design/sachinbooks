import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-40">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center">
                <MessageCircle size={24} />
              </div>
              <h4 className="text-blue-600 font-display font-black text-xs uppercase tracking-[0.4em]">Get in Touch</h4>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold text-neutral-950 tracking-tight leading-[1.1] mb-10">
              Personalized <br />
              <span className="text-neutral-400 italic">Guidance.</span>
            </h1>
            
            <p className="text-neutral-500 font-sans text-xl leading-relaxed mb-12 max-w-lg">
              Whether you need course clarification or specific doubt solving, our academy staff is ready to help you optimize your study hours.
            </p>

            <div className="space-y-4">
              {[
                { icon: <Phone size={20} />, label: 'Main Support', val: '+91 9850578039' },
                { icon: <Mail size={20} />, label: 'Email Inquiries', val: 'Shermale4009@gmail.com' },
                { icon: <Clock size={20} />, label: 'Operational Hours', val: 'Mon - Sat: 10AM - 9PM' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-neutral-100 hover:shadow-xl hover:translate-x-2 transition-all">
                  <div className="w-12 h-12 bg-neutral-50 rounded-xl flex items-center justify-center text-neutral-400">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-0.5">{item.label}</p>
                    <p className="font-display font-bold text-neutral-900 text-lg">{item.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
             <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full" />
             <div className="relative bg-white rounded-[3rem] p-10 md:p-16 border border-neutral-100 shadow-2xl shadow-neutral-900/5">
                <h3 className="text-3xl font-display font-bold text-neutral-950 mb-8">Send a Message</h3>
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Name</label>
                        <input className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-medium focus:ring-2 focus:ring-blue-500/20" placeholder="Sachin Kumar" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Phone</label>
                        <input className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-medium focus:ring-2 focus:ring-blue-500/20" placeholder="+91 99999 88888" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Interested Subject</label>
                      <select className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-medium focus:ring-2 focus:ring-blue-500/20 appearance-none">
                         <option>Maths & Reasoning</option>
                         <option>UPSC CSAT</option>
                         <option>MPSC Combine</option>
                         <option>Banking Aptitude</option>
                         <option>General Support</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-2">Your Inquiry</label>
                      <textarea rows={4} className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 font-sans font-medium focus:ring-2 focus:ring-blue-500/20 resize-none" placeholder="How can we help you today?" />
                   </div>
                   <button className="w-full py-5 bg-neutral-950 text-white rounded-2xl font-display font-bold text-lg hover:bg-neutral-800 transition-all flex items-center justify-center gap-3">
                      Send to Academy Staff <ArrowRight size={20} />
                   </button>
                </form>
             </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <section className="mb-24">
           <div className="bg-neutral-900 rounded-[3rem] p-12 md:p-20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
              <div className="relative z-10 max-w-md">
                 <div className="flex items-center gap-4 text-blue-500 mb-8">
                    <MapPin size={40} />
                    <div className="h-px w-20 bg-blue-500/30" />
                 </div>
                 <h2 className="text-4xl font-display font-bold text-white mb-6 tracking-tight">Visit the Academy.</h2>
                 <p className="text-neutral-400 font-sans mb-10 leading-relaxed">Located in the heart of Pune at Sadashiv Peth, Sachin Dhawale Academy has been the physical lighthouse for state-service aspirants since 2010.</p>
                 <a 
                  href="https://maps.google.com/?q=Sachin+Dhawale+Academy+Pune" 
                  target="_blank" 
                  rel="noopener"
                  className="bg-white text-black px-10 py-5 rounded-2xl font-display font-bold hover:bg-neutral-200 transition-all text-lg inline-block"
                >
                  Open in Google Maps
                </a>
              </div>
              <div className="relative z-10 w-full md:w-1/2 aspect-video bg-neutral-800 rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-700">
                 {/* Map Placeholder Image */}
                 <div className="w-full h-full flex items-center justify-center text-neutral-600 font-display font-black text-xl italic tracking-widest text-center px-10">
                    SADASHIV PETH, PUNE <br/> THE HUB OF EXCELLENCE
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
