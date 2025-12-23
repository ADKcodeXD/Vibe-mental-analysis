'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDictionary } from '../../../lib/get-dictionary';
import { Locale } from '../../../i18n-config';
import { SettingsView } from '../../../components/views';
import { Background } from '../../../components/ui';

export default function SettingsPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as Locale;
  
  const [config, setConfig] = useState({ apiKey: '', baseUrl: '', model: '' });
  const [dictionary, setDictionary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const dict = await getDictionary(lang);
      setDictionary(dict);

      // Load Config
      const savedConfig = localStorage.getItem('holo_config');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Failed to load config:", e);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [lang]);

  const saveConfig = (newConfig: any) => {
    localStorage.setItem('holo_config', JSON.stringify(newConfig));
    router.push(`/${lang}/home`);
  };

  if (loading || !dictionary) return null;

  return (
    <Background>
      <div className="relative z-10">
        <SettingsView 
          config={config}
          setConfig={setConfig}
          onSave={saveConfig}
          onBack={() => router.push(`/${lang}/`)}
          ui={dictionary}
        />
      </div>
    </Background>
  );
}
