'use client';

import React from 'react';

/**
 * Shared static background with a clean gradient
 */
export const Background = React.memo(({ children, variant = 'light' }: { children: React.ReactNode, variant?: 'light' | 'dark' }) => (
  <div className={`min-h-screen font-sans relative overflow-hidden transition-colors duration-700 ${
    variant === 'dark' 
      ? 'bg-[#020202] bg-gradient-to-br from-[#020202] via-[#0a0a10] to-[#020202] text-white' 
      : 'bg-[#fdfaff] bg-gradient-to-br from-[#fdfaff] via-[#f7f0ff] to-[#f0f4ff] text-slate-900'
  }`}>
    <div className="relative z-10 h-full">{children}</div>
  </div>
));

Background.displayName = 'Background';

/**
 * Background decoration for ResultView
 */
export const BackgroundDecor = React.memo(() => (
  <div className="fixed inset-0 z-0 bg-[#fdfaff] bg-gradient-to-tr from-[#fdfaff] via-[#f9f5ff] to-[#f5faff] pointer-events-none" />
));

BackgroundDecor.displayName = 'BackgroundDecor';
