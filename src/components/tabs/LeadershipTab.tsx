'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SurveyData } from '@/types/survey';
import { parseHtmlToReact, parseFocusArea } from '@/utils/htmlParser';

interface LeadershipTabProps {
  data: SurveyData;
}

export function LeadershipTab({ data }: LeadershipTabProps) {
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);

  const getPerformanceLevel = (value: number) => {
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    return 'low';
  };

  const getBarColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100';
      case 'medium': return 'bg-amber-200'; // Changed from yellow-100 to amber-200 for better visibility
      case 'low': return 'bg-red-100';
      default: return 'bg-slate-100';
    }
  };

  if (!data.leaders || data.leaders.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No leadership data available</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a file with leadership analysis to see detailed insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Leadership Performance Dashboard</h2>
        <div className="text-sm text-slate-500">
          Click on any leader row to expand detailed analysis
        </div>
      </div>

      {/* Leadership Performance Chart */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Performance Overview</h3>
          <p className="text-sm text-slate-600 mt-1">Key metrics comparison across all leaders</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">
                  Leader
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Leadership
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tools
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Empowerment
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Ideas Valued
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Responses
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {data.leaders.map((leader) => {
                const keyStats = leader.keyStats || {};
                const leadershipScore = keyStats.leadershipConfidence?.values?.[0] || 0;
                const toolsScore = keyStats.tools?.values?.[0] || 0;
                const empowermentScore = keyStats.empowerment?.values?.[0] || 0;
                const ideasScore = keyStats.ideasValued?.values?.[0] || 0;
                const teamSize = leader.metrics?.find(m => m.metricKey === 'total_responses')?.values?.[0] || 0;
                
                const isExpanded = expandedLeader === leader.id;

                return (
                  <React.Fragment key={leader.id}>
                    <tr 
                      className={`cursor-pointer transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-blue-50' : ''}`}
                      onClick={() => setExpandedLeader(isExpanded ? null : leader.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="mr-3">
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                              className="w-4 h-4 text-slate-400"
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </motion.div>
                          </div>
                          <div>
                            <div className="text font-medium text-slate-900">
                              {leader.name.split('(')[0].trim()}
                            </div>
                            <div className="text-sm text-slate-500">
                              {leader.name.includes('(') ? leader.name.split('(')[1]?.replace(')', '') : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      {/* Leadership Score */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <div className="w-20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-600">{Math.round(leadershipScore)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getBarColor(getPerformanceLevel(leadershipScore))}`}
                                style={{ width: `${leadershipScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Tools Score */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <div className="w-20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-600">{Math.round(toolsScore)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getBarColor(getPerformanceLevel(toolsScore))}`}
                                style={{ width: `${toolsScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Empowerment Score */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <div className="w-20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-600">{Math.round(empowermentScore)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getBarColor(getPerformanceLevel(empowermentScore))}`}
                                style={{ width: `${empowermentScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Ideas Valued Score */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center">
                          <div className="w-20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-600">{Math.round(ideasScore)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${getBarColor(getPerformanceLevel(ideasScore))}`}
                                style={{ width: `${ideasScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Responses */}
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-slate-900">
                          {teamSize}
                        </span>
                      </td>
                    </tr>

                    {/* Expandable Detail Row */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td colSpan={6} className="px-0 py-0">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="bg-slate-50 border-t border-slate-200 p-6">
                                <div className="space-y-6">
                                  {/* Performance Metrics Grid */}
                                  {leader.metrics && leader.metrics.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-slate-800">All Performance Metrics</h4>
                                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {leader.metrics.map((metric, index) => {
                                          const currentValue = metric.values?.[0];
                                          const previousValue = metric.values?.[1];
                                          const change = currentValue && previousValue ? currentValue - previousValue : null;

                                          return (
                                            <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                                              <div className="flex items-center justify-between mb-3">
                                                <h5 className="text-sm font-medium text-slate-700">
                                                  {metric.metricName}
                                                </h5>
                                                {change !== null && (
                                                  <span className={`text-xs px-2 py-1 rounded-full font-medium
                                                    ${change > 0 ? 'bg-green-100 text-slate-700' :
                                                      change < 0 ? 'bg-red-100 text-slate-700' :
                                                      'bg-slate-100 text-slate-700'}`}>
                                                    {change > 0 ? '+' : ''}{change.toFixed(1)}pp
                                                  </span>
                                                )}
                                              </div>
                                              
                                              <div className="space-y-2">
                                                <div className="text-2xl font-bold text-slate-900">
                                                  {currentValue ? `${Math.round(currentValue)}%` : 'N/A'}
                                                </div>
                                                
                                                {currentValue && (
                                                  <div className="w-full bg-slate-200 rounded-full h-2">
                                                    <div 
                                                      className={`h-2 rounded-full ${getBarColor(getPerformanceLevel(currentValue))}`}
                                                      style={{ width: `${currentValue}%` }}
                                                    />
                                                  </div>
                                                )}
                                                
                                                {previousValue && (
                                                  <div className="text-xs text-slate-500">
                                                    Previous: {Math.round(previousValue)}%
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Summary Analysis */}
                                  {leader.narrative?.summary && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-slate-800">Performance Summary</h4>
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        {parseHtmlToReact(leader.narrative.summary)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Focus Areas */}
                                  {leader.narrative?.focusAreas && leader.narrative.focusAreas.length > 0 && (
                                    <div className="space-y-4">
                                      <h4 className="font-semibold text-slate-800">Recommended Focus Areas</h4>
                                      <div className="grid gap-4">
                                        {leader.narrative.focusAreas.map((area, index) => {
                                          const parsed = parseFocusArea(area);
                                          
                                          return (
                                            <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg">
                                              <div className="px-4 py-3 border-b border-orange-200 bg-orange-100">
                                                <div className="flex items-center justify-between">
                                                  <h5 className="font-semibold text-slate-800">{parsed.title}</h5>
                                                  <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide
                                                    ${parsed.priority === 'high' ? 'bg-orange-200 text-slate-700' : 
                                                      'bg-orange-100 text-slate-700'}`}>
                                                    {parsed.priority} priority
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="p-4">
                                                {parsed.content}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 