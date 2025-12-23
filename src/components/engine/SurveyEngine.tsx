'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Clock } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '../../i18n-config';

// Import extracted components
import { Background, LangSwitcher } from '../ui';
import { LoadingView, SettingsView, WelcomeView, ModeSelectView, QuestionnaireView, HistoryView } from '../views';

interface LocalizedText {
  zh: string;
  en: string;
  ja: string;
}

interface Question {
  id: string;
  type: string;
  text: LocalizedText;
  options?: LocalizedText[];
  leftLabel?: LocalizedText;
  rightLabel?: LocalizedText;
}

interface Config {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface SurveyEngineProps {
  lang: Locale;
  dictionary: any;
  questions: any;
  testId: string;
  onComplete?: (result: any) => void;
}

export default function SurveyEngine({ lang, dictionary: ui, questions, testId, onComplete }: SurveyEngineProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [view, setView] = useState<'welcome' | 'settings' | 'mode_select' | 'questionnaire' | 'history'>('welcome');
  const [mode, setMode] = useState<'lite' | 'standard' | 'full' | null>(null);
  const [config, setConfig] = useState<Config>({ apiKey: '', baseUrl: '', model: '' });
  const [history, setHistory] = useState<any[]>([]);
  const [hasSession, setHasSession] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    // Load History
    const savedHistory = localStorage.getItem(`holo_history_${testId}`);
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }

