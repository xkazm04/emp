'use client';

import React from 'react';
import { getPerformanceLevel, getBarColor } from './utils';

interface ScoreBarProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreBar({ 
  score, 
  showLabel = true, 
  size = 'md',
  className = '' 
}: ScoreBarProps) {
  const sizeClasses = {
    sm: 'w-16 h-1.5',
    md: 'w-20 h-2',
    lg: 'w-24 h-3'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={sizeClasses[size]}>
        {showLabel && (
          <div className={`flex items-center justify-between mb-1 ${textSizeClasses[size]}`}>
            <span className="text-slate-600">{Math.round(score)}%</span>
          </div>
        )}
        <div className="w-full bg-slate-200 rounded-full h-full">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getBarColor(getPerformanceLevel(score))}`}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}