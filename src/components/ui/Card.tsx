'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * Reusable card component with consistent styling
 */
export const Card = ({ title, icon, children, className }: CardProps) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={clsx(
      "bg-white p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-purple-50/50 hover:shadow-md transition-all duration-300",
      className
    )}
  >
    <div className="flex items-center gap-3 mb-4 md:mb-5 border-b border-purple-50 pb-3">
      <div className="p-1.5 bg-purple-50 rounded-lg">{icon}</div>
      <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{title}</span>
    </div>
    {children}
  </motion.div>
);

interface ModeCardProps {
  title: string;
  desc: string;
  onClick: () => void;
  highlight?: boolean;
}

/**
 * Mode selection card for questionnaire mode selection
 */
export const ModeCard = ({ title, desc, onClick, highlight }: ModeCardProps) => (
  <button
    onClick={onClick}
    className={clsx(
      "p-8 rounded-3xl text-left border transition-all duration-300 group relative overflow-hidden",
      highlight 
        ? "bg-gray-900 text-white border-transparent shadow-2xl hover:-translate-y-1" 
        : "bg-white text-gray-900 border-white shadow-xl hover:-translate-y-1"
    )}
  >
    <div className="relative z-10">
      <h3 className="text-3xl font-light mb-2">{title}</h3>
      <p className={highlight ? "text-gray-400" : "text-gray-500"}>{desc}</p>
    </div>
  </button>
);
