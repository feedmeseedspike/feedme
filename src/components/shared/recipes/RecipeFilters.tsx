"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Flame, Leaf, Clock, MapPin, Sparkles } from "lucide-react";

const CATEGORIES = [
  { id: 'all', name: 'Original', icon: <Flame size={14} /> },
  { id: 'healthy', name: 'Plant Base', icon: <Leaf size={14} /> },
  { id: 'traditional', name: 'Lagos Best', icon: <MapPin size={14} /> },
  { id: 'quick', name: 'Under 15m', icon: <Clock size={14} /> },
];

export default function RecipeFilters() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex flex-col gap-6 w-full lg:w-auto">
      <div className="flex items-center justify-between gap-6">
         <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 scroll-smooth">
            {CATEGORIES.map((cat) => (
               <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`
                    relative flex items-center gap-2.5 px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap
                    ${activeTab === cat.id 
                      ? 'bg-[#1B6013] text-white shadow-xl shadow-[#1B6013]/20 ring-4 ring-[#1B6013]/5' 
                      : 'bg-white text-gray-400 border border-gray-100 hover:border-[#1B6013]/30 hover:text-[#1B6013] shadow-sm'}
                  `}
               >
                  <span className={`${activeTab === cat.id ? 'text-[#F0800F]' : 'text-gray-300'}`}>
                     {cat.icon}
                  </span>
                  {cat.name}
                  {activeTab === cat.id && (
                     <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                  )}
               </button>
            ))}
         </div>
         
         <div className="hidden md:block h-12 w-px bg-gray-100 mx-2" />

         <button className="hidden md:flex h-14 px-8 items-center gap-3 bg-white border border-gray-100 text-gray-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#1B6013] hover:text-[#1B6013] transition-all shadow-sm group">
            <Filter size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Filters
         </button>
      </div>

      {/* active filters bar */}
      <AnimatePresence>
        {activeTab !== 'all' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3"
          >
             <div className="flex items-center gap-2 px-4 py-2 bg-[#1B6013]/5 border border-[#1B6013]/10 rounded-full text-[10px] font-black text-[#1B6013] uppercase tracking-widest">
                <Sparkles size={12} className="text-[#1B6013]" />
                {CATEGORIES.find(c => c.id === activeTab)?.name}
                <button onClick={() => setActiveTab('all')} className="ml-1 p-1 hover:bg-[#1B6013]/10 rounded-full transition-colors">
                   <X size={12} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
