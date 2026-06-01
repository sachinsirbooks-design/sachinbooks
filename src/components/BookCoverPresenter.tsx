import React from 'react';

interface BookCoverProps {
  bookId: string;
  className?: string;
}

export default function BookCoverPresenter({ bookId, className = 'w-full h-full' }: BookCoverProps) {
  // Switch styling based on bookId
  switch (bookId) {
    case 'rayat-darpan':
      return (
        <div className={`relative ${className} bg-gradient-to-br from-emerald-900 via-teal-950 to-neutral-900 text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-emerald-800`}>
          {/* Top header strip */}
          <div className="flex justify-between items-center border-b border-white/20 pb-1.5">
            <span className="text-[7px] font-black tracking-widest text-emerald-400 uppercase">RAYAT PRABODHINI</span>
            <span className="text-[7px] font-bold px-1 py-0.5 bg-emerald-500 text-neutral-950 rounded bg-emerald-500">2025-26</span>
          </div>

          {/* Center Title layout */}
          <div className="my-auto flex flex-col items-center text-center py-2">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-400/40 flex items-center justify-center mb-2.5">
              <span className="text-[20px] font-bold text-emerald-300 font-serif">र</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight text-amber-300 leading-tight">रयत दर्पण</h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-white/80 mt-1">CURRENT AFFAIRS</p>
            <div className="h-[2px] w-8 bg-emerald-400/50 my-1.5" />
            <p className="text-[8px] font-medium text-emerald-200">MPSC & UPSC COMBINE SPECIAL</p>
          </div>

          {/* Bottom attribution */}
          <div className="border-t border-white/15 pt-2 text-center">
            <p className="text-[8px] font-black text-amber-200">संकलन: रयत प्रबोधिनी, पुणे</p>
            <p className="text-[6px] text-zinc-400 font-mono mt-0.5">HIGHLY RECOMMENDED STUDY NOTES</p>
          </div>
        </div>
      );

    case 'vocab-sanjeevani':
      return (
        <div className={`relative ${className} bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-purple-800`}>
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/10 pb-1">
            <span className="text-[7px] font-black tracking-widest text-purple-400 uppercase">VOCAB COMPANION</span>
            <span className="text-[6px] px-1 bg-yellow-400 text-black font-extrabold rounded">100% SUCCESS</span>
          </div>

          {/* Core branding */}
          <div className="my-auto flex flex-col items-center text-center">
            <div className="inline-block px-2.5 py-0.5 bg-purple-500/10 text-purple-400 rounded-full text-[8px] font-black tracking-widest uppercase mb-1">
              English - Marathi
            </div>
            <h3 className="text-2xl font-black text-yellow-400 leading-none tracking-tight">VOCAB</h3>
            <h4 className="text-xl font-extrabold text-white tracking-widest leading-none mt-1">संजीवनी</h4>
            <span className="text-[8px] text-zinc-300 font-medium italic mt-2">Shortcuts & Mindmaps</span>
            <div className="mt-2 text-[7px] text-purple-300 font-mono bg-purple-900/20 px-2 py-0.5 border border-purple-800/30 rounded-md">
              🎯 TCS & IBPS Pattern Fully Solved
            </div>
          </div>

          {/* Footer details */}
          <div className="border-t border-white/5 pt-1.5 text-center">
            <p className="text-[9px] font-bold text-white leading-none">By Vishal Savai Sir</p>
            <p className="text-[6px] font-semibold text-zinc-400 mt-1">Gayatri Publications</p>
          </div>
        </div>
      );

    case 'zero-error-english':
      return (
        <div className={`relative ${className} bg-gradient-to-br from-amber-600 via-orange-600 to-rose-700 text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-amber-500/50`}>
          {/* Header */}
          <div className="flex justify-between items-center">
            <span className="text-[6px] font-mono text-amber-200">LATEST COCHING SERIES</span>
            <span className="text-[6px] font-bold px-1 bg-white text-rose-700 rounded shadow-sm">6TH REVISED</span>
          </div>

          {/* Title Area */}
          <div className="my-auto flex flex-col text-left py-2 space-y-1.5">
            <div className="bg-neutral-900/40 p-1.5 rounded-lg border border-white/10 uppercase">
              <span className="text-[8px] font-black tracking-widest text-amber-300 block">ZERO ERROR</span>
              <h3 className="text-lg font-black text-white tracking-tight leading-none mt-0.5">ENGLISH</h3>
              <p className="text-[7px] text-zinc-300 font-mono leading-none mt-0.5">GRAMMAR & ANALYSIS</p>
            </div>
            
            <div className="space-y-0.5 text-[8px]">
              <p className="text-white/90 font-bold">📚 1984 Till 2025 Vishleshan</p>
              <p className="text-amber-200 font-medium">🎯 High Score Formula Included</p>
            </div>
          </div>

          {/* Stamp/Footer */}
          <div className="border-t border-white/20 pt-2 flex items-center justify-between gap-1">
            <div className="text-left">
              <span className="text-[8px] font-bold block text-white/90">Mahesh Patil</span>
              <span className="text-[6px] text-amber-200">Lokseva Publications</span>
            </div>
            <div className="w-6 h-6 rounded-full border border-white/30 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-black text-white">MPSC</span>
            </div>
          </div>
        </div>
      );

    case 'maharashtra-bhugol':
      return (
        <div className={`relative ${className} bg-gradient-to-br from-teal-900 via-emerald-950 to-stone-900 text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-teal-800`}>
          {/* Top marker */}
          <div className="text-center">
            <span className="text-[7px] font-bold bg-teal-500/20 text-teal-300 border border-teal-700/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Lokseva Academy Pune
            </span>
          </div>

          {/* Title */}
          <div className="my-auto flex flex-col items-center text-center">
            <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase">CLASS NOTES</span>
            <div className="h-0.5 w-6 bg-teal-400 my-1" />
            <h3 className="text-lg font-black tracking-tight text-white leading-tight">महाराष्ट्राचा भूगोल</h3>
            <p className="text-[7px] mt-1 text-teal-200 font-mono">COMPLETE COLOR MAPPED ATLAS</p>
          </div>

          {/* Footer and credentials */}
          <div className="border-t border-white/15 pt-2 text-center space-y-0.5">
            <p className="text-[9px] font-bold text-amber-300">लेखक: अप्पा हातनुरे सर</p>
            <p className="text-[6px] text-teal-300 uppercase font-black">MPSC state exam specialist</p>
          </div>
        </div>
      );

    case 'rajyaghatana-notes':
      return (
        <div className={`relative ${className} bg-gradient-to-br from-rose-950 via-red-950 to-neutral-900 text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-rose-800`}>
          {/* Header info */}
          <div className="flex justify-between items-center">
            <span className="text-[6px] font-black tracking-widest text-rose-400 uppercase">LOKSEVA SERIES</span>
            <span className="text-[6px] bg-yellow-500 text-neutral-950 px-1 rounded font-bold">TOP RATED</span>
          </div>

          {/* Indian Civic / Parliament layout */}
          <div className="my-auto text-center py-2 flex flex-col items-center">
            <div className="w-12 h-6 border-b-2 border-amber-500/40 relative flex items-center justify-center mb-2">
              {/* Styled tiny icon to resemble parliament dome */}
              <div className="w-4 h-4 rounded-t-full bg-rose-500/30 border border-rose-400" />
            </div>
            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">CLASS NOTES</span>
            <h3 className="text-xl font-black tracking-tight text-white leading-tight mt-0.5">भारतीय राज्यघटना</h3>
            <p className="text-[7px] font-semibold text-rose-300 mt-1">CONSTITUTION OF INDIA GUIDE</p>
          </div>

          {/* Author info */}
          <div className="border-t border-white/10 pt-2 text-center">
            <p className="text-[9px] font-bold text-white">मार्गदर्शक: अप्पा हातनुरे सर</p>
            <p className="text-[6px] text-zinc-400 font-mono mt-0.5">LOKSEVA ACADEMY PUNE</p>
          </div>
        </div>
      );

    default:
      // Return beautiful default academic design if no exact match
      return (
        <div className={`relative ${className} bg-gradient-to-br from-neutral-800 via-neutral-900 to-black text-white flex flex-col justify-between p-4 font-sans select-none border-4 border-neutral-700`}>
          <div className="border-b border-white/10 pb-1">
            <span className="text-[8px] font-bold tracking-widest text-neutral-400">ACADEMIC SERVING</span>
          </div>
          <div className="my-auto text-center">
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-3">
              {bookId.replace(/-/g, ' ').toUpperCase()}
            </h3>
          </div>
          <div className="border-t border-white/10 pt-1 text-center">
            <span className="text-[8px] text-zinc-500">Deccan Academy Publishing</span>
          </div>
        </div>
      );
  }
}
