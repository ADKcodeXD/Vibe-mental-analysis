'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Languages } from 'lucide-react';
import { Locale } from '../../i18n-config';

interface LangSwitcherProps {
  lang: string;
}

const languages = [
  { id: 'zh', label: '简体中文', flag: '🇨🇳' },
  { id: 'en', label: 'English', flag: '🇺🇸' },
  { id: 'ja', label: '日本語', flag: '🇯🇵' }
];

export const LangSwitcher = ({ lang }: LangSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = languages.find(l => l.id === lang) || languages[0];

  const handleLangChange = (l: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = l;
    router.push(segments.join('/'));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/90 rounded-full font-bold text-[10px] text-slate-600 transition-all border border-white/50 shadow-sm backdrop-blur-md uppercase tracking-widest"
      >
        <Languages size={14} className="text-indigo-500" />
        <span className="ml-1 text-sm">{currentLang.flag}</span>
        <span className="hidden sm:inline font-black">{currentLang.id.toUpperCase()}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-[65]" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-2 w-40 bg-white/95 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl overflow-hidden z-[70]"
            >
              <div className="py-2">
                {languages.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => handleLangChange(l.id)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-xs font-medium transition-colors
                      ${lang === l.id ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-50'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </div>
                    {lang === l.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
