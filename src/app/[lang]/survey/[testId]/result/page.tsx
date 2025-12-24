'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { getDictionary } from '../../../../../lib/get-dictionary';
import { Locale } from '../../../../../i18n-config';
import { IdentityMirrorResult } from '../../../../../components/results/IdentityMirrorResult';
import { Background } from '../../../../../components/ui';
import { LoadingView } from '../../../../../components/views';

export default function ResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const lang = params.lang as Locale;
  const testId = params.testId as string;
  const historyId = searchParams.get('id');
  
  const [data, setData] = useState<any>(null);
  const [mode, setMode] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string | null>(null);
  const [dictionary, setDictionary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load dictionary
      const dict = await getDictionary(lang);
      setDictionary(dict);

      // Load result from localStorage
      const savedHistory = localStorage.getItem(`holo_history_${testId}`);
      if (savedHistory && historyId) {
        try {
          const history = JSON.parse(savedHistory);
          const entry = history.find((h: any) => h.id.toString() === historyId);
          console.log(entry);
          if (entry) {
            setData(entry.data);
            setMode(entry.mode);
            setModelName(entry.modelName);
          }
        } catch (e) {
          console.error("Failed to load result data", e);
        }
      }
      // Small buffer for smoother transition
      await new Promise(resolve => setTimeout(resolve, 800));
      setLoading(false);
    }
    loadData();
  }, [lang, testId, historyId]);

  if (loading || !dictionary) {
    return (
      <Background>
        <LoadingView ui={dictionary || { engine: { processing_label: "Loading..." } }} />
      </Background>
    );
  }

  if (!data) {
    return (
      <Background>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white text-center">
          <h2 className="text-2xl font-light mb-4 text-white/60">Result not found</h2>
          <button 
            onClick={() => router.push(`/${lang}/survey/${testId}`)}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 transition-all"
          >
            Go Back
          </button>
        </div>
      </Background>
    );
  }

  // Registry of result components
  // In a real app, this could be dynamic
  if (testId === 'identity-mirror') {
    return (
      <IdentityMirrorResult 
        data={data} 
        lang={lang} 
        mode={mode as any}
        modelName={modelName || ''}
        dictionary={dictionary} 
        onBack={() => router.push(`/${lang}`)}
        onRetest={() => router.push(`/${lang}/survey/${testId}`)}
      />
    );
  }

  return (
    <Background>
      <div className="min-h-screen flex items-center justify-center text-white">
        Unsupported Assessment Result
      </div>
    </Background>
  );
}
