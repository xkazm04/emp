'use client';

import React from 'react';
import { SurveyData } from '@/types/survey';
import { StatisticsCard } from './statistics';

interface StatisticsTabProps {
  data: SurveyData;
}

export function StatisticsTab({ data }: StatisticsTabProps) {
  const getPerformanceLevel = (value: number) => {
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    return 'low';
  };

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  // Expected metrics based on Leadership tab keyStats
  const expectedMetrics = [
    'confidence_in_leadership',
    'have_tools_and_resources', 
    'feel_empowered_to_make_decisions',
    'see_themselves_here_next_year'
  ];

  // Check which expected metrics are available
  const availableExpectedMetrics = data.performanceMetrics?.filter(metric => 
    expectedMetrics.includes(metric.metricKey)
  ) || [];

  const missingMetrics = expectedMetrics.filter(key => 
    !data.performanceMetrics?.some(metric => metric.metricKey === key)
  );

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

      {/* Metrics Alignment Notice */}
      {missingMetrics.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <h3 className="font-semibold text-yellow-800">Missing Leadership Metrics</h3>
          </div>
          <p className="text-sm text-yellow-700">
            Some metrics shown in the Leadership tab are not available in the performance statistics: 
            <span className="font-medium">
              {missingMetrics.map(key => key.replace(/_/g, ' ')).join(', ')}
            </span>
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Showing {availableExpectedMetrics.length} of {expectedMetrics.length} leadership metrics plus {data.performanceMetrics.length - availableExpectedMetrics.length} additional metrics.
          </p>
        </div>
      )}

      {/* Performance Metrics Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left  font-medium text-slate-500 uppercase tracking-wider w-1/2">
                  Metric
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
              {/* First show leadership-related metrics */}
              {availableExpectedMetrics
                .sort((a, b) => {
                  // Sort by priority: confidence, tools, empowerment, retention
                  const priority = ['confidence_in_leadership', 'have_tools_and_resources', 'feel_empowered_to_make_decisions', 'see_themselves_here_next_year'];
                  return priority.indexOf(a.metricKey) - priority.indexOf(b.metricKey);
                })
                .map((metric, index) => {
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
                  <tr key={`leadership-${index}`} className="hover:bg-slate-50 transition-colors border-l-4 border-l-blue-100">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-slate-900">{metric.metricName}</div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Overall Column */}
                    <td className="px-6 py-4 text-center">
                      {overallCurrent ? (
                        <StatisticsCard
                          value={overallCurrent}
                          change={overallChange}
                          level={overallLevel}
                          type="overall"
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Top Performers Column */}
                    <td className="px-6 py-4 text-center">
                      {topPerformersCurrent ? (
                        <StatisticsCard
                          value={topPerformersCurrent}
                          change={topPerformersChange}
                          level={topPerformersLevel}
                          type="topPerformers"
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Gap Column */}
                    <td className="px-6 py-4 text-center">
                      {gap !== null ? (
                        <StatisticsCard
                          value={gap}
                          level={overallLevel}
                          type="gap"
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Then show other metrics */}
              {data.performanceMetrics
                .filter(metric => !expectedMetrics.includes(metric.metricKey))
                .map((metric, index) => {
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
                  <tr key={`other-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{metric.metricName}</div>
                    </td>
                    
                    {/* Overall Column */}
                    <td className="px-6 py-4 text-center">
                      {overallCurrent ? (
                        <StatisticsCard
                          value={overallCurrent}
                          change={overallChange}
                          level={overallLevel}
                          type="overall"
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Top Performers Column */}
                    <td className="px-6 py-4 text-center">
                      {topPerformersCurrent ? (
                        <StatisticsCard
                          value={topPerformersCurrent}
                          change={topPerformersChange}
                          level={topPerformersLevel}
                          type="topPerformers"
                        />
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </td>
                    
                    {/* Gap Column */}
                    <td className="px-6 py-4 text-center">
                      {gap !== null ? (
                        <StatisticsCard
                          value={gap}
                          level={overallLevel}
                          type="gap"
                        />
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
    </div>
  );
} 