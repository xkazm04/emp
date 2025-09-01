'use client';

import React from 'react';
import { SurveyData } from '@/types/survey';

interface DashboardHeaderProps {
  data: SurveyData;
}

export function DashboardHeader({ data }: DashboardHeaderProps) {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    const change = current - previous;
    const percentage = Math.abs((change / previous) * 100);
    return {
      value: Math.abs(change),
      percentage: percentage.toFixed(1),
      isPositive: change >= 0,
      isZero: change === 0
    };
  };

  const getChangeIcon = (isPositive: boolean, isZero: boolean) => {
    if (isZero) return '●';
    return isPositive ? '▲' : '▼';
  };

  const getChangeColor = (isPositive: boolean, isZero: boolean) => {
    if (isZero) return 'text-slate-400';
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
        {/* Title and Metadata */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">
            {data.metadata?.surveyTitle || 'Employee Survey Report'}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            {data.metadata?.quarter && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                {data.metadata.quarter}
              </span>
            )}
            {data.metadata?.generatedDate && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Generated {formatDate(data.metadata.generatedDate)}
              </span>
            )}
          </div>
        </div>

        {/* Key Statistics */}
        {data.keyMetrics?.topStats && data.keyMetrics.topStats.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {data.keyMetrics.topStats.map((stat, index) => {
              const current = stat.values?.[0];
              const previous = stat.values?.[1];
              const change = current && previous ? calculateChange(current, previous) : null;

              return (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 min-w-[140px] text-center"
                >
                  <div className="text-2xl font-bold mb-1">
                    {current?.toLocaleString()}{stat.unit || ''}
                  </div>
                  <div className="text-xs text-slate-300 uppercase tracking-wide mb-2">
                    {stat.label}
                  </div>
                  {change && !change.isZero && (
                    <div className={`text-xs flex items-center justify-center gap-1 ${getChangeColor(change.isPositive, change.isZero)}`}>
                      <span>{getChangeIcon(change.isPositive, change.isZero)}</span>
                      <span>
                        {change.isPositive ? '+' : ''}{change.value}{stat.unit || ''}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Survey Summary Info */}
      <div className="mt-6 flex flex-wrap gap-6 text-sm text-slate-300">
        {data.metadata?.totalResponses && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{data.metadata.totalResponses.toLocaleString()} Total Responses</span>
          </div>
        )}
        {data.leaders?.length && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            <span>{data.leaders.length} Leadership Analysis</span>
          </div>
        )}
        {data.performanceMetrics?.length && (
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{data.performanceMetrics.length} Performance Metrics</span>
          </div>
        )}
      </div>
    </div>
  );
} 