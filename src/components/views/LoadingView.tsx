'use client';

import React, { useState, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

interface LoadingViewProps {
  ui: {
    engine: {
      loading_steps?: string[];
      processing_label: string;
      thinking_logs?: string[];
      est_time?: string;
      wait_longer?: string;
      submission_warning?: string;
    };
  };
  mode?: string | null;
}

// 1. Optimized Background Ripples (Memoized to prevent re-renders)
const BackgroundRipples = memo(() => {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: [0.5, 3], 
            opacity: [0, 0.15, 0] 
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            delay: i * 2.6,
            ease: "easeOut" 
          }}
          style={{ willChange: 'transform, opacity' }}
          className="absolute w-[500px] h-[500px] rounded-full border-2 border-indigo-400/10 transform-gpu"
        />
      ))}
    </div>
  );
});
BackgroundRipples.displayName = 'BackgroundRipples';

// 2. Neural Core (Enhanced with multiple rings and stabilized icons)
const NeuralCore = memo(({ mode }: { mode?: string | null }) => {
  const maxSeconds = useMemo(() => {
    if (mode === 'lite') return 60;
    if (mode === 'standard') return 180;
    if (mode === 'full') return 300;
    return 180;
  }, [mode]);

  return (
    <div className="relative mb-10 scale-75 md:scale-100 py-10 flex flex-col items-center">
      <div className="relative w-44 h-44 flex items-center justify-center">
        {/* Outer Thin Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border border-slate-200/40 transform-gpu"
        />
        
        {/* Middle Thin Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border-[0.5px] border-indigo-200/30 transform-gpu"
        />

        {/* Inner Thick Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-8 rounded-full border-[3px] border-slate-100 border-t-indigo-500/20 border-l-indigo-500/20 transform-gpu shadow-[0_0_15px_rgba(99,102,241,0.05)]"
        />

        {/* Pulsing Brain Icon with stabilized stacking */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{ 
               scale: [0.98, 1.02, 0.98],
               opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            className="transform-gpu"
          >
            <Brain className="text-slate-800 drop-shadow-sm" size={56} strokeWidth={1} />
          </motion.div>
        </div>
      </div>

      {/* Slow Progress Bar under brain */}
      <div className="mt-8 w-32 h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200/30 relative">
        <motion.div 
          className="h-full bg-indigo-400 opacity-60"
          initial={{ width: "0%" }}
          animate={{ width: "95%" }}
          transition={{ duration: maxSeconds, ease: "linear" }}
        />
      </div>
    </div>
  );
});
NeuralCore.displayName = 'NeuralCore';

// 3. Step Rotator (Smoother transitions with subtle blur & gentle offsets)
const StepRotator = ({ steps }: { steps: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="h-40 md:h-20 flex items-center justify-center overflow-hidden relative w-full">
      <AnimatePresence initial={false}>
         <motion.h2 
            key={index}
            initial={{ opacity: 0, y: 5, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -5, filter: 'blur(4px)', position: 'absolute' }}
            transition={{ 
              duration: 0.8, 
              ease: [0.4, 0, 0.2, 1] // Smoother cubic-bezier
            }}
            className="text-2xl md:text-3xl lg:text-4xl font-thin text-slate-900 tracking-tight font-serif mb-2 px-10 text-center w-full transform-gpu"
         >
           {steps[index]}
         </motion.h2>
      </AnimatePresence>
    </div>
  );
};

// 4. Progress Stats (Isolates elapsed state)
const ProgressStats = ({ ui, mode }: { ui: any, mode?: string | null }) => {
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const estTime = useMemo(() => {
    if (mode === 'lite') return "30s - 1min";
    if (mode === 'standard') return "1min - 3min";
    if (mode === 'full') return "3min - 5min";
    return "1min - 3min";
  }, [mode]);

  const fakeProgress = useMemo(() => {
    if (elapsed < 90) return 0;
    if (elapsed >= 240) return 100;
    return Math.min(99, Math.floor(56 + (elapsed - 90) * (44 / 150)));
  }, [elapsed]);

  return (
    <div className="space-y-4 w-full px-4">
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-[10px] text-slate-400 uppercase tracking-[0.4em] font-bold"
      >
         {ui?.engine?.processing_label || "Processing..."}
      </motion.p>
      
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[10px] text-slate-400 font-medium">
          {ui?.engine?.est_time || "Est. Analysis Time"}: <span className="text-indigo-500 font-bold">{estTime}</span>
        </span>
        <p className="text-[9px] text-rose-400/60 font-medium tracking-wide">
          {ui?.engine?.submission_warning || "Please do not close this window."}
        </p>
      </div>

      <AnimatePresence>
        {elapsed >= 90 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-[240px] mx-auto pt-6"
          >
            <div className="flex justify-between items-end mb-2 px-1">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                {ui?.engine?.wait_longer || "Deep Search Active"}
              </span>
              <span className="text-[10px] font-number font-bold text-indigo-500">{fakeProgress}%</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/30">
              <motion.div 
                className="h-full bg-indigo-500 transform-gpu"
                initial={{ width: '56%' }}
                animate={{ width: `${fakeProgress}%` }}
                transition={{ duration: 1.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 5. Neural Stream Logs (Isolates logs state)
const NeuralStreamLogs = memo(({ thinkingPool }: { thinkingPool: string[] }) => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextLog = thinkingPool[Math.floor(Math.random() * thinkingPool.length)];
      setLogs(prev => {
        const newLogs = [...prev, nextLog];
        return newLogs.length > 2 ? newLogs.slice(newLogs.length - 2) : newLogs;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [thinkingPool]);

  return (
    <div className="absolute bottom-10 left-0 w-full px-8 flex justify-center pointer-events-none">
      <div className="max-w-md w-full text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-1">
           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Neural Stream</span>
        </div>
        
        <div className="h-10 overflow-hidden flex flex-col items-center">
          <AnimatePresence mode='popLayout'>
            {logs.map((log, i) => (
              <motion.div
                key={log + i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: i === logs.length - 1 ? 0.35 : 0.15, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5 }}
                className="text-[10px] font-mono text-slate-500 whitespace-nowrap transform-gpu"
              >
                {`>> ${log}`}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});
NeuralStreamLogs.displayName = 'NeuralStreamLogs';

/**
 * Optimized Loading View
 */
export const LoadingView = ({ ui, mode }: LoadingViewProps) => {
  const steps = useMemo(() => ui?.engine?.loading_steps || [
    "Initializing Neural Core",
    "Parsing Behavioral Patterns",
    "Detecting Subconscious Signals",
    "Constructing Holographic Profile",
    "Finalizing Analysis"
  ], [ui?.engine?.loading_steps]);

  const thinkingPool = useMemo(() => ui?.engine?.thinking_logs || [
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
  ], [ui?.engine?.thinking_logs]);


  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden z-20 bg-slate-50 selection:none font-sans">
       <BackgroundRipples />

       <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-lg">
          <NeuralCore mode={mode} />

          <div className="flex flex-col items-center justify-center w-full">
              <StepRotator steps={steps} />
              <ProgressStats ui={ui} mode={mode} />
          </div>
       </div>

       <NeuralStreamLogs thinkingPool={thinkingPool} />
    </div>
  );
};
