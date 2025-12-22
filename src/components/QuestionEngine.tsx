'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ResultView } from './ResultView';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Settings, Globe, Circle, AlertTriangle, Brain, Activity, Clock, Trash2, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import questionsZh from '../data/questions/zh.json';
import questionsEn from '../data/questions/en.json';
import questionsJa from '../data/questions/ja.json';
import localesData from '../data/locales.json';

const questionsDataMap: Record<Lang, any> = {
  zh: questionsZh,
  en: questionsEn,
  ja: questionsJa
};

type Lang = 'zh' | 'en' | 'ja';

type LocalizedText = { [key in Lang]?: string } | string;

type Question = {
  id: string;
  type: string;
  text: LocalizedText;
  options?: LocalizedText[];
  leftLabel?: LocalizedText;
  rightLabel?: LocalizedText;
};

type Config = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export default function QuestionEngine() {
  const [view, setView] = useState<'welcome' | 'settings' | 'mode_select' | 'questionnaire' | 'result' | 'history'>('welcome');
  const [mode, setMode] = useState<'lite' | 'full' | null>(null);
  const [config, setConfig] = useState<Config>({ apiKey: '', baseUrl: '', model: '' });
  const [lang, setLang] = useState<Lang>('zh');
  const [history, setHistory] = useState<any[]>([]);
  const [hasSession, setHasSession] = useState(false);

  const saveToHistory = (data: any) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(lang === 'zh' ? 'zh-CN' : (lang === 'ja' ? 'ja-JP' : 'en-US')),
      archetype: data.identity_card?.archetype || 'Unknown',
      data: data
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem('holo_history', JSON.stringify(updated));
  };

  const deleteHistory = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('holo_history', JSON.stringify(updated));
  };

  // Translation Helper
  const t = (key: string | LocalizedText, section: string = '') => {
      if (typeof key === 'object') return key[lang] || key['zh'] || '';
      if (section && (localesData as any)[lang][section]?.[key]) return (localesData as any)[lang][section][key];
      return key;
  };

  const ui = (localesData as any)[lang];

  // Flattened Questions Logic
  const allQuestions = useMemo(() => {
    if (!mode) return [];
    const activeData = (questionsDataMap[lang]).modes[mode];
    const flattened: { q: Question, section: LocalizedText }[] = [];
    activeData.sections.forEach((sec: any) => {
      sec.questions.forEach((q: any) => flattened.push({ q, section: sec.title }));
    });
    return flattened;
  }, [mode, lang]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when question changes
  useEffect(() => {
    if (view === 'questionnaire' && cardRef.current) {
      cardRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentIndex, view]);

  useEffect(() => {
    const saved = localStorage.getItem('holo_config');
    if (saved) setConfig(JSON.parse(saved));
    const savedLang = localStorage.getItem('holo_lang');
    if (savedLang) {
      setLang(savedLang as Lang);
    } else {
      // Auto-detect browser language
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.includes('zh')) setLang('zh');
      else if (browserLang.includes('ja')) setLang('ja');
      else setLang('en');
    }

    const session = localStorage.getItem('holo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        // Only mark session exists if there are answers
        if (parsed.answers && Object.keys(parsed.answers).length > 0) {
          // We don't load it immediately to show the "Resume" prompt
        }
      } catch (e) {}
    }
    setHasSession(!!session);
    const savedHistory = localStorage.getItem('holo_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveConfig = () => {
    localStorage.setItem('holo_config', JSON.stringify(config));
    setShowSettings(false);
  };

  const setLanguage = (l: Lang) => {
      setLang(l);
      localStorage.setItem('holo_lang', l);
  }

  const handleAnswer = (val: string) => {
    const newAnswers = { ...answers, [allQuestions[currentIndex].q.id]: val };
    setAnswers(newAnswers);
    
    // Persist session
    localStorage.setItem('holo_session', JSON.stringify({
       answers: newAnswers,
       currentIndex,
       mode
    }));

    // Auto-advance for choice questions after a brief delay
    if (allQuestions[currentIndex].q.type === 'choice') {
      setTimeout(() => nextQuestion(), 250);
    }
  };

  const nextQuestion = async () => {
    if (currentIndex < allQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      await submit();
    }
  };
  
  const prevQuestion = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const jumpTo = (index: number) => {
    setCurrentIndex(index);
  }

  const submit = async () => {
    setLoading(true);
    setView('result'); 
    try {
      const payload = {
        answers: Object.entries(answers).map(([id, value]) => ({ questionId: id, value })),
        config: config.apiKey ? config : undefined,
        lang // Pass language to backend if needed for prompting
      };
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      saveToHistory(data);
      // Success: clear session
      localStorage.removeItem('holo_session');
      setView('result');
    } catch (e: any) {
      console.error(e);
      alert(`${ui.engine.error_retry}\n\nError: ${e.message}`);
      setShowSettings(true);
      setView('welcome');
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = () => {
    const session = localStorage.getItem('holo_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setAnswers(parsed.answers || {});
        setCurrentIndex(parsed.currentIndex || 0);
        setMode(parsed.mode || null);
        setView('questionnaire');
      } catch (e) {
        console.error("Resume failed:", e);
      }
    }
  };

  const startNewSession = () => {
    localStorage.removeItem('holo_session');
    setAnswers({});
    setCurrentIndex(0);
    setMode(null);
    setView('mode_select');
  };

  // --- Views ---

  if (loading) return <LoadingView ui={ui} />;
  
  if (view === 'history') {
    return (
      <HistoryView 
        history={history} 
        onSelect={(data: any) => {setResult(data); setView('result');}}
        onDelete={deleteHistory}
        setView={setView}
        ui={ui}
      />
    );
  }

  if (result) return <ResultView data={result} lang={lang} onBack={() => {setResult(null); setView(history.length > 0 ? 'history' : 'welcome');}} />;




  if (view === 'welcome') {
    return (
      <Background>
        <LangSwitcher lang={lang} setLang={setLanguage} />
        
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
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full backdrop-blur-md">
                       <AlertTriangle size={12} className="text-amber-600" />
                       <span className="text-[10px] md:text-xs font-medium text-amber-700 uppercase tracking-wide">
                          {ui.engine.no_key} • {ui.engine.system_default}
                       </span>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-6 space-y-4">
                {hasSession && (
                  <div className="space-y-3 mb-6">
                     <p className="text-xs text-slate-400 uppercase tracking-widest">{ui.welcome.session_found}</p>
                     <button 
                        onClick={resumeSession}
                        className="w-full md:w-auto px-12 py-4 bg-indigo-50/50 backdrop-blur-md text-indigo-700 border border-indigo-200/50 rounded-full text-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 mx-auto font-medium"
                     >
                        {ui.welcome.resume} <ChevronRight size={18} />
                     </button>
                     <button 
                        onClick={startNewSession}
                        className="text-[10px] text-slate-400 hover:text-rose-400 transition-colors uppercase tracking-[0.2em] font-bold"
                     >
                        {ui.welcome.new_session}
                     </button>
                  </div>
               )}

               {!hasSession && (
                  <button 
                  onClick={() => setView('mode_select')}
                  className="w-full md:w-auto px-16 py-5 bg-slate-900 text-white rounded-full text-xl shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-3 mx-auto font-light tracking-widest uppercase"
                  >
                  {ui.welcome.start} <ChevronRight size={20} />
                  </button>
               )}

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="text-sm text-gray-400 hover:text-gray-900 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <Settings size={14} /> {showSettings ? ui.settings.cancel : ui.welcome.settings}
                </button>
                
                {history.length > 0 && view === 'welcome' && (
                  <button 
                    onClick={() => setView('history')}
                    className="text-sm text-indigo-500 hover:text-indigo-700 transition-colors font-medium flex items-center justify-center gap-2 mx-auto"
                  >
                    <Activity size={14} /> {ui.result.history_title}
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/60 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-inner mt-4 text-left space-y-4 relative z-20">
                     <p className="text-xs text-center text-gray-400 mb-4">
                        {ui.settings.config_hint}
                     </p>
                     <Input label={ui.settings.apiKey} value={config.apiKey} onChange={(v: string) => setConfig({...config, apiKey: v})} placeholder="sk-..." type="password" />
                     <Input label={ui.settings.baseUrl} value={config.baseUrl} onChange={(v: string) => setConfig({...config, baseUrl: v})} placeholder="https://api.openai.com/v1" />
                     
                     <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{ui.settings.model}</label>
                        <div className="flex flex-wrap gap-2">
                           {[
                              'google/gemini-3-flash-preview',
                              'openai/gpt-5.2-pro',
                              'xiaomi/mimo-v2-flash:free',
                              'deepseek/deepseek-v3.2',
                              'google/gemini-3-pro-preview',
                              'anthropic/claude-sonnet-4.5'
                           ].map(m => (
                              <button 
                                 key={m}
                                 onClick={() => setConfig({...config, model: m})}
                                 className={clsx(
                                    "text-[10px] px-3 py-1.5 rounded-lg border transition-all",
                                    config.model === m ? "bg-gray-900 text-white border-gray-900" : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400"
                                 )}
                              >
                                 {m.split('/')[1] || m}
                              </button>
                           ))}
                        </div>
                        <input 
                           value={config.model} 
                           onChange={(e) => setConfig({...config, model: e.target.value})} 
                           placeholder={ui.settings.custom_model_placeholder}
                           className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-all text-sm" 
                        />
                     </div>

                     <div className="flex justify-center pt-2">
                        <button onClick={() => {saveConfig(); setShowSettings(false);}} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold">
                           {ui.settings.save_close}
                        </button>
                     </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <footer className="mt-16 text-center w-full px-6">
            <div className="text-[10px] md:text-xs text-gray-400 flex flex-col items-center gap-2 bg-white/30 p-4 rounded-xl backdrop-blur-sm">
              <p className="max-w-md mx-auto leading-relaxed">{ui.welcome.disclaimer}</p>
            </div>
          </footer>
        </div>
      </Background>
    );
  }

  if (view === 'mode_select') {
    return (
      <Background>
       <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-10">
          <header className="text-center">
            <h1 className="text-4xl font-light text-gray-900 mb-2">{ui.mode.title}</h1>
            <p className="text-gray-500">{ui.mode.subtitle}</p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
            <ModeCard 
              title={ui.mode.lite_title} 
              desc={ui.mode.lite_desc} 
              onClick={() => { setMode('lite'); setView('questionnaire'); }} 
            />
            <ModeCard 
              title={ui.mode.full_title} 
              desc={ui.mode.full_desc} 
              onClick={() => { setMode('full'); setView('questionnaire'); }} 
              highlight
            />
          </div>
          
          <button onClick={() => setView('welcome')} className="text-gray-400 hover:text-gray-900 mt-8">{ui.mode.back}</button>
        </div>
      </Background>
    );
  }

  // Questionnaire View
  const currentQ = allQuestions[currentIndex];
  // Calculate font size relative to text length
  const questionText = t(currentQ.q.text);
  const isLongText = questionText && questionText.length > 50;
  
  const remaining = allQuestions.length - currentIndex;

  return (
    <Background>
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
        
        {/* Top Bar */}
        <header className="flex justify-between items-center py-4">
          <div className="text-sm font-bold tracking-widest text-gray-400 uppercase">
             {t(currentQ.section)}
          </div>
          <div className="text-sm font-number font-medium text-gray-500 bg-white/50 px-4 py-2 rounded-full backdrop-blur-sm shadow-sm">
             {remaining} {ui.engine.remaining}
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center items-center relative z-10 w-full">
            <motion.div
              key={currentQ.q.id} // Stable key
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full max-w-2xl bg-white/60 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/50 flex flex-col overflow-hidden max-h-[85vh] md:max-h-[75vh]"
            >
              <div 
                ref={cardRef}
                className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent custom-scrollbar"
              >
              <h3 className={clsx(
                "font-medium text-gray-900 mb-8 leading-relaxed font-serif transition-all",
                isLongText ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
              )}>
                {questionText}
              </h3>
              
              <div className="space-y-4">
              {currentQ.q.type === 'choice' && (
                <div className="grid gap-3">
                  {currentQ.q.options?.map((opt: LocalizedText) => {
                    const optText = t(opt);
                    return (
                    <button 
                      key={optText}
                      onClick={() => handleAnswer(optText)}
                      className={clsx(
                        "p-4 md:p-5 text-left rounded-xl transition-all duration-300 border",
                        answers[currentQ.q.id] === optText 
                          ? "bg-gray-900 text-white border-gray-900 shadow-lg scale-[1.01]" 
                          : "bg-white/50 hover:bg-white text-gray-600 border-transparent hover:shadow-md"
                      )}
                    >
                      {optText}
                    </button>
                  )})}
                </div>
              )}

              {currentQ.q.type === 'scale' && (
                <div className="py-8">
                   <div className="flex justify-between text-sm text-gray-500 mb-4 font-medium">
                    <span>{t(currentQ.q.leftLabel || '')}</span>
                    <span>{t(currentQ.q.rightLabel || '')}</span>
                  </div>
                  <input 
                    type="range" min="1" max="5" step="1"
                    value={answers[currentQ.q.id] || 3}
                    onChange={(e) => handleAnswer(e.target.value)}
                    className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-900 hover:accent-gray-800 transition-all"
                  />
                  <div className="flex justify-between mt-2 px-1">
                     {[1,2,3,4,5].map(n => <div key={n} className="w-1 h-1 bg-gray-300 rounded-full" />)}
                  </div>
                </div>
              )}

              {currentQ.q.type === 'text' && (
                <textarea
                  value={answers[currentQ.q.id] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder={ui.engine.placeholder}
                  className="w-full bg-white/50 border-0 rounded-xl p-5 text-gray-800 placeholder-gray-400 focus:ring-0 focus:bg-white focus:shadow-lg transition-all h-40 resize-none text-lg leading-relaxed"
                />
              )}
              </div>
              </div>
            </motion.div>
          
          {/* Navigation Buttons */}
          <div className="mt-8 flex items-center gap-4 relative z-20 pb-12">
             <button 
                onClick={prevQuestion} disabled={currentIndex === 0}
                className="p-3 md:p-4 rounded-full text-gray-400 hover:bg-white hover:text-gray-900 disabled:opacity-30 transition-all bg-white/40 shadow-sm"
             >
                <ChevronLeft size={24} className="md:w-8 md:h-8" />
             </button>
             <button 
                onClick={nextQuestion}
                className="flex-1 md:flex-none md:px-12 py-3.5 bg-gray-900 text-white rounded-full font-medium shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
             >
                {currentIndex === allQuestions.length - 1 ? ui.engine.analyze : ui.engine.next} <ChevronRight size={18} />
             </button>
          </div>
        </div>

        {/* Navigation Indicator & Jump Nav */}
        <div className="fixed bottom-0 left-0 w-full p-4 md:p-6 flex flex-col items-center gap-4 z-20 pointer-events-none">
          {/* Mobile Current State */}
          <div className="md:hidden bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-white/50 pointer-events-auto text-xs font-medium text-gray-500 flex items-center gap-2">
            <span>{currentIndex + 1} / {allQuestions.length}</span>
            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div 
                 className="h-full bg-gray-900 transition-all duration-300" 
                 style={{ width: `${((currentIndex + 1) / allQuestions.length) * 100}%` }} 
              />
            </div>
          </div>

          <div className="hidden md:flex bg-white/80 backdrop-blur-xl px-2 py-2 rounded-full shadow-2xl pointer-events-auto gap-1 max-w-[90vw] overflow-x-auto scrollbar-hide">
             {allQuestions.map((_, idx) => (
                <div 
                  key={idx}
                  onClick={() => jumpTo(idx)}
                  className={clsx(
                    "w-2 h-2 rounded-full cursor-pointer transition-all duration-300",
                    idx === currentIndex ? "w-6 bg-gray-900" : 
                    idx < currentIndex ? "bg-gray-400" : "bg-gray-200 hover:bg-gray-300"
                  )}
                />
             ))}
          </div>
        </div>
      </div>
    </Background>
  );
}

// --- Sub Components ---

const Background = ({ children }: any) => (
  <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden transition-colors duration-500">
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      <motion.div 
        animate={{ 
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
          x: [-50, 50, -50],
          y: [-30, 30, -30]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] bg-indigo-200/50 rounded-full blur-[120px]" 
      />
      <motion.div 
        animate={{ 
          scale: [1.4, 1, 1.4],
          opacity: [0.15, 0.4, 0.15],
          x: [50, -50, 50],
          y: [30, -30, 30]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-[20%] -right-[10%] w-[90%] h-[90%] bg-purple-200/50 rounded-full blur-[140px]" 
      />
      <motion.div 
        animate={{ 
          opacity: [0, 0.3, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-blue-100/40 rounded-full blur-[100px]" 
      />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
);

const LangSwitcher = ({ lang, setLang }: { lang: Lang, setLang: (l: Lang) => void }) => (
  <div className="fixed top-6 left-6 z-50 flex gap-2">
      {['zh', 'en', 'ja'].map((l) => (
          <button 
            key={l}
            onClick={() => setLang(l as Lang)}
            className={clsx(
                "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-all",
                lang === l ? "bg-gray-900 text-white" : "text-gray-400 hover:text-gray-900 bg-white/50"
            )}
          >
              {l.toUpperCase()}
          </button>
      ))}
  </div>
);

const Input = ({ label, onChange, value, ...props }: any) => (
  <div>
    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
    <input 
      {...props} 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-gray-900 focus:border-gray-900 focus:ring-0 outline-none transition-all" 
    />
  </div>
);

const ModeCard = ({ title, desc, onClick, highlight }: any) => (
  <button
    onClick={onClick}
    className={clsx(
      "p-8 rounded-3xl text-left border transition-all duration-300 group relative overflow-hidden",
      highlight 
        ? "bg-gray-900 text-white border-transparent shadow-2xl hover:-translate-y-1" 
        : "bg-white text-gray-900 border-white shadow-xl hover:-translate-y-1"
    )}
  >
    <div className="relative z-10">
      <h3 className="text-3xl font-light mb-2">{title}</h3>
      <p className={highlight ? "text-gray-400" : "text-gray-500"}>{desc}</p>
    </div>
  </button>
);

const LoadingView = ({ ui }: any) => {
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
    <div className="h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
       {/* Background Effects */}
       <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 to-purple-50/50 opacity-50" />
       
       <motion.div 
         animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }} 
         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-200/20 to-purple-300/20 blur-[100px]" 
       />

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

const HistoryView = ({ history, onSelect, onDelete, setView, ui }: any) => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <header className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => setView('welcome')}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
            aria-label="Back"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-light text-gray-900 font-serif">{ui.result.history_title}</h1>
        </header>

        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {ui.result.no_history}
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item: any) => (
              <div 
                key={item.id}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center group hover:shadow-md transition-all"
              >
                <div>
                  <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock size={10} /> {item.date}
                  </div>
                  <div className="text-xl font-medium text-gray-800">{item.archetype}</div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onSelect(item.data)}
                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    {ui.result.view_report}
                  </button>
                  <button 
                    onClick={() => onDelete(item.id)}
                    className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
