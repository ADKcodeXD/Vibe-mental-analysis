'use client';

import React, { useState, useEffect, useMemo, memo, useRef } from 'react';
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
  streamingStatus?: string;
  streamingLog?: string;
  lang?: string;
}

const PHASE_STEPS: Record<string, Record<string, string[]>> = {
  analysis: {
    zh: ["正在初始化链接", "正在思考人格信息", "正在分析内在矛盾", "正在侧写人格画像"],
    en: ["Initializing secure link...", "Thinking about personality...", "Analyzing internal conflicts...", "Profiling persona..."],
    ja: ["接続を初期化中...", "人格情報を思考中...", "内在的矛盾を分析中...", "人格画像をプロファイリング中..."]
  },
  synthesis: {
    zh: ["正在评估分数", "正在生成报告", "正在合成人格信息"],
    en: ["Evaluating psycho-metrics...", "Generating final report...", "Synthesizing identity data..."],
    ja: ["スコアを評価中...", "レポートを生成中...", "人格情報を合成中..."]
  }
};

const LogContainer = ({ text }: { text?: string }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="relative flex items-end justify-center w-full h-10 px-8">
      {/* Fixed Prefix */}
      <span className="absolute left-10 md:left-12 bottom-[4px] text-emerald-400/40 font-bold text-[10px] md:text-xs font-mono z-20">
        {">>>"}
      </span>
      
      {/* Scrolling Content with Fade Mask */}
      <div 
        ref={scrollRef}
        className="w-full h-full overflow-hidden text-[10px] md:text-xs font-mono text-slate-300 text-left leading-5 pl-8 md:pl-10 relative"
        style={{ 
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 50%)' 
        }}
      >
        <div className="flex flex-col justify-end min-h-full pb-[2px]">
          <span className="break-all whitespace-pre-wrap opacity-60">
            {text || "Initializing secure uplink..."}
          </span>
        </div>
      </div>
    </div>
  );
};

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
    <div className="relative mb-6 scale-75 md:scale-100 py-10 flex flex-col items-center">
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
const StepRotator = ({ steps, interval = 4500 }: { steps: string[], interval?: number }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0); // Reset when steps change
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % steps.length);
    }, interval);
    return () => clearInterval(timer);
  }, [steps, interval]);

  return (
    <div className="h-40 md:h-20 flex items-center justify-center overflow-hidden relative w-full">
      <AnimatePresence initial={false} mode="wait">
         <motion.h2 
            key={index + steps[index]}
            initial={{ opacity: 0, y: 8, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(8px)', position: 'absolute' }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="text-2xl md:text-3xl lg:text-4xl font-thin text-slate-900 tracking-tight font-serif mb-2 px-10 text-center w-full transform-gpu"
         >
           {steps[index]}
         </motion.h2>
      </AnimatePresence>
    </div>
  );
};

/**
 * Optimized Loading View
 */
export const LoadingView = ({ ui, mode, streamingStatus, streamingLog, lang = 'zh' }: LoadingViewProps) => {
  const initialSteps = useMemo(() => ui?.engine?.loading_steps || [
    "Initializing Neural Core",
    "Parsing Behavioral Patterns",
    "Detecting Subconscious Signals",
    "Constructing Holographic Profile",
    "Finalizing Analysis"
  ], [ui?.engine?.loading_steps]);

  const currentSteps = useMemo(() => {
    if (!streamingStatus) return initialSteps;
    
    // Detect Phase
    const isAnalysis = streamingStatus.toLowerCase().includes('analyzing') || streamingStatus.includes('分析');
    const isSynthesis = streamingStatus.toLowerCase().includes('synthesizing') || streamingStatus.includes('合成') || streamingStatus.includes('report');
    
    if (isAnalysis) return PHASE_STEPS.analysis[lang] || PHASE_STEPS.analysis.zh;
    if (isSynthesis) return PHASE_STEPS.synthesis[lang] || PHASE_STEPS.synthesis.zh;
    
    return [streamingStatus]; // Fallback if it's a specific custom status
  }, [streamingStatus, initialSteps, lang]);

  return (
    <div className="h-screen flex flex-col items-center justify-center relative overflow-hidden z-20 bg-slate-50 selection:none font-sans">
       <BackgroundRipples />

       <div className="relative z-10 flex flex-col items-center text-center px-6 w-full max-w-lg mb-20">
          <NeuralCore mode={mode} />

          <div className="flex flex-col items-center justify-center w-full min-h-[160px]">
              <StepRotator steps={currentSteps} interval={streamingStatus ? 3500 : 4500} />
              
              {/* Optional: Breathing dots under the rotator when streaming */}
              <AnimatePresence>
                {streamingStatus && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex gap-1.5 mt-2"
                  >
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-indigo-400/50"
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
          </div>
       </div>

       {/* Real Neural Stream Logs */}
       <div className="absolute bottom-12 left-0 w-full px-6 md:px-12 flex justify-center pointer-events-none">
          <div className="max-w-xl w-full text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Neural Stream Analysis</span>
            </div>
            
            <div className="h-14 overflow-hidden relative w-full flex flex-col items-center">
                <LogContainer text={streamingLog} />
            </div>
          </div>
       </div>
    </div>
  );
};
