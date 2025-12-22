'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface LoadingViewProps {
  ui: {
    engine: {
      loading_steps?: string[];
      processing_label: string;
    };
  };
}

/**
 * Loading view shown during analysis processing
 */
export const LoadingView = ({ ui }: LoadingViewProps) => {
  const steps = ui.engine.loading_steps || [
    "Initializing Neural Core",
    "Parsing Behavioral Patterns",
    "Detecting Subconscious Signals",
    "Constructing Holographic Profile",
    "Finalizing Analysis"
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden z-20">
       {/* Background Effects */}
       <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />

       {/* Central Orb */}
       <div className="relative z-10 flex flex-col items-center text-center">
         <div className="relative mb-12">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
             className="w-32 h-32 rounded-full border border-gray-200 border-t-gray-900 border-l-gray-900"
           />
           <motion.div
             animate={{ rotate: -360 }}
             transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
             className="absolute inset-2 rounded-full border border-gray-200 border-b-indigo-500 border-r-indigo-500"
           />
           <div className="absolute inset-0 flex items-center justify-center">
             <Brain className="text-gray-900 opacity-80" size={48} />
           </div>
         </div>

         {/* Text Progress */}
         <div className="h-16 flex flex-col items-center justify-center">
             <AnimatePresence mode='wait'>
                <motion.h2 
                   key={index}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="text-2xl font-light text-gray-900 tracking-tight font-serif"
                >
                  {steps[index]}...
                </motion.h2>
             </AnimatePresence>
             <p className="text-xs text-gray-400 mt-2 uppercase tracking-[0.2em] animate-pulse">
                {ui.engine.processing_label}
             </p>
         </div>
       </div>
    </div>
  );
};
