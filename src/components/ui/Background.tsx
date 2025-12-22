'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Shared animated background component with gradient orbs
 */
export const Background = React.memo(({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden transition-colors duration-500">
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
       {/* Optimized Gradients using CSS radial-gradient instead of filter: blur */}
      <motion.div 
        animate={{ 
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.2, 1],
          x: [-20, 20, -20],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-[20%] -left-[20%] w-[80%] h-[80%] rounded-full will-change-transform"
        style={{ background: 'radial-gradient(circle, rgba(199,210,254,0.4) 0%, rgba(255,255,255,0) 70%)' }}
      />
      <motion.div 
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [1.2, 1, 1.2],
          x: [20, -20, 20],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-[20%] -right-[20%] w-[90%] h-[90%] rounded-full will-change-transform"
        style={{ background: 'radial-gradient(circle, rgba(233,213,255,0.4) 0%, rgba(255,255,255,0) 70%)' }} 
      />
      <motion.div 
        animate={{ 
          opacity: [0, 0.4, 0],
          y: [0, -40, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        className="absolute bottom-[-10%] left-[20%] w-[60%] h-[60%] rounded-full" 
        style={{ background: 'radial-gradient(circle, rgba(219,234,254,0.4) 0%, rgba(255,255,255,0) 70%)' }}
      />
    </div>
    <div className="relative z-10">{children}</div>
  </div>
));

Background.displayName = 'Background';

/**
 * Background decoration for ResultView with different color scheme
 */
export const BackgroundDecor = React.memo(() => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#fdfaff]">
    <motion.div 
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.2, 1],
        x: [-50, 50, -50],
        y: [-30, 30, -30]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full will-change-transform" 
      style={{ background: 'radial-gradient(circle, rgba(199,210,254,0.3) 0%, rgba(255,255,255,0) 70%)' }}
    />
    <motion.div 
      animate={{ 
        opacity: [0.3, 0.6, 0.3],
        scale: [1.2, 1, 1.2],
        x: [50, -50, 50],
        y: [30, -30, 30]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="absolute -bottom-[20%] -right-[10%] w-[90%] h-[90%] rounded-full will-change-transform" 
      style={{ background: 'radial-gradient(circle, rgba(233,213,255,0.3) 0%, rgba(255,255,255,0) 70%)' }}
    />
  </div>
));

BackgroundDecor.displayName = 'BackgroundDecor';
