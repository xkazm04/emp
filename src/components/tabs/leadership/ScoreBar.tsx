'use client';

import React from 'react';
import { getPerformanceLevel, getBarColor } from './utils';

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'compact' | 'prominent';
}

export function ScoreBar({ 
  score, 
  showLabel = true, 
  size = 'md',
  className = '',
  variant = 'compact'
}: ScoreBarProps) {
  const sizeClasses = {
    sm: variant === 'prominent' ? 'w-20 h-2' : 'w-16 h-1.5',
    md: variant === 'prominent' ? 'w-24 h-3' : 'w-20 h-2',
    lg: variant === 'prominent' ? 'w-32 h-4' : 'w-24 h-3'
  };

  const textSizeClasses = {
    sm: variant === 'prominent' ? 'text-sm font-bold' : 'text-xs',
    md: variant === 'prominent' ? 'text-base font-bold' : 'text-sm',
    lg: variant === 'prominent' ? 'text-lg font-bold' : 'text-base'
  };

  const level = getPerformanceLevel(score);
  const levelColors = {
    high: variant === 'prominent' ? 'text-green-700' : 'text-slate-600',
    medium: variant === 'prominent' ? 'text-amber-700' : 'text-slate-600', 
    low: variant === 'prominent' ? 'text-red-700' : 'text-slate-600'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={sizeClasses[size]}>
        {showLabel && (
          <div className={`flex items-center justify-center mb-2 ${textSizeClasses[size]}`}>
            <span className={levelColors[level]}>
              {Math.round(score)}%
            </span>
          </div>
        )}
        <div className="w-full bg-slate-200 rounded-full h-full shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 shadow-sm ${getBarColor(getPerformanceLevel(score))}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}