'use client';

import React from 'react';
import clsx from 'clsx';

type Lang = 'zh' | 'en' | 'ja';

interface LangSwitcherProps {
  lang: Lang;
  setLang: (l: Lang) => void;
}

/**
 * Language switcher component for multi-language support
 */
export const LangSwitcher = ({ lang, setLang }: LangSwitcherProps) => (
  <div className="fixed top-6 left-6 z-50 flex gap-2">
    {(['zh', 'en', 'ja'] as const).map((l) => (
      <button 
        key={l}
        onClick={() => setLang(l)}
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
