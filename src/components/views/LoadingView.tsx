'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface LoadingViewProps {
  ui: {
    engine: {
      loading_steps?: string[];
      processing_label: string;
      thinking_logs?: string[];
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
  
  const thinkingPool = useMemo(() => ui.engine.thinking_logs || [
    "Correlating behavioral nodes...",
    "Synchronizing semantic vectors...",
    "Filtering noise from subconscious stream...",
    "Validating cognitive consistency...",
    "Reconstructing identity archetype...",
    "Mapping attachment style vectors...",
    "Optimizing clinical diagnostic weights...",
    "Processing latent personality traits...",
    "Building holographic projection...",
    "Finalizing neural synthesis..."
  ], [ui.engine.thinking_logs]);

  const [index, setIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  // Infinite looping for the main step text
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [steps.length]);

  // Rolling AI Thinking Logs
  useEffect(() => {
    const interval = setInterval(() => {
      const nextLog = thinkingPool[Math.floor(Math.random() * thinkingPool.length)];
      setLogs(prev => {
        const newLogs = [...prev, nextLog];
        if (newLogs.length > 2) return newLogs.slice(newLogs.length - 2);
        return newLogs;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [thinkingPool]);

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden z-20 bg-slate-50">
       {/* Background Ripple Effects */}
       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ 
                scale: [0.5, 3], 
                opacity: [0, 0.15, 0] 
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                delay: i * 2,
                ease: "easeOut" 
              }}
              className="absolute w-[500px] h-[500px] rounded-full border border-indigo-400/30 shadow-[0_0_100px_rgba(99,102,241,0.1)]"
            />
          ))}
       </div>

       {/* Central Content */}
       <div className="relative z-10 flex flex-col items-center text-center px-6">
          <div className="relative mb-14">
            {/* Spinning Rings */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="w-36 h-36 rounded-full border-2 border-slate-100 border-t-indigo-500/40 border-l-indigo-500/40"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 rounded-full border border-slate-100 border-b-purple-500/30 border-r-purple-500/30"
            />
            
            {/* Pulsing Brain Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.6, 0.9, 0.6]
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <Brain className="text-slate-900" size={56} strokeWidth={1.2} />
              </motion.div>
            </div>
          </div>

          {/* Text Progress */}
          <div className="h-24 flex flex-col items-center justify-center">
              <AnimatePresence mode='wait'>
                 <motion.h2 
                    key={index}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
                    transition={{ duration: 0.8 }}
                    className="text-3xl md:text-4xl font-thin text-slate-900 tracking-tight font-serif"
                 >
                   {steps[index]}
                 </motion.h2>
              </AnimatePresence>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-slate-400 mt-6 uppercase tracking-[0.4em] font-bold"
              >
                 {ui.engine.processing_label}
              </motion.p>
          </div>
       </div>

       {/* Bottom AI Thinking Logs */}
       <div className="absolute bottom-12 left-0 w-full px-8 flex justify-center pointer-events-none">
          <div className="max-w-md w-full text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-3">
               <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Neural Stream</span>
            </div>
            
            <div className="h-10 overflow-hidden flex flex-col items-center">
              <AnimatePresence mode='popLayout'>
                {logs.map((log, i) => (
                  <motion.div
                    key={log + i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: i === logs.length - 1 ? 0.4 : 0.2, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[11px] font-mono text-slate-500 whitespace-nowrap"
                  >
                    {`>> ${log}`}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
       </div>
    </div>
  );
};
