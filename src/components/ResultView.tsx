import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Zap, Heart, User, Activity, AlertTriangle, Eye, Star, Download, Share2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import localesData from '../data/locales.json';
import { useImageExport } from '../hooks/useImageExport';

type Lang = 'zh' | 'en' | 'ja';

const BackgroundDecor = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
    <motion.div 
      animate={{ 
        scale: [1, 1.4, 1],
        opacity: [0.2, 0.4, 0.2],
        x: [-50, 50, -50],
        y: [-30, 30, -30]
      }}
      transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-indigo-200/40 rounded-full blur-[120px]" 
    />
    <motion.div 
      animate={{ 
        scale: [1.4, 1, 1.4],
        opacity: [0.15, 0.35, 0.15],
        x: [50, -50, 50],
        y: [30, -30, 30]
      }}
      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute -bottom-[20%] -right-[10%] w-[90%] h-[90%] bg-purple-200/40 rounded-full blur-[140px]" 
    />
  </div>
);

export const ResultView = ({ data, lang, onBack }: { data: any, lang: Lang, onBack?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { exportImage, isExporting } = useImageExport();

  // Localization Helper
  const t = (section: string, key: string) => {
      return (localesData as any)[lang]?.[section]?.[key] || key;
  }
  
  // Safe Accessor
  const safeStr = (v: any) => v || "Analyzing...";
  const stats = data.stats || {};
  const identity = data.identity_card || {};
  const ui = (localesData as any)[lang]?.result || {};
  const common = (localesData as any)[lang]?.common || { mbti: "MBTI", alignment: "Alignment", verdict: "Verdict", probability: "Probability of Deception", conflicts: "Conflicts", export: "Export Report" };

  return (
    <div className="min-h-screen bg-[#fdfaff] text-slate-800 font-sans selection:bg-purple-100 pb-20 relative overflow-x-hidden">
      <BackgroundDecor />
      
      <div ref={containerRef} className="max-w-6xl mx-auto p-4 md:p-8 lg:p-12 relative z-10">
        {onBack && (
          <button 
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-indigo-500 transition-colors group"
          >
            <div className="p-2 rounded-full border border-slate-200 group-hover:border-indigo-200 group-hover:bg-indigo-50/50 transition-all">
              <ArrowLeft size={16} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest">Back</span>
          </button>
        )}
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 md:mb-12 text-center"
        >
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="flex flex-wrap justify-center gap-2">
              <div className="px-4 py-1 rounded-full bg-purple-100/50 backdrop-blur-sm text-[10px] md:text-xs font-bold tracking-[0.2em] text-purple-500 uppercase border border-purple-200/50">
                {ui.title}
              </div>
              {identity.ideology && (
                <div className="px-5 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] md:text-xs font-bold tracking-[0.1em] uppercase border border-indigo-400 shadow-lg shadow-indigo-500/20">
                  {identity.ideology}
                </div>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-thin tracking-tighter text-slate-900 font-serif leading-tight px-2">
              {safeStr(identity.archetype)}
            </h1>
          </div>
          <div className="w-12 md:w-20 h-1 bg-gradient-to-r from-transparent via-purple-300 to-transparent mx-auto mb-6 opacity-40" />
          <p className="text-lg md:text-2xl lg:text-3xl text-slate-500 font-light italic max-w-3xl mx-auto leading-relaxed font-serif px-4 opacity-90">
            "{safeStr(identity.one_liner)}"
          </p>

        </motion.div>

        {/* TOP DISCLAIMER */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-2xl mb-8 flex gap-3 items-start"
        >
           <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
           <div>
              <div className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
                 {ui.disclaimer_title}
              </div>
              <p className="text-[10px] md:text-xs text-rose-700/80 leading-relaxed font-serif italic">
                 {ui.disclaimer_content}
              </p>
           </div>
        </motion.div>

        {/* GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* LEFT COL: IDENTITY & STATS (4 cols on desktop) */}
          <div className="md:col-span-4 space-y-6">
            <Card title={ui.identity} icon={<User className="text-purple-600" size={18} />}>
              <div className="flex justify-between items-center border-b border-purple-50 pb-2 mb-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{common.mbti}</span>
                <span className="text-xl md:text-3xl font-bold font-serif text-slate-900">{safeStr(identity.mbti)}</span>
              </div>
              <div className="flex justify-between items-center border-b border-purple-50 pb-2 mb-2">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{common.alignment}</span>
                <span className="text-sm md:text-base font-medium text-slate-600">{safeStr(identity.alignment)}</span>
              </div>
              {identity.ideology && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{common.ideology}</span>
                  <span className="text-sm md:text-base font-medium text-slate-600">{safeStr(identity.ideology)}</span>
                </div>
              )}
            </Card>

            <Card title={ui.truth} icon={<Shield className={stats.credibility_score < 60 ? "text-rose-500" : "text-emerald-500"} size={18} />}>
              <div className="text-center py-2 md:py-4">
                <div className={clsx(
                  "text-4xl md:text-5xl font-thin font-number mb-1 tracking-tighter",
                  stats.credibility_score < 60 ? "text-rose-500" : "text-emerald-500"
                )}>
                  {stats.credibility_score || 0}%
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{ui.credibility}</div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 border-b border-purple-50 pb-2">
                   <span>{common.contradiction_label}</span>
                   <span className={stats.conflicts?.length > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                     {stats.conflicts?.length || 0}
                   </span>
                </div>

                {stats.conflicts && stats.conflicts.length > 0 && (
                  <div className="bg-rose-50/50 p-3 rounded-xl text-[10px] text-rose-600 border border-rose-100 leading-relaxed italic">
                    {stats.conflicts.map((c: string, i: number) => <div key={i}>{c}</div>)}
                  </div>
                )}

                <div className="text-[10px] font-bold text-slate-400 pt-1 flex justify-between px-1">
                  <span>{common.verdict}</span>
                  <span className={(stats.lie_verdict === 'Deceptive' || stats.lie_verdict === common.verdict_deceptive) ? 'text-rose-500' : 'text-emerald-500'}>{stats.lie_verdict}</span>
                </div>
              </div>
            </Card>

            <Card title={ui.alter_ego} icon={<Star className="text-amber-500" size={18} />}>
               <div className="text-center py-2">
                 <h3 className="text-lg md:text-xl font-serif text-slate-900 mb-2">{data.celebrity_match?.name || "Unknown"}</h3>
                 <p className="text-xs text-slate-500 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/50 italic font-serif">
                   "{data.celebrity_match?.reason}"
                 </p>
               </div>
            </Card>
          </div>

          {/* MAIN COL: ANALYSIS (8 cols on desktop) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* STRENGTHS */}
            <Card title={ui.strengths} icon={<Zap className="text-purple-500" size={18} />}>
               <p className="text-slate-700 leading-relaxed text-sm md:text-lg font-light font-serif">
                 {data.analysis?.strengths}
               </p>
            </Card>

            {/* SHADOW & CLINICAL */}
            {/* CLINICAL SUMMARY CARD */}
            <Card title={ui.clinical_summary} icon={<Activity className="text-rose-500" size={18} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Depression Card */}
                <div className={clsx(
                  "p-5 rounded-[1.25rem] border transition-all",
                  (data.clinical_findings?.depression?.status === 'High' || data.clinical_findings?.depression?.status === common.status_high)
                    ? "bg-rose-50 border-rose-100 text-rose-900" 
                    : "bg-slate-50 border-slate-100 text-slate-900"
                )}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">{ui.depression_card}</span>
                    <AlertTriangle size={14} className={data.clinical_findings?.depression?.status === 'High' ? "text-rose-500" : "text-slate-300"} />
                  </div>
                  <div className="text-2xl font-serif font-bold mb-2">{data.clinical_findings?.depression?.status || 'None'}</div>
                  <p className="text-xs leading-relaxed opacity-80">{data.clinical_findings?.depression?.description}</p>
                </div>

                {/* ADHD Card */}
                <div className="p-5 rounded-[1.25rem] border bg-indigo-50 border-indigo-100 text-indigo-900">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">{ui.adhd_card}</span>
                    <Zap size={14} className="text-indigo-400" />
                  </div>
                  <div className="text-2xl font-serif font-bold mb-2">{data.clinical_findings?.adhd?.status || 'None'}</div>
                  <p className="text-xs leading-relaxed opacity-80">{data.clinical_findings?.adhd?.description}</p>
                </div>

                {/* Attachment Card */}
                <div className="p-5 rounded-[1.25rem] border bg-purple-50 border-purple-100 text-purple-900">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">{ui.attachment_card}</span>
                    <Heart size={14} className="text-purple-400" />
                  </div>
                  <div className="text-xl md:text-2xl font-serif font-bold mb-2 leading-tight">{data.clinical_findings?.attachment?.type || 'None'}</div>
                  <p className="text-xs leading-relaxed opacity-80">{data.clinical_findings?.attachment?.description}</p>
                </div>
              </div>
              
              {data.analysis?.clinical_note && (
                 <div className="mt-6 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-100 flex gap-3 items-start italic">
                   <Brain className="shrink-0 mt-0.5 text-slate-300" size={14} />
                   <div>{data.analysis.clinical_note}</div>
                 </div>
              )}
            </Card>

            <Card title={ui.shadow} icon={<Shield className="text-indigo-500" size={18} />}>
              <p className="text-slate-700 leading-relaxed font-light text-sm md:text-base">
                {data.analysis?.dark_side}
              </p>
            </Card>

            {data.analysis?.ideology_note && (
              <Card title={ui.ideology_analysis} icon={<Star className="text-indigo-500" size={18} />}>
                <p className="text-slate-700 leading-relaxed font-light text-sm md:text-base font-serif italic">
                  {data.analysis.ideology_note}
                </p>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={ui.ideology} icon={<Activity className="text-violet-500" size={18} />}>
                  {identity.ideology && (
                    <div className="mb-4 p-3 bg-violet-50 rounded-xl border border-violet-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">{common.ideology}</span>
                      <span className="text-xs font-bold text-violet-900">{identity.ideology}</span>
                    </div>
                  )}
                  <ul className="space-y-3 text-xs">
                    {data.dimensions && Object.entries(data.dimensions).map(([k, v]) => (
                      <li key={k} className="flex justify-between border-b border-purple-50 pb-1.5 relative">
                        <span className="capitalize text-slate-400 font-medium tracking-wide text-[10px]">
                          {ui[`dimension_${k.toLowerCase()}`] || k}
                        </span>
                        <span className="font-bold text-slate-800 text-[11px]">{v as string}</span>
                      </li>
                    ))}
                  </ul>
               </Card>

               <div className="bg-slate-900 p-6 md:p-8 rounded-[1.5rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="absolute top-[-50%] right-[-50%] w-[100%] h-[100%] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10">
                    <h3 className="text-[9px] font-bold opacity-40 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield size={12} /> {ui.tactical}
                    </h3>
                    <p className="text-slate-200 text-xs md:text-sm leading-relaxed italic font-serif opacity-90">"{data.analysis?.advice}"</p>
                  </div>
                   <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end opacity-30 text-[8px] tracking-widest relative z-10 font-mono">
                      <span>MENTAL HELP // AI AGENT</span>
                      <span>V1.5</span>
                   </div>
                </div>
             </div>

          </div>
        </div>
        
        {/* FOOTER */}
        <div className="mt-12 text-center text-slate-300 text-[9px] font-mono uppercase tracking-[0.3em]">
             Holographic Profile System
        </div>

      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-0 w-full flex justify-center gap-3 md:gap-4 z-50 px-4">
        <button 
          onClick={() => window.location.reload()} 
          className="px-5 md:px-6 py-2.5 bg-white/70 backdrop-blur-xl border border-white/50 text-slate-600 rounded-full hover:bg-white hover:text-slate-900 transition-all shadow-lg flex items-center gap-2 text-xs"
        >
            {ui.retake}
        </button>
      </div>
    </div>
  );
};

// Utils
const Card = ({ title, icon, children }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-purple-50/50 hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-center gap-3 mb-4 md:mb-5 border-b border-purple-50 pb-3">
      <div className="p-1.5 bg-purple-50 rounded-lg">{icon}</div>
      <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{title}</span>
    </div>
    {children}
  </motion.div>
);
