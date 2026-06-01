import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  GraduationCap, 
  Globe, 
  PenTool, 
  Layers, 
  Backpack,
  Search as SearchIcon
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { Category } from '../types';
import { cn } from '../lib/utils';

const ICON_MAP: Record<string, React.ReactNode> = {
  exam: <GraduationCap size={24} />,
  subject: <Layers size={24} />,
  special: <Backpack size={24} />,
  practice: <Search size={24} />,
  language: <Globe size={24} />
};

const COLOR_MAP: Record<string, string> = {
  exam: 'bg-rose-50 text-rose-600 border-rose-100',
  subject: 'bg-amber-50 text-amber-600 border-amber-100',
  special: 'bg-slate-50 text-slate-600 border-slate-100',
  practice: 'bg-green-50 text-green-600 border-green-100',
  language: 'bg-indigo-50 text-amber-550 border-indigo-100'
};

export default function AllCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    storeService.getCategories().then(data => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const grouped = filteredCategories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pt-20 pb-24">
      <div className="max-w-[1850px] mx-auto px-4 md:px-12">
        <div className="flex flex-col items-center text-center mb-20 max-w-3xl mx-auto">
          <h4 className="text-amber-600 font-display font-black text-xs uppercase tracking-[0.15em] sm:tracking-[0.4em] mb-6">Subject Directories</h4>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-neutral-950 tracking-tight leading-tight mb-8">
            Complete Prep <br />
            <span className="text-neutral-400 italic">Ecosystem.</span>
          </h1>
          <p className="text-neutral-500 font-sans text-lg reading-relaxed mb-10">
            Navigate through our specialized subject hubs mapped directly to the official 2024 Maharashtra administrative syllabi. Select your center to begin.
          </p>
          
          <div className="w-full relative group">
             <div className="absolute inset-0 bg-amber-500/10 blur-[50px] rounded-full group-focus-within:bg-amber-500/20 transition-all" />
             <div className="relative flex items-center">
                <SearchIcon className="absolute left-6 text-neutral-400" size={24} />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search specific exam pathway..." 
                  className="w-full bg-white border border-neutral-100 rounded-3xl py-6 pl-16 pr-8 font-display font-bold text-xl shadow-2xl shadow-neutral-900/5 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-600 outline-none transition-all"
                />
             </div>
          </div>
        </div>

        <div className="space-y-40">
          {(Object.entries(grouped) as [string, Category[]][]).map(([type, cats]) => (
            <section key={type}>
              <div className="flex items-center gap-6 mb-12">
                 <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border-2", COLOR_MAP[type] || 'bg-neutral-50 text-neutral-400')}>
                    {ICON_MAP[type] || < Layers />}
                 </div>
                 <div>
                    <h2 className="text-4xl font-display font-bold text-neutral-950 capitalize tracking-tight">{type} Pathways</h2>
                    <p className="text-neutral-400 font-sans text-xs sm:text-sm font-medium uppercase tracking-[0.08em] sm:tracking-[0.2em] pt-1">Targeted Preparation Modules</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {cats.map(cat => (
                  <Link 
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group bg-white rounded-[2.5rem] p-10 border border-neutral-100 hover:bg-neutral-950 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-neutral-900/10 flex flex-col justify-between min-h-[300px]"
                  >
                    <div>
                        <div className="w-16 h-16 bg-neutral-50 rounded-[1.5rem] flex items-center justify-center text-3xl mb-8 group-hover:bg-white/10 transition-colors">
                          {cat.icon || '📚'}
                        </div>
                        <h3 className="text-3xl font-display font-bold text-neutral-950 group-hover:text-white transition-colors mb-4 leading-tight">
                          {cat.name}
                        </h3>
                        <p className="text-neutral-400 font-sans group-hover:text-neutral-500 transition-colors line-clamp-2">
                          {cat.description || `Specialized resources and reference materials for ${cat.name} aspirants.`}
                        </p>
                    </div>
                    <div className="flex items-center justify-between mt-8">
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.25em] text-amber-600">Enter Hub</span>
                       <div className="w-10 h-10 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-300 group-hover:bg-amber-600 group-hover:border-amber-600 group-hover:text-white transition-all">
                          <ArrowRight size={20} />
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
