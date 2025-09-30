'use client';

import React from 'react';

interface StatisticsCardProps {
  value: number;
  change?: number | null;
  level: 'high' | 'medium' | 'low';
  type?: 'overall' | 'topPerformers' | 'gap';
}

export function StatisticsCard({ value, change, level, type = 'overall' }: StatisticsCardProps) {
  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-700 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'low': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getGapColor = (gap: number) => {
    if (gap > 20) return 'text-red-700 bg-red-50 border-red-200';
    if (gap > 10) return 'text-amber-700 bg-amber-50 border-amber-200'; 
    if (gap > 0) return 'text-green-700 bg-green-50 border-green-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}pp`;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return '▲';
    if (change < 0) return '▼';
    return '●';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-slate-400';
  };

  const colorClass = type === 'gap' ? getGapColor(value) : getPerformanceColor(level);

  return (
    <div className="space-y-2">
      <div className={`inline-flex items-center justify-center px-4 py-3 rounded-lg border-2 font-bold text-lg min-w-[80px] ${colorClass}`}>
        {type === 'gap' ? (
          <>
            {value > 0 ? '+' : ''}{value.toFixed(1)}pp
          </>
        ) : (
          `${Math.round(value)}%`
        )}
      </div>
      {change !== null && change !== undefined && (
        <div className={`flex items-center justify-center gap-1 text-sm font-medium ${getChangeColor(change)}`}>
          <span className="text-xs">{getChangeIcon(change)}</span>
          <span>{formatChange(change)}</span>
        </div>
      )}
    </div>
  );
}