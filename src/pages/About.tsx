import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Users, 
  MapPin, 
  ArrowRight,
  ShieldCheck,
  Star as StarIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="min-h-screen bg-neutral-50 pt-20 overflow-hidden font-sans">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 mb-40">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center text-white">
              <BookOpen size={28} />
            </div>
            <h4 className="text-amber-600 font-display font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.4em]">Our Legacy</h4>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-display font-bold text-neutral-950 tracking-tight leading-[1.05] mb-12"
          >
            Building the Base <br />
            <span className="text-neutral-400 italic">for Future Officers.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-neutral-500 font-sans text-xl leading-relaxed max-w-2xl"
          >
            Sachin Dhawale's Maths & Reasoning Academy stands as Maharashtra's leading destination for students striving to conquer aptitude challenges in competitive exams.
          </motion.p>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="bg-neutral-950 text-white py-40 relative">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/5 blur-[150px] rounded-full -mr-40 -mt-40" />
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
             <div>
                <h4 className="text-amber-500 font-display font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.4em] mb-8">The Philosophy</h4>
              <h2 className="text-4xl md:text-6xl font-display font-bold mb-10 tracking-tight leading-tight">
                Concepts are King. <br />
                <span className="text-amber-500">Speed is Power.</span>
              </h2>
              <div className="space-y-6 text-neutral-400 font-sans text-lg leading-relaxed">
                 <p>In the high-stakes world of MPSC and UPSC CSAT, traditional methods often fall short of the ticking clock. Sachin Dhawale Academy transforms potential into prowess through structural logic.</p>
                 <p>From foundational arithmetic to advanced logical reasoning, we bridge the gap between "solving" and "winning" with exclusive shortcut techniques used by toppers.</p>
              </div>
                
                <div className="mt-12 flex flex-wrap gap-8">
                   <div className="flex flex-col">
                      <span className="text-5xl font-display font-bold text-white mb-1">10k+</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Rankers Produced</span>
                   </div>
                   <div className="h-16 w-px bg-white/10 hidden sm:block" />
                   <div className="flex flex-col">
                      <span className="text-5xl font-display font-bold text-white mb-1">14+</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Years Excellence</span>
                   </div>
                </div>
             </div>

             <div className="relative">
                <div className="absolute -inset-4 bg-amber-600 rounded-[3rem] blur-2xl opacity-10" />
                <div className="bg-white/5 border border-white/10 rounded-[4rem] p-4 backdrop-blur-3xl">
                   <div className="aspect-square bg-neutral-900 rounded-[3.5rem] p-12 flex flex-col justify-between group">
                      <div className="w-20 h-20 bg-amber-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-amber-500/20 group-hover:rotate-6 transition-all">
                         <Target size={40} />
                      </div>
                      <div>
                         <h3 className="text-3xl font-display font-bold mb-4">Precision is Policy.</h3>
                         <p className="text-neutral-500 font-sans leading-relaxed">Our curation isn't just about sales; it's about the probability of success. We track examination pattern shifts in real-time to adjust our shelf priority.</p>
                      </div>
                      <div className="pt-10 flex items-center gap-4 text-amber-500">
                         <div className="h-px flex-1 bg-white/10" />
                         <ShieldCheck size={24} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-40 max-w-7xl mx-auto px-4">
         <div className="flex items-end justify-between mb-20">
            <div>
              <h4 className="text-amber-600 font-display font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.3em] mb-3">Our Progress</h4>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-neutral-950 tracking-tight">Evolving Preparation</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { year: '2010', title: 'The Academy Launch', desc: 'Sachin Dhawale established the first offline batch in Pune for Maths & Reasoning.' },
               { year: '2018', title: 'Statewide Dominance', desc: 'Achieved the record for highest rank holders in Maharashtra MPSC/Combine exams.' },
               { year: '2024', title: 'Digital Education', desc: 'Transitioning to a full-stack digital platform for students across India.' }
             ].map((step, idx) => (
               <div key={idx} className="bg-white p-10 rounded-[3rem] border border-neutral-100 hover:shadow-2xl transition-all group">
                  <span className="text-5xl font-display font-black text-neutral-100 group-hover:text-amber-600 transition-colors mb-8 block">{step.year}</span>
                  <h3 className="text-2xl font-display font-bold text-neutral-950 mb-4">{step.title}</h3>
                  <p className="text-neutral-500 font-sans leading-relaxed">{step.desc}</p>
               </div>
             ))}
          </div>
      </section>

      {/* Team CTA */}
      <section className="pb-40 px-4">
         <div className="max-w-5xl mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden flex flex-col items-center shadow-xl shadow-amber-500/10">
            <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-8 leading-tight tracking-tight">
               Dedicated to your <br />
               <span className="text-blue-100 italic">preparatory excellence.</span>
            </h2>
            <Link to="/contact" className="bg-white text-black px-10 py-5 rounded-2xl font-display font-bold text-xl hover:bg-neutral-100 transition-all flex items-center gap-3 active:scale-95 shadow-2xl">
               Contact Our Hub <ArrowRight size={24} />
            </Link>
         </div>
      </section>
    </div>
  );
}
