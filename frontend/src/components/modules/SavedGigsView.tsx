import React from 'react';
import { Bookmark, DollarSign } from 'lucide-react';

export const SavedGigsView: React.FC<{ gigs: any[] }> = ({ gigs }) => {
  return (
    <div className="space-y-6 text-[#222325]">
      <div className="flex items-center justify-between bg-white p-5 rounded-lg border border-[#dadbdd] shadow-sm">
        <div>
          <h3 className="text-xl font-bold text-[#222325] flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#1dbf73]" />
            Your Saved Gigs & Library ({gigs.length})
          </h3>
          <p className="text-xs text-[#74767e] mt-0.5">
            All your synthesized gigs stored in your workspace database for instant copying and reference.
          </p>
        </div>
      </div>

      {gigs.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-[#dadbdd] text-center shadow-sm">
          <Bookmark className="w-8 h-8 text-[#b5b6ba] mx-auto mb-2" />
          <p className="text-sm font-semibold text-[#404145]">No gigs saved yet.</p>
          <p className="text-xs text-[#74767e] mt-1">Use the Gig Generator tab to generate and save your first optimized gig!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gigs.map((g, idx) => (
            <div key={g.id || idx} className="bg-white p-5 rounded-lg border border-[#dadbdd] space-y-4 hover:border-[#1dbf73] transition-all shadow-sm">
              <div>
                <span className="text-[10px] font-bold text-[#1dbf73] uppercase tracking-wider">
                  {g.category} &gt; {g.sub_category}
                </span>
                <h4 className="text-base font-bold text-[#222325] mt-1 line-clamp-2">
                  {g.title}
                </h4>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {g.search_tags?.map((t: string, ti: number) => (
                  <span key={ti} className="fiverr-pill px-2.5 py-0.5 rounded-full bg-[#f5f5f5] text-[#404145] text-xs font-medium border border-[#dadbdd]">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="pt-3 border-t border-[#efeff0] flex items-center justify-between text-xs text-[#74767e]">
                <span className="flex items-center gap-1 font-bold text-[#1dbf73]">
                  <DollarSign className="w-3.5 h-3.5" /> Basic: ${g.packages?.basic?.price_usd}
                </span>
                <span className="text-[11px] text-[#74767e]">
                  {new Date(g.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
