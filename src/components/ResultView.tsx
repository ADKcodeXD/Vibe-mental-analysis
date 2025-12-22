import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, Brain, Zap, Heart, User, Activity, AlertTriangle, Star, Share2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import localesData from '../data/locales.json';

// Import extracted components
import { BackgroundDecor, Card, ScoreBar, DimensionBar } from './ui';

type Lang = 'zh' | 'en' | 'ja';

export const ResultView = ({ data, lang, mode, onBack }: { data: any, lang: Lang, mode?: 'lite' | 'standard' | 'full' | null, onBack?: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const t = (section: string, key: string) => {
      return (localesData as any)[lang]?.[section]?.[key] || key;
  }
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
            {(mode !== 'lite') && (
              <div className="flex flex-wrap justify-center gap-2">
                <div className="px-4 py-1 rounded-full bg-purple-100/80 text-[10px] md:text-xs font-bold tracking-[0.2em] text-purple-500 uppercase border border-purple-200/50">
                  {ui.title}
                </div>
              </div>
            )}
            
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
            </Card>

            {/* CLINICAL LABEL (New) */}
            {identity.clinical_label && (
               <Card title={ui.clinical_label || "Clinical Vibe"} icon={<Activity className="text-pink-500" size={18} />}>
                  <div className="text-center">
                    <div className="text-lg md:text-xl font-bold text-pink-600 mb-1">{identity.clinical_label}</div>
                    <p className="text-xs text-slate-500 italic">"{identity.clinical_explanation}"</p>
                  </div>
               </Card>
            )}

            {/* HIGHLIGHTS (New) */}
            {data.highlights && (
               <Card title={ui.highlights || "Talent & Risk"} icon={<Zap className="text-yellow-500" size={18} />}>
                  <div className="space-y-3">
                     <div>
                        <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{ui.superpowers || "Superpowers"}</div>
                        <div className="flex flex-wrap gap-1">
                           {data.highlights.talents?.map((t: string) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">{t}</span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <div className="text-[10px] font-bold text-rose-600 uppercase mb-1">{ui.kryptonite || "Kryptonite"}</div>
                        <div className="flex flex-wrap gap-1">
                           {data.highlights.liabilities?.map((t: string) => (
                              <span key={t} className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full border border-rose-100">{t}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               </Card>
            )}

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

            {/* SCORING & STATS (New) */}
            {data.scores && (
              <Card title={ui.scores || "Vital Stats"} icon={<Activity className="text-blue-500" size={18} />}>
                 <ScoreBar label={ui.repression_index || "Repression Index"} value={data.scores.repression_index} color="bg-indigo-500" />
                 <ScoreBar label={ui.happiness_index || "Happiness Index"} value={data.scores.happiness_index} color="bg-emerald-500" />
                 <ScoreBar label={ui.social_adaptation || "Social Mask"} value={data.scores.social_adaptation} color="bg-amber-500" />
                 <ScoreBar label={ui.independent_thinking || "Free Thought"} value={data.scores.independent_thinking} color="bg-cyan-500" />
              </Card>
            )}

            {/* DIMENSIONS (Political Compass) */}
            {data.dimensions && (
              <Card title={ui.dimensions || "Ideology Spectrum"} icon={<Share2 className="text-violet-500" size={18} />}>
                 {data.dimensions.economic && <DimensionBar value={data.dimensions.economic.value} axisLabel={data.dimensions.economic.axis_label} leftLabel="Equality" rightLabel="Markets" />}
                 {data.dimensions.diplomatic && <DimensionBar value={data.dimensions.diplomatic.value} axisLabel={data.dimensions.diplomatic.axis_label} leftLabel="Nation" rightLabel="Globe" />}
                 {data.dimensions.civil && <DimensionBar value={data.dimensions.civil.value} axisLabel={data.dimensions.civil.axis_label} leftLabel="Authority" rightLabel="Liberty" />}
                 {data.dimensions.societal && <DimensionBar value={data.dimensions.societal.value} axisLabel={data.dimensions.societal.axis_label} leftLabel="Tradition" rightLabel="Progress" />}
                 
                 {identity.ideology && (
                    <div className="mt-4 p-3 bg-violet-50 rounded-xl border border-violet-100 text-center">
                       <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block mb-1">{common.ideology}</span>
                       <span className="text-sm font-bold text-violet-900">{identity.ideology}</span>
                    </div>
                 )}
              </Card>
            )}
          </div>

          {/* MAIN COL: ANALYSIS (8 cols on desktop) */}
          <div className="md:col-span-8 space-y-6">
            
            {/* STRENGTHS */}
            <Card title={ui.strengths} icon={<Zap className="text-purple-500" size={18} />}>
               <p className="text-slate-700 leading-relaxed text-sm md:text-lg font-light font-serif">
                 {data.analysis?.strengths}
               </p>
            </Card>

            {/* CLINICAL SUMMARY CARD */}
            <Card title={ui.clinical_summary} icon={<Activity className="text-rose-500" size={18} />}>
              <div className={clsx(
                "grid grid-cols-1 gap-4",
                mode === 'lite' ? "md:grid-cols-1" : "md:grid-cols-3"
              )}>
                {/* Depression Card */}
                <ClinicalCard
                  label={ui.depression_card}
                  status={data.clinical_findings?.depression?.status}
                  description={data.clinical_findings?.depression?.description}
                  isHigh={data.clinical_findings?.depression?.status === 'High' || data.clinical_findings?.depression?.status === common.status_high}
                  colorScheme="rose"
                  icon={<AlertTriangle size={14} className={data.clinical_findings?.depression?.status === 'High' ? "text-rose-500" : "text-slate-300"} />}
                />

                {/* ADHD Card - Hidden in Simplified (Lite) Mode */}
                {data.clinical_findings?.adhd && mode !== 'lite' && (
                  <ClinicalCard
                    label={ui.adhd_card}
                    status={data.clinical_findings?.adhd?.status}
                    description={data.clinical_findings?.adhd?.description}
                    colorScheme="indigo"
                    icon={<Zap size={14} className="text-indigo-400" />}
                  />
                )}

                {/* Attachment Card - Hidden in Simplified (Lite) Mode */}
                {data.clinical_findings?.attachment && mode !== 'lite' && (
                  <ClinicalCard
                    label={ui.attachment_card}
                    status={data.clinical_findings?.attachment?.type}
                    description={data.clinical_findings?.attachment?.description}
                    colorScheme="purple"
                    icon={<Heart size={14} className="text-purple-400" />}
                  />
                )}

                {/* Sexual Repression Card - Standard/Full Mode Only */}
                {data.clinical_findings?.sexual_repression && mode !== 'lite' && (
                  <ClinicalCard
                    label={ui.sexual_card || "Repression"}
                    status={data.clinical_findings?.sexual_repression?.level}
                    description={data.clinical_findings?.sexual_repression?.explanation}
                    colorScheme="pink"
                    icon={<Heart size={14} className="text-pink-400" />}
                  />
                )}
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

            <div className="grid grid-cols-1 gap-6">

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

              {/* NEW SECTIONS: Career & Social */}
              <div className={clsx(
                "grid grid-cols-1 gap-6",
                (data.social_analysis && mode !== 'lite') ? "md:grid-cols-2" : "md:grid-cols-1"
              )}>
                {/* CAREER */}
                {data.career_analysis && (
                  <Card title={ui.career || "CAREER PATH"} icon={<Zap className="text-amber-500" size={18} />}>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{ui.sweet_spot || "Sweet Spot"}</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.career_analysis.suitable_careers?.map((c: string) => (
                            <span key={c} className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md text-xs font-medium border border-emerald-100">{c}</span>
                          ))}
                        </div>
                      </div>
                       <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{ui.avoid || "Avoid"}</h4>
                        <div className="flex flex-wrap gap-2">
                          {data.career_analysis.unsuitable_careers?.map((c: string) => (
                            <span key={c} className="bg-rose-50 text-rose-700 px-2 py-1 rounded-md text-xs font-medium border border-rose-100">{c}</span>
                          ))}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs italic text-slate-600">
                        "{data.career_analysis.workplace_advice}"
                      </div>
                    </div>
                  </Card>
                )}

                 {/* SOCIAL - Hidden in Simplified (Lite) Mode */}
                {data.social_analysis && mode !== 'lite' && (
                  <Card title={ui.social || "SOCIAL CIRCLE"} icon={<Heart className="text-rose-400" size={18} />}>
                     <p className="text-sm font-serif text-slate-700 leading-relaxed mb-4">
                       {data.social_analysis.overview}
                     </p>
                     
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-indigo-900 font-bold">{ui.deep_connections || "Deep Connections"}</span>
                          <span className="text-slate-500 max-w-[60%] text-right">{data.social_analysis.circle_breakdown?.deep_connections}</span>
                       </div>
                       <div className="h-px bg-slate-100 w-full" />
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 font-bold">{ui.casual_friends || "Casual Friends"}</span>
                          <span className="text-slate-500 max-w-[60%] text-right">{data.social_analysis.circle_breakdown?.casual_friends}</span>
                       </div>
                       <div className="h-px bg-slate-100 w-full" />
                       <div className="flex justify-between items-center text-xs">
                          <span className="text-rose-600 font-bold">{ui.toxicity || "Toxicity"}</span>
                          <span className="text-slate-500 max-w-[60%] text-right">{data.social_analysis.circle_breakdown?.useless_connections}</span>
                       </div>
                     </div>
                  </Card>
                )}
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

// Clinical Card Component - extracted for reuse
interface ClinicalCardProps {
  label: string;
  status?: string;
  description?: string;
  isHigh?: boolean;
  colorScheme: 'rose' | 'indigo' | 'purple' | 'pink';
  icon: React.ReactNode;
}

const ClinicalCard = ({ label, status, description, isHigh, colorScheme, icon }: ClinicalCardProps) => {
  const colorMap = {
    rose: isHigh ? "bg-rose-50 border-rose-100 text-rose-900" : "bg-slate-50 border-slate-100 text-slate-900",
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-900",
    purple: "bg-purple-50 border-purple-100 text-purple-900",
    pink: "bg-pink-50 border-pink-100 text-pink-900"
  };

  return (
    <div className={`p-5 rounded-[1.25rem] border transition-all ${colorMap[colorScheme]}`}>
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] opacity-60">{label}</span>
        {icon}
      </div>
      <div className="text-xl md:text-2xl font-serif font-bold mb-2 leading-tight">{status || 'None'}</div>
      <p className="text-xs leading-relaxed opacity-80">{description}</p>
    </div>
  );
};
