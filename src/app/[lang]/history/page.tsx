'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDictionary } from '../../../lib/get-dictionary';
import { getAssessmentRegistry } from '../../../lib/get-questions';
import { Locale } from '../../../i18n-config';
import { Background } from '../../../components/ui';
import { HistoryView } from '../../../components/views';
import { ArrowLeft, Brain } from 'lucide-react';
import Link from 'next/link';

export default function HistoryPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as Locale;
  
  const [historyRegistry, setHistoryRegistry] = useState<any[]>([]);
  const [dictionary, setDictionary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const dict = await getDictionary(lang);
      const registry = await getAssessmentRegistry();
      setDictionary(dict);

      // Aggregate history from all assessments
      const allHistory: any[] = [];
      registry.assessments.forEach((test: any) => {
        const savedHistory = localStorage.getItem(`holo_history_${test.id}`);
        if (savedHistory) {
          try {
            const h = JSON.parse(savedHistory);
            h.forEach((entry: any) => {
              allHistory.push({
                ...entry,
                testId: test.id,
                testTitle: test.title[lang]
              });
            });
          } catch (e) {}
        }
      });

      // Sort by date (descending)
      allHistory.sort((a, b) => b.id - a.id);
      setHistoryRegistry(allHistory);
      setLoading(false);
    }
    loadData();
  }, [lang]);

  if (loading || !dictionary) return null;

  return (
    <Background>
      <div className="min-h-screen p-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <header className="flex items-center gap-4 mb-12">
            <button 
              onClick={() => router.push(`/${lang}/`)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors text-white/50 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-4xl font-light text-white font-serif">{dictionary.result.history_title}</h1>
          </header>

          {historyRegistry.length === 0 ? (
            <div className="text-center py-20 text-white/40 font-light">
              {dictionary.result.no_history}
            </div>
          ) : (
            <div className="space-y-4">
              {historyRegistry.map((item) => (
                <div 
                  key={`${item.testId}-${item.id}`}
                  className="bg-white/5 p-6 rounded-3xl border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-all backdrop-blur-sm"
                >
                  <div>
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                       <Brain size={12} /> {item.testTitle}
                    </div>
                    <div className="text-xl font-medium text-white mb-1">{item.archetype}</div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider">{item.date}</div>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      href={`/${lang}/survey/${item.testId}/result?id=${item.id}`}
                      className="bg-indigo-500 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-600 transition-colors"
                    >
                      {dictionary.result.view_report}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Background>
  );
}
