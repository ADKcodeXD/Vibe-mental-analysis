'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, ChevronLeft, X } from 'lucide-react';
import { ModeCard } from '../ui';

interface ModeSelectViewProps {
  ui: any;
  lang: string;
  questions: any;
  selectedModules: string[];
  onModeSelect: (m: any) => void;
  onToggleModule: (id: string) => void;
  onBack: () => void;
}

export const ModeSelectView: React.FC<ModeSelectViewProps> = ({
  ui,
  lang,
  questions, // Changed from questionsDataMap
  selectedModules,
  onModeSelect,
  onToggleModule,
  onBack
}) => {
  const [showExpansionModal, setShowExpansionModal] = useState(false);
  const currentData = questions; // New line based on instruction
  const fullScheme = currentData.schemes.full; // New line based on instruction

  return (
    <motion.div key="mode_select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-5xl md:pt-0 pt-10">
        <header className="text-center mb-10 ">
          <h1 className="text-5xl md:text-6xl font-serif text-slate-900 mb-2">{ui.mode.title}</h1>
          <p className="text-slate-500 text-lg md:text-xl font-light">{ui.mode.subtitle}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {(['lite', 'standard', 'full'] as const).map((m) => {
            const scheme = questions?.schemes?.[m];
            if (!scheme) return null;
            return (
              <ModeCard
                key={m}
                title={scheme.title}
                desc={scheme.description}
                onClick={() => onModeSelect(m)}
                highlight={m === 'standard'}
              />
            );
          })}
        </div>

        {/* Topic Expansion Trigger */}
        <div className="w-full flex justify-center mb-10">
          <button
            onClick={() => setShowExpansionModal(true)}
            className="flex items-center gap-2 px-8 py-4 bg-white/60 hover:bg-white/90 rounded-full font-medium text-slate-700 transition-all border border-white/50 shadow-sm backdrop-blur-md"
          >
            <Settings size={18} />
            {ui.expansion?.title || "题目扩展 / Topic Expansion"}
            {selectedModules.length > 0 && (
              <span className="bg-slate-900 text-white text-xs px-2 py-1 rounded-full">{selectedModules.length}</span>
            )}
          </button>
        </div>

        <div className="text-center">
          <button onClick={onBack} className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors inline-flex items-center gap-1">
            <ChevronLeft size={16} /> {ui.mode.back}
          </button>
        </div>
      </div>

      {/* Expansion Modal */}
      {showExpansionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowExpansionModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>

            <h3 className="text-3xl font-serif mb-2 text-slate-900">题目扩展</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              {ui.welcome?.expansion_note || "勾选以启用额外分析模块。注意：这些模块通常需要更多的问题数据支持。"}
            </p>

            <div className="space-y-3">
              {[
                { id: 'independent_thinking', label: '独立思考 (Critical Thinking)' },
                { id: 'sexual_repression', label: '性压抑 (Repression)' },
                { id: 'values_ideology', label: '政治光谱 (Values)' }
              ].map(module => (
                <label key={module.id} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedModules.includes(module.id)}
                    onChange={() => onToggleModule(module.id)}
                    className="w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                  />
                  <span className="font-medium text-slate-700">{module.label}</span>
                </label>
              ))}
            </div>

            <div className="mt-8">
              <button
                onClick={() => setShowExpansionModal(false)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                {ui.common?.confirm || "确认详情"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
