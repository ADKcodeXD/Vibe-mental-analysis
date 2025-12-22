'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ScoreBarProps {
  label: string;
  value: number;
  color?: string;
}

/**
 * Animated score bar for displaying stats
 */
export const ScoreBar = ({ label, value, color = "bg-slate-900" }: ScoreBarProps) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
      <span>{label}</span>
      <span>{value}/100</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, delay: 0.5 }}
        className={`h-full ${color}`}
      />
    </div>
  </div>
);

interface DimensionBarProps {
  value: number;
  axisLabel: string;
  leftLabel: string;
  rightLabel: string;
}

/**
 * Dimension bar for political compass / spectrum visualization
 */
export const DimensionBar = ({ value, axisLabel, leftLabel, rightLabel }: DimensionBarProps) => (
  <div className="mb-4">
    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-1">
      <span>{leftLabel}</span>
      <span className="text-slate-600">{axisLabel}</span>
      <span>{rightLabel}</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
      <div 
        className="absolute top-0 bottom-0 w-2 bg-slate-800 rounded-full -ml-1 transition-all duration-1000"
        style={{ left: `${value}%` }} 
      />
      <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-300 -ml-px" />
    </div>
    <div className="text-center mt-1 text-[10px] text-slate-500 font-medium">
      {value}% {value > 50 ? rightLabel : leftLabel}
    </div>
  </div>
);
