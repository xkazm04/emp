'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leader } from '@/types/survey';
import { parseHtmlToReact, parseFocusArea } from '@/utils/htmlParser';
import { CircularProgress } from './CircularProgress';
import { ScoreBar } from './ScoreBar';

interface LeaderExpandableRowProps {
  leader: Leader;
  isExpanded: boolean;
}

export function LeaderExpandableRow({ leader, isExpanded }: LeaderExpandableRowProps) {
  return (
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
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-slate-800">All Performance Metrics</h4>

                        {/* eSAT Score Component */}
                        {(() => {
                          const esatMetric = leader.metrics.find(m => m.metricKey === 'overall_satisfaction_score');
                          const esatScore = esatMetric?.values?.[0];
                          const esatPrevious = esatMetric?.values?.[1];

                          if (esatScore) {
                            return (
                              <CircularProgress
                                score={esatScore}
                                maxScore={5.0}
                                showChange={true}
                                previousScore={esatPrevious}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leader.metrics
                          .filter(metric => metric.metricKey !== 'overall_satisfaction_score' && metric.metricKey !== 'total_responses') // Exclude eSAT score and total_responses
                          .map((metric, index) => {
                            const currentValue = metric.values?.[0];
                            const previousValue = metric.values?.[1];
                            const change = currentValue && previousValue ? currentValue - previousValue : null;
                            const isPercentageMetric = currentValue && currentValue <= 100; // Assume values > 100 are not percentages

                            return (
                              <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
                                <div className="flex relative items-center justify-between mb-3">
                                  <h5 className="text-sm font-medium text-slate-700">
                                    {metric.metricName}
                                  </h5>
                                  <div className="flex absolute -bottom-1 items-center gap-2">
                                   {currentValue && isPercentageMetric && (
                                    <ScoreBar 
                                      score={currentValue} 
                                      showLabel={false} 
                                      size="sm"
                                      className="w-full"
                                    />
                                  )}
                                  </div>
                                  {change !== null && (
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium
                                    ${change > 0 ? 'bg-green-100 text-slate-700' :
                                        change < 0 ? 'bg-red-100 text-slate-700' :
                                          'bg-slate-100 text-slate-700'}`}>
                                      {change > 0 ? '+' : ''}{change.toFixed(1)}{isPercentageMetric ? 'pp' : ''}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <div className="text-2xl font-bold text-slate-900">
                                    {currentValue ? (isPercentageMetric ? `${Math.round(currentValue)}%` : currentValue.toFixed(1)) : 'N/A'}
                                  </div>
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
  );
}