    // Load Config
    const savedConfig = localStorage.getItem('holo_config');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to load config:", e);
      }
    }

    // Check for existing session
    const savedSession = localStorage.getItem(`holo_session_${testId}`);
    if (savedSession) {
      setHasSession(true);
    }
  }, [testId]);

  const saveToHistory = (data: any, currentMode: string | null, modelName: string) => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toLocaleString(lang === 'zh' ? 'zh-CN' : (lang === 'ja' ? 'ja-JP' : 'en-US')),
      archetype: data.identity_card?.archetype || 'Unknown',
      mode: currentMode,
      modelName: modelName,
      data: data
    };
    const updated = [newEntry, ...history];
    setHistory(updated);
    localStorage.setItem(`holo_history_${testId}`, JSON.stringify(updated));
    return newEntry;
  };

  const deleteHistory = (id: number) => {
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem(`holo_history_${testId}`, JSON.stringify(updated));
  };

  // Translation Helper
  const t = (key: string | LocalizedText, section: string = '') => {
    if (typeof key === 'object') return key[lang] || key['zh'] || '';
    if (section && ui[section]?.[key]) return ui[section][key];
    return key;
  };

  const allQuestions = useMemo(() => {
    if (!mode) return [];
    const selectedScheme = questions.schemes[mode];
    if (!selectedScheme) return [];

    const baseSections = selectedScheme.sections;
    const finalSectionIds = Array.from(new Set([...baseSections, ...(mode === 'full' ? selectedModules : [])]));

    const sectionsObj = finalSectionIds.map((secId: string) =>
      questions.sections.find((s: any) => s.id === secId)
    ).filter(Boolean);

    const flattened: { q: Question, section: LocalizedText }[] = [];
    sectionsObj.forEach((sec: any) => {
      sec.questions.forEach((q: any) => flattened.push({ q, section: sec.title }));
    });
    return flattened;
  }, [mode, questions, selectedModules]);

  const saveConfig = (newConfig: Config) => {
    setConfig(newConfig);
    localStorage.setItem('holo_config', JSON.stringify(newConfig));
    setView('welcome');
  };

  const setLanguage = (l: Locale) => {
    const segments = pathname.split('/');
    segments[1] = l;
    router.push(segments.join('/'));
  }

  const handleAnswer = (val: string) => {
    const newAnswers = { ...answers, [allQuestions[currentIndex].q.id]: val };
    setAnswers(newAnswers);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(`holo_session_${testId}`, JSON.stringify({
        answers: newAnswers,
        currentIndex,
        mode,
        selectedModules,
        lang
      }));
    }, 1000);

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
    try {
      const payload = {
        answers: Object.entries(answers).map(([id, value]) => ({ questionId: id, value })),
        config: (config.apiKey || config.baseUrl || config.model) ? {
          apiKey: config.apiKey?.trim() || undefined,
          baseUrl: config.baseUrl?.trim() || undefined,
          model: config.model?.trim() || undefined
        } : undefined,
        lang
      };

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      const historyEntry = saveToHistory(data, mode, config.model || 'System AI');
      localStorage.removeItem(`holo_session_${testId}`);
      
      if (onComplete) {
        onComplete({ ...data, historyId: historyEntry.id, mode });
      }
    } catch (e: any) {
      console.error("ANALysis FAILED:", e);
      const errorMsg = e.message || (lang === 'zh' ? '分析失败，请检查配置和网络' : (lang === 'ja' ? '解析に失敗しました。設定とネットワークを確認してください' : 'Analysis failed. Please check config and network.'));
      alert(errorMsg);
      setView('welcome');
    } finally {
      setLoading(false);
    }
  };

  const resumeSession = () => {
    const session = localStorage.getItem(`holo_session_${testId}`);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setAnswers(parsed.answers || {});
        setCurrentIndex(parsed.currentIndex || 0);
        setMode(parsed.mode || null);
        if (parsed.selectedModules) setSelectedModules(parsed.selectedModules);
        if (parsed.lang && parsed.lang !== lang) setLanguage(parsed.lang);
        setView('questionnaire');
      } catch (e) {
        console.error("Resume failed:", e);
      }
    }
  };

  const startNewSession = () => {
    localStorage.removeItem(`holo_session_${testId}`);
    setAnswers({});
    setCurrentIndex(0);
    setMode(null);
    setView('mode_select');
  };

  const handleModeSelect = (selectedMode: string) => {
    setMode(selectedMode as any);
    setView('questionnaire');
  };

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  if (view === 'history') {
    return (
      <HistoryView
        history={history}
        onSelect={(item: any) => { 
            if (onComplete) onComplete({ ...item.data, historyId: item.id, fromHistory: true });
        }}
        onDelete={deleteHistory}
        setView={setView as (v: string) => void}
        ui={ui}
      />
    );
  }

  if (view === 'settings') {
    return (
      <SettingsView
        config={config}
        setConfig={setConfig}
        onSave={saveConfig}
        onBack={() => setView('welcome')}
        ui={ui}
      />
    );
  }

  return (
    <Background>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50"
          >
            <LoadingView ui={ui} />
          </motion.div>
        )}

        {!loading && (view === 'welcome') && (
          <div key="lang-switcher" className="fixed top-6 left-6 z-[60]">
             <LangSwitcher lang={lang} />
          </div>
        )}

        {!loading && (view === 'welcome' || view === 'mode_select' || view === 'questionnaire') && (
          <div key="top-nav" className="fixed top-6 right-6 z-[60] flex items-center gap-3">
             {history.length > 0 && (
               <button
                 onClick={() => setView('history')}
                 className="p-3 bg-white/60 hover:bg-white/90 rounded-full border border-white/50 shadow-sm backdrop-blur-md transition-all text-slate-500 hover:text-slate-900 group flex items-center gap-2"
               >
                 <Clock size={18} />
                 <span className="text-[10px] font-bold uppercase tracking-widest overflow-hidden w-0 group-hover:w-16 transition-all duration-300 whitespace-nowrap">{ui.result.history_title}</span>
               </button>
             )}
             <button
               onClick={() => setView('settings')}
               className="p-3 bg-white/60 hover:bg-white/90 rounded-full border border-white/50 shadow-sm backdrop-blur-md transition-all text-slate-400 hover:text-slate-900"
             >
               <Settings size={20} />
             </button>
          </div>
        )}

        {!loading && view === 'welcome' && (
          <WelcomeView
            key="welcome-view"
            ui={ui}
            config={config}
            hasSession={hasSession}
            lang={lang}
            setLanguage={setLanguage}
            onResume={resumeSession}
            onStart={startNewSession}
            onOpenSettings={() => setView('settings')}
          />
        )}

        {!loading && view === 'mode_select' && (
          <ModeSelectView
            key="mode-select-view"
            ui={ui}
            lang={lang}
            questions={questions}
            selectedModules={selectedModules}
            onModeSelect={handleModeSelect}
            onToggleModule={toggleModule}
            onBack={() => setView('welcome')}
          />
        )}

        {!loading && view === 'questionnaire' && (
          <QuestionnaireView
            key="questionnaire-view"
            ui={ui}
            currentIndex={currentIndex}
            allQuestions={allQuestions}
            answers={answers}
            lang={lang}
            t={t}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
            onPrev={prevQuestion}
            onJump={jumpTo}
          />
        )}
      </AnimatePresence>
    </Background>
  );
}
