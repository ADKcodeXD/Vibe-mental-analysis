'use client';

import SurveyEngine from '../../../../components/engine/SurveyEngine';
import { Background } from '../../../../components/ui';
import { getDictionary } from '../../../../lib/get-dictionary';
import { getQuestions } from '../../../../lib/get-questions';
import { Locale } from '../../../../i18n-config';
import { notFound, useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SurveyPage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as Locale;
  const testId = params.testId as string;

  const [dictionary, setDictionary] = useState<any>(null);
  const [questions, setQuestions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const dict = await getDictionary(lang);
      const q = await getQuestions(testId, lang);
      setDictionary(dict);
      setQuestions(q);
      setLoading(false);
    }
    loadData();
  }, [lang, testId]);

  if (loading) return null; // Or a loading spinner
  if (!questions) notFound();

  return (
    <Background>
      <div className="relative z-10">
        <SurveyEngine 
          lang={lang} 
          dictionary={dictionary} 
          questions={questions} 
          testId={testId}
          onComplete={(res) => {
            router.push(`/${lang}/survey/${testId}/result?id=${res.historyId}`);
          }}
        />
      </div>
    </Background>
  );
}
