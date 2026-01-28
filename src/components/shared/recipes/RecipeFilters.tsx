"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, Flame, Leaf, Clock, MapPin } from "lucide-react";

const CATEGORIES = [
  { id: 'all', name: 'Original', icon: <Flame size={14} /> },
  { id: 'healthy', name: 'Plant Base', icon: <Leaf size={14} /> },
  { id: 'traditional', name: 'Lagos Best', icon: <MapPin size={14} /> },
  { id: 'quick', name: 'Under 15m', icon: <Clock size={14} /> },
];

export default function RecipeFilters() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
            {CATEGORIES.map((cat) => (
               <button
                  key={cat.id}
                  onClick={() => setActiveTab(cat.id)}
                  className={`
                    relative flex items-center gap-2.5 px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all whitespace-nowrap
                    ${activeTab === cat.id 
                      ? 'bg-[#1B6013] text-white shadow-[0_20px_40px_-10px_rgba(27,96,19,0.4)] ring-4 ring-[#1B6013]/10 scale-105' 
                      : 'bg-[#1B6013]/5 text-[#1B6013]/50 border border-transparent hover:bg-[#1B6013]/10 hover:text-[#1B6013]'}
                  `}
               >
                  <span className={`${activeTab === cat.id ? 'text-[#D9FF00]' : 'text-gray-300'}`}>
                     {cat.icon}
                  </span>
                  {cat.name}
                  {activeTab === cat.id && (
                     <motion.div 
                        layoutId="active-pill"
                        className="absolute inset-0 rounded-2xl ring-2 ring-[#1B6013] ring-offset-2 ring-offset-white"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                     />
                  )}
               </button>
            ))}
         </div>
         
         <button className="hidden md:flex h-12 px-8 items-center gap-3 bg-[#1B6013]/5 text-[#1B6013] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1B6013]/10 transition-all">
            <Filter size={14} /> More filters
         </button>
      </div>

      {/* active filters bar */}
      <AnimatePresence>
        {activeTab !== 'all' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 pt-2"
          >
             <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Showing: {CATEGORIES.find(c => c.id === activeTab)?.name}
                <button onClick={() => setActiveTab('all')} className="hover:text-red-500 transition-colors">
                   <X size={12} />
                </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
