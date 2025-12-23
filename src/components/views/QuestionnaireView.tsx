'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TextInput } from '../ui';
import clsx from 'clsx';

interface QuestionnaireViewProps {
  ui: any;
  currentIndex: number;
  allQuestions: any[];
  answers: Record<string, string>;
  lang: string;
  t: (key: any, section?: string) => string;
  onAnswer: (val: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (idx: number) => void;
}

export const QuestionnaireView: React.FC<QuestionnaireViewProps> = ({
  ui,
  currentIndex,
  allQuestions,
  answers,
  lang,
  t,
  onAnswer,
  onNext,
  onPrev,
  onJump
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const currentQ = allQuestions[currentIndex];
  const questionText = currentQ ? t(currentQ.q.text) : '';
  const isLongText = questionText && questionText.length > 50;
  const remaining = allQuestions.length - currentIndex;

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex]);

  if (!currentQ) return null;

  return (
    <motion.div key="questionnaire" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 w-full">
      <div className="max-w-4xl mx-auto h-screen flex flex-col p-6 relative overflow-hidden">

        {/* Progress Bar */}
        <div className="fixed top-0 left-0 w-full h-1.5 bg-gray-100 z-50">
          <motion.div
            className="h-full bg-gray-900"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / allQuestions.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          />
        </div>

        {/* Top Bar - Adjusted for Mobile Header Conflict */}
        <header className="flex justify-between items-center py-4 md:py-6 mt-2 md:mt-4">
          <div className="text-[10px] md:text-sm font-bold tracking-widest text-gray-400 uppercase">
            {t(currentQ.section)}
          </div>
          <div className="text-[10px] md:text-sm font-number font-bold text-slate-500 bg-white/50 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-sm shadow-sm border border-white/50 mr-24 md:mr-0">
            {remaining} {ui.engine.remaining}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full pt-2 md:pt-0">
          <motion.div
            key={currentQ.q.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="w-full max-w-2xl bg-white/80 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col overflow-hidden max-h-[65vh] md:max-h-[75vh]"
          >
            <div
              ref={cardRef}
              className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent custom-scrollbar"
            >
              <h3 className={clsx(
                "font-medium text-gray-900 mb-8 leading-relaxed font-serif transition-all",
                isLongText ? "text-lg md:text-2xl" : "text-xl md:text-4xl"
              )}>
                {questionText}
              </h3>

              <div className="space-y-4">
                {currentQ.q.type === 'choice' && (
                  <div className="grid gap-3">
                    {currentQ.q.options?.map((opt: any) => {
                      const optText = t(opt);
                      return (
                        <button
                          key={optText}
                          onClick={() => onAnswer(optText)}
                          className={clsx(
                            "p-4 md:p-5 text-left rounded-xl transition-all duration-300 border text-sm md:text-base",
                            answers[currentQ.q.id] === optText
                              ? "bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.01]"
                              : "bg-white/50 hover:bg-white text-gray-600 border-transparent hover:shadow-md"
                          )}
                        >
                          {optText}
                        </button>
                      )
                    })}
                  </div>
                )}

                {currentQ.q.type === 'scale' && (
                  <div className="py-8">
                    <div className="flex justify-between text-xs md:text-sm text-gray-500 mb-4 font-medium">
                      <span>{t(currentQ.q.leftLabel || '')}</span>
                      <span>{t(currentQ.q.rightLabel || '')}</span>
                    </div>
                    <input
                      type="range" min="1" max="5" step="1"
                      value={answers[currentQ.q.id] || 3}
                      onChange={(e) => onAnswer(e.target.value)}
                      className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-gray-800 transition-all"
                    />
                    <div className="flex justify-between mt-2 px-1">
                      {[1, 2, 3, 4, 5].map(n => <div key={n} className="w-1 h-1 bg-gray-300 rounded-full" />)}
                    </div>
                  </div>
                )}

                {currentQ.q.type === 'text' && (
                  <TextInput
                    initialValue={answers[currentQ.q.id] || ''}
                    onChange={(val) => onAnswer(val)}
                    placeholder={ui.engine.placeholder}
                  />
                )}
              </div>
            </div>
          </motion.div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center gap-4 relative z-20 pb-28 md:pb-12 w-full max-w-2xl px-2">
            <button
              onClick={onPrev} disabled={currentIndex === 0}
              className="p-3 md:p-4 rounded-full text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 transition-all bg-white/40 shadow-sm shrink-0"
            >
              <ChevronLeft size={24} className="md:w-8 md:h-8" />
            </button>
            <button
              onClick={onNext}
              className="flex-1 px-10 md:px-20 py-4 bg-gray-900 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 text-sm md:text-lg uppercase tracking-widest"
            >
              {currentIndex === allQuestions.length - 1 ? ui.engine.analyze : ui.engine.next} <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Indicator & Jump Nav */}
        <div className="fixed bottom-0 left-0 w-full p-6 flex flex-col items-center gap-4 z-20 pointer-events-none">
          {/* Mobile Current State (Kept at bottom) */}
          <div className="md:hidden bg-white/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-lg border border-white/50 pointer-events-auto text-xs font-medium text-gray-500 flex items-center gap-3">
            <span className="font-number">{currentIndex + 1} / {allQuestions.length}</span>
            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / allQuestions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Jump Nav (Moved to Top) */}
        {allQuestions.length <= 50 ? (
          <div className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-white/50 backdrop-blur-md px-3 py-2 rounded-full shadow-sm border border-white/40 gap-1 max-w-[40vw] overflow-x-auto scrollbar-hide">
            {allQuestions.map((_, idx) => (
              <div
                key={idx}
                onClick={() => onJump(idx)}
                className={clsx(
                  "w-1.5 h-1.5 rounded-full cursor-pointer transition-all duration-300",
                  idx === currentIndex ? "w-4 bg-gray-900 scale-110" :
                    idx < currentIndex ? "bg-gray-400" : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        ) : (
          <div className="hidden md:flex fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-auto items-center gap-3 bg-white/80 backdrop-blur-xl px-6 py-2.5 rounded-full shadow-xl border border-white/50 transition-all hover:bg-white">
            <div className="text-sm font-bold text-gray-900 font-number flex items-center gap-2">
              <span className="text-indigo-600 font-black tracking-tighter">#{currentIndex + 1}</span>
              <span className="text-gray-300">/</span>
              <span className="text-gray-400 font-light">{allQuestions.length}</span>
            </div>
            <div className="h-4 w-[1px] bg-slate-200 mx-1" />
            <div className="flex items-center gap-2 group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
                {ui.engine.jump_to || "Jump"}
              </span>
              <input
                type="number"
                min="1" max={allQuestions.length}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (val >= 1 && val <= allQuestions.length) onJump(val - 1);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                placeholder=".."
                className="w-10 bg-slate-100 rounded-lg px-2 py-1 text-xs text-center border-none focus:ring-2 focus:ring-indigo-500/20 outline-none font-number font-bold text-indigo-700"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
