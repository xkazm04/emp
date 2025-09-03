'use client';

import React from 'react';
import { getPerformanceLevel } from './utils';

interface CircularProgressProps {
  score: number;
  maxScore: number;
  size?: number;
  strokeWidth?: number;
  showChange?: boolean;
  previousScore?: number;
}

export function CircularProgress({ 
  score, 
  maxScore, 
  size = 80, 
  strokeWidth = 6,
  showChange = false,
  previousScore
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = (score / maxScore) * circumference;
  const level = getPerformanceLevel(score, true);
  const change = showChange && previousScore ? score - previousScore : null;

  const strokeColor = {
    high: '#10b981',
    medium: '#f59e0b', 
    low: '#ef4444'
  }[level];

  const indicatorColor = {
    high: 'bg-green-500',
    medium: 'bg-yellow-500',
    low: 'bg-red-500'
  }[level];

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          eSAT Score
        </div>
        <div className="flex items-center gap-2">
          <div className="text-3xl font-bold text-slate-900">
            {score.toFixed(1)}
          </div>
          <div className="text-sm text-slate-500">
            / {maxScore.toFixed(1)}
          </div>
          {change !== null && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ml-2
              ${change > 0 ? 'bg-green-100 text-green-700' :
                change < 0 ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-700'}`}>
              {change > 0 ? '+' : ''}{change.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      <div className="relative" style={{ width: size, height: size }}>
        <svg 
          className="transform -rotate-90" 
          width={size} 
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${indicatorColor}`} />
        </div>
      </div>
    </div>
  );
}