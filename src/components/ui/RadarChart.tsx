'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface RadarChartPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarChartPoint[];
  size?: number;
}

/**
 * Custom SVG-based Radar Chart (Spider Chart) with premium aesthetics
 */
export const RadarChart = ({ data, size = 280 }: RadarChartProps) => {
  const center = size / 2;
  const radius = (size / 2) * 0.7; 
  const points_count = data.length;
  const angleStep = (Math.PI * 2) / points_count;

  // Calculate coordinates for a point given index and value (clamped to 100)
  const getCoords = (index: number, val: number, dist_offset = 1) => {
    const clampedVal = Math.max(0, Math.min(100, val));
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * (clampedVal / 100) * Math.cos(angle) * dist_offset;
    const y = center + radius * (clampedVal / 100) * Math.sin(angle) * dist_offset;
    return { x, y };
  };

  const webLevels = [25, 50, 75, 100];
  const webs = webLevels.map((level) => {
    const points = Array.from({ length: points_count }, (_, i) => {
        const { x, y } = getCoords(i, level);
        return `${x},${y}`;
    }).join(' ');
    return points;
  });

  const axes = Array.from({ length: points_count }, (_, i) => {
    const { x, y } = getCoords(i, 100);
    return { x, y };
  });

  const dataPoints = data.map((d, i) => {
    const { x, y } = getCoords(i, d.value);
    return `${x},${y}`;
  }).join(' ');

  const chartId = React.useId().replace(/:/g, '');

  return (
    <div className="flex justify-center items-center w-full overflow-visible py-4">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id={`grad-${chartId}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.4)" />
            <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
          </radialGradient>
          <filter id={`glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Webs */}
        {webs.map((points, i) => (
          <polygon
            key={i}
            points={points}
            className="fill-none stroke-purple-100/40 stroke-[0.5]"
          />
        ))}

        {/* Axes */}
        {axes.map((ax, i) => (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={ax.x}
            y2={ax.y}
            className="stroke-purple-100/40 stroke-[0.5]"
          />
        ))}

        {/* Data Polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          points={dataPoints}
          style={{ transformOrigin: `${center}px ${center}px`, filter: `url(#glow-${chartId})` }}
          fill={`url(#grad-${chartId})`}
          className="stroke-purple-500 stroke-2"
        />

        {/* Data Points (Dots) */}
        {data.map((d, i) => {
           const { x, y } = getCoords(i, d.value);
           return (
             <motion.circle 
               key={i}
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 1 + i * 0.1 }}
               cx={x} cy={y} r="3" 
               className="fill-white stroke-purple-600 stroke-1" 
             />
           );
        })}

        {/* Labels */}
        {data.map((d, i) => {
          const { x, y } = getCoords(i, 100, 1.3);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              className="text-[10px] font-bold fill-slate-400 uppercase tracking-tighter"
            >
              <tspan x={x} dy="0">{d.label.split(' ')[0]}</tspan>
              <tspan x={x} dy="10">{d.label.split(' ').slice(1).join(' ')}</tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
};
