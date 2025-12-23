import { getDictionary } from '../../../lib/get-dictionary';
import { getAssessmentRegistry } from '../../../lib/get-questions';
import { Locale } from '../../../i18n-config';
import { Background, LangSwitcher } from '../../../components/ui';
import Link from 'next/link';
import { Brain, ArrowRight, Clock, Settings, Sparkles } from 'lucide-react';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);
  const registry = await getAssessmentRegistry();

  const t = (key: string) => {
    if (lang === 'zh') {
        if (key === 'hero_title') return '探索深度自我';
        if (key === 'hero_subtitle') return '基于尖端 AI 的心理动力学与人格分析系统，为您揭秘潜意识的深层结构。';
        if (key === 'start_journey') return '开启探索之旅';
    } else if (lang === 'ja') {
        if (key === 'hero_title') return '深層の自己を探索';
        if (key === 'hero_subtitle') return '最先端AIに基づく心理力学と人格分析システムで、潜在意識の深層構造を明らかにします。';
        if (key === 'start_journey') return '探索の旅を始める';
    }
    if (key === 'hero_title') return 'Explore Your Inner Depth';
    if (key === 'hero_subtitle') return 'Advanced AI-driven psychodynamic & personality analysis to reveal the hidden structures of your subconscious.';
    if (key === 'start_journey') return 'Start Journey';
    return key;
  }

  return (
    <Background>
      <div className="min-h-screen flex flex-col relative z-10 selection:bg-indigo-100 selection:text-indigo-900">
        
        {/* Navigation Header */}
        <nav className="fixed top-0 left-0 w-full p-6 flex justify-between items-center bg-white/20 backdrop-blur-md z-50 border-b border-indigo-500/10">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-sm">
                <Brain size={24} className="text-indigo-600" />
             </div>
             <span className="text-slate-900 font-serif tracking-tighter text-lg md:text-xl font-bold whitespace-nowrap">
                MENTAL HELP <span className="text-indigo-600 opacity-40">//</span> <span className="text-slate-400 font-light">AI AGENT</span>
             </span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <LangSwitcher lang={lang} />
            
            <div className="h-4 w-[1px] bg-slate-200 hidden md:block" />

            <Link 
              href={`/${lang}/history`} 
              className="p-2.5 rounded-full bg-white/60 hover:bg-white border border-slate-200 shadow-sm transition-all text-slate-500 hover:text-indigo-600 group flex items-center gap-2"
              title={dictionary.result.history_title}
            >
              <Clock size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest overflow-hidden w-0 md:group-hover:w-16 transition-all duration-500 whitespace-nowrap">{dictionary.result.history_title}</span>
            </Link>

            <Link 
              href={`/${lang}/settings`} 
              className="p-2.5 rounded-full bg-white/60 hover:bg-white border border-slate-200 shadow-sm transition-all text-slate-500 hover:text-indigo-600"
              title={dictionary.settings.title}
            >
              <Settings size={20} />
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="flex-grow flex flex-col items-center justify-center p-6 pt-32 pb-20">
          <div className="max-w-5xl w-full text-center">
            <header className="mb-16 md:mb-24 relative">
              <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 text-[10px] font-bold uppercase tracking-[0.2em] mb-8">
                <Sparkles size={10} /> v1.7.2 Final Edition
              </div>

              <h1 className="text-6xl md:text-8xl font-serif font-black text-slate-900 mb-8 tracking-tight leading-[0.95] md:leading-[1.1]">
                {t('hero_title')}
              </h1>
              
              <div className="w-24 h-[1px] bg-indigo-600/20 mx-auto mb-10" />

              <p className="text-lg md:text-2xl text-slate-500 font-light max-w-2xl mx-auto leading-relaxed font-serif">
                {t('hero_subtitle')}
              </p>
            </header>

            {/* Assessment Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-1 max-w-3xl mx-auto">
              {registry.assessments.map((test: any) => (
                <Link 
                  key={test.id}
                  href={`/${lang}${test.path}`}
                  className="group relative bg-white/40 hover:bg-white border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(99,102,241,0.08)] rounded-[2.5rem] p-8 md:p-10 transition-all duration-700 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 h-full overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-all duration-700 shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
                      <Brain size={48} strokeWidth={1} />
                    </div>
                    <div>
                        <div className="inline-block px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-[9px] font-bold text-indigo-500/60 uppercase tracking-[0.2em] mb-4">
                            Global Assessment
                        </div>
                      <h3 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 mb-3 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {test.title[lang]}
                      </h3>
                      <p className="text-slate-500 font-light text-base md:text-lg font-serif leading-relaxed max-w-md">
                        {test.description[lang]}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center transition-all duration-500 group-hover:bg-indigo-600 group-hover:scale-110 shadow-xl shadow-slate-900/10 group-hover:shadow-indigo-500/20">
                        <ArrowRight size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] group-hover:text-indigo-600 transition-colors">
                        {t('start_journey')}
                    </span>
                  </div>

                  {/* Decorative background element for the card */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/[0.03] blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-10" />
                </Link>
              ))}
            </div>

          </div>
        </div>

        {/* Footer Details */}
        <footer className="p-12 text-center text-[10px] font-mono uppercase tracking-[0.4em] text-slate-300 border-t border-slate-100">
            Distributed Cog-System // Neural Node 0-82 // 2024
        </footer>
      </div>
    </Background>
  );
}
