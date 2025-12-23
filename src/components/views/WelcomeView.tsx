'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, ChevronRight } from 'lucide-react';
import { LangSwitcher } from '../ui';

interface WelcomeViewProps {
  ui: any;
  config: any;
  hasSession: boolean;
  lang: string;
  setLanguage: (l: any) => void;
  onResume: () => void;
  onStart: () => void;
  onOpenSettings: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  ui,
  config,
  hasSession,
  lang,
  setLanguage,
  onResume,
  onStart,
  onOpenSettings
}) => {
  return (
    <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
      <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 max-w-lg w-full"
        >
          <div className="flex justify-center mb-4 text-purple-600">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Brain size={80} strokeWidth={1} />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl md:text-7xl font-thin tracking-tighter text-slate-900 leading-tight font-serif">
              {ui.welcome.title}
            </h1>
            <p className="text-lg md:text-xl text-slate-400 font-light tracking-[0.2em] uppercase font-sans">
              {ui.welcome.subtitle}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed max-w-md mx-auto">
              {ui.welcome.description}
            </p>

            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] md:text-xs font-semibold text-indigo-400/80 uppercase tracking-[0.15em]">
                {ui.welcome.privacy_hint}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {!config.apiKey && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex justify-center mt-2 relative z-20"
              >
                <button 
                  onClick={onOpenSettings}
                  className="flex items-center gap-3 bg-white/80 border border-amber-200 px-5 py-2.5 rounded-2xl shadow-xl shadow-amber-500/5 hover:-translate-y-0.5 transition-all group"
                >
                  <div className="p-1.5 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                    <AlertTriangle size={14} className="text-amber-600" />
                  </div>
                  <div className="text-left">
                     <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest leading-none mb-0.5">
                       {ui.engine.no_key}
                     </div>
                     <div className="text-[9px] text-amber-600 font-medium">
                       {ui.engine.system_default} • <span className="underline decoration-amber-300">点击配置 / Click to Config</span>
                     </div>
                  </div>
                  <ChevronRight size={14} className="text-amber-400 group-hover:text-amber-600 transition-colors ml-1" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-6 space-y-4">
            {hasSession && (
              <div className="space-y-3 mb-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest">{ui.welcome.session_found}</p>
                <button
                  onClick={onResume}
                  className="w-full md:w-auto px-12 py-4 bg-indigo-50/50 backdrop-blur-md text-indigo-700 border border-indigo-200/50 rounded-full text-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mx-auto font-medium"
                >
                  {ui.welcome.resume} <ChevronRight size={18} />
                </button>
                <button
                  onClick={onStart}
                  className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-[0.2em] font-bold"
                >
                  {ui.welcome.new_session}
                </button>
              </div>
            )}

            {!hasSession && (
              <button
                onClick={() => onStart()}
                className="w-full md:w-auto px-16 py-5 bg-slate-900 text-white rounded-full text-xl shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 mx-auto font-light tracking-widest uppercase"
              >
                {ui.welcome.start} <ChevronRight size={20} />
              </button>
            )}
          </div>
        </motion.div>

        <footer className="mt-16 text-center w-full px-6">
          <div className="text-[10px] md:text-xs text-gray-400 flex flex-col items-center gap-2 bg-white/30 p-4 rounded-xl backdrop-blur-sm">
            <p className="max-w-md mx-auto leading-relaxed">{ui.welcome.disclaimer}</p>
          </div>
        </footer>
      </div>
    </motion.div>
  );
};
