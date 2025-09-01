'use client';

import React from 'react';
import { SurveyData } from '@/types/survey';

interface StatisticsTabProps {
  data: SurveyData;
}

export function StatisticsTab({ data }: StatisticsTabProps) {
  const getPerformanceLevel = (value: number) => {
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    return 'low';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-700 bg-green-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'low': return 'text-red-700 bg-red-50';
      default: return 'text-slate-700 bg-slate-50';
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
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

  if (!data.performanceMetrics || data.performanceMetrics.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No performance metrics available</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a file with performance metrics to see the statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Performance Statistics</h2>
        <div className="text-sm text-slate-500">
          Comparing overall vs. top performer metrics
        </div>
      </div>

      {/* Performance Metrics Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left  font-medium text-slate-500 uppercase tracking-wider w-1/2">
                  Performance Metric
                </th>
                <th className="px-6 py-4 text-center  font-medium text-slate-500 uppercase tracking-wider">
                  Overall
                </th>
                <th className="px-6 py-4 text-center  font-medium text-slate-500 uppercase tracking-wider">
                  Top Performers
                </th>
                <th className="px-6 py-4 text-center  font-medium text-slate-500 uppercase tracking-wider">
                  Gap
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.performanceMetrics.map((metric, index) => {
                const overallCurrent = metric.overall?.values?.[0];
                const overallPrevious = metric.overall?.values?.[1];
                const topPerformersCurrent = metric.topPerformers?.values?.[0];
                const topPerformersPrevious = metric.topPerformers?.values?.[1];
                
                const overallChange = overallCurrent && overallPrevious 
                  ? calculateChange(overallCurrent, overallPrevious) 
                  : null;
                
                const topPerformersChange = topPerformersCurrent && topPerformersPrevious 
                  ? calculateChange(topPerformersCurrent, topPerformersPrevious) 
                  : null;

                const gap = overallCurrent && topPerformersCurrent 
                  ? topPerformersCurrent - overallCurrent 
                  : null;

                const overallLevel = overallCurrent ? getPerformanceLevel(overallCurrent) : 'medium';
                const topPerformersLevel = topPerformersCurrent ? getPerformanceLevel(topPerformersCurrent) : 'medium';

                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{metric.metricName}</div>
                    </td>
                    
                    {/* Overall Column */}
                    <td className="px-6 py-4 text-center">
                      {overallCurrent ? (
                        <div className="space-y-1">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(overallLevel)}`}>
                            {Math.round(overallCurrent)}%
                          </div>
                          {overallChange !== null && (
                            <div className={` flex items-center justify-center gap-1 ${getChangeColor(overallChange)}`}>
                              <span>{getChangeIcon(overallChange)}</span>
                              <span>{formatChange(overallChange)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Top Performers Column */}
                    <td className="px-6 py-4 text-center">
                      {topPerformersCurrent ? (
                        <div className="space-y-1">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(topPerformersLevel)}`}>
                            {Math.round(topPerformersCurrent)}%
                          </div>
                          {topPerformersChange !== null && (
                            <div className={` flex items-center justify-center gap-1 ${getChangeColor(topPerformersChange)}`}>
                              <span>{getChangeIcon(topPerformersChange)}</span>
                              <span>{formatChange(topPerformersChange)}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Gap Column */}
                    <td className="px-6 py-4 text-center">
                      {gap !== null ? (
                        <div className={`inline-flex items-center px-2 py-1 rounded  font-medium
                          ${gap > 20 ? 'bg-red-100 text-red-700' : 
                            gap > 10 ? 'bg-yellow-100 text-yellow-700' : 
                            gap > 0 ? 'bg-green-100 text-green-700' : 
                            'bg-slate-100 text-slate-700'}`}>
                          {gap > 0 ? '+' : ''}{gap.toFixed(1)}pp
                        </div>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Highest Performing Metric */}
        {(() => {
          const highestMetric = data.performanceMetrics
            .filter(m => m.overall?.values?.[0])
            .sort((a, b) => (b.overall?.values?.[0] || 0) - (a.overall?.values?.[0] || 0))[0];
          
          if (!highestMetric) return null;
          
          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-green-800">Top Performer</h3>
              </div>
              <p className="text-sm text-green-700 font-medium">{highestMetric.metricName}</p>
              <p className="text-2xl font-bold text-green-800">{Math.round(highestMetric.overall?.values?.[0] || 0)}%</p>
            </div>
          );
        })()}

        {/* Lowest Performing Metric */}
        {(() => {
          const lowestMetric = data.performanceMetrics
            .filter(m => m.overall?.values?.[0])
            .sort((a, b) => (a.overall?.values?.[0] || 0) - (b.overall?.values?.[0] || 0))[0];
          
          if (!lowestMetric) return null;
          
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <h3 className="font-semibold text-red-800">Needs Attention</h3>
              </div>
              <p className="text-sm text-red-700 font-medium">{lowestMetric.metricName}</p>
              <p className="text-2xl font-bold text-red-800">{Math.round(lowestMetric.overall?.values?.[0] || 0)}%</p>
            </div>
          );
        })()}

        {/* Average Performance */}
        {(() => {
                     const validMetrics = data.performanceMetrics.filter(m => m.overall?.values?.[0]);
           if (validMetrics.length === 0) return null;
           
           const average = validMetrics.reduce((sum, m) => sum + (m.overall?.values?.[0] || 0), 0) / validMetrics.length;
          
          return (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                <h3 className="font-semibold text-blue-800">Average</h3>
              </div>
              <p className="text-sm text-blue-700 font-medium">Across all metrics</p>
              <p className="text-2xl font-bold text-blue-800">{Math.round(average)}%</p>
            </div>
          );
        })()}
      </div>
    </div>
  );
} 