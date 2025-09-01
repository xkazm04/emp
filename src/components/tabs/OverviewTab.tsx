'use client';

import React from 'react';
import { SurveyData } from '@/types/survey';
import { parseHtmlToReact } from '@/utils/htmlParser';

interface OverviewTabProps {
  data: SurveyData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const getPerformanceLevel = (value: number) => {
    if (value >= 70) return 'high';
    if (value >= 50) return 'medium';
    return 'low';
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-50 border-green-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const formatMetricName = (description: string) => {
    return description
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="p-8 space-y-8">
      {/* Executive Summary */}
      {data.executiveSummary && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Executive Summary</h2>
          
          {data.executiveSummary.overview && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Overview</h3>
              <div className="text-slate-700 leading-relaxed">
                {parseHtmlToReact(data.executiveSummary.overview)}
              </div>
            </div>
          )}

        {/* Key Findings - Clean Terminal Style */}
        {data.executiveSummary?.keyFindings && data.executiveSummary.keyFindings.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Key Discoveries</h2>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {data.executiveSummary.keyFindings.map((finding, index) => {
                  const titleMatch = finding.match(/<b>(.*?)<\/b>/);
                  const title = titleMatch ? titleMatch[1] : `Finding #${index + 1}`;
                  const contentWithoutTitle = titleMatch ? 
                    finding.replace(/<b>.*?<\/b>\s*/, '') : 
                    finding;
                  
                  return (
                    <div key={index} className="group">
                      <div className="border-l-2 border-green-500 pl-6 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-3">
                            <h4 className="text-green-600 font-mono text-lg">{title}</h4>
                        </div>
                        <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-sm">
                          {parseHtmlToReact(contentWithoutTitle)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

          {data.executiveSummary.strategicImplication && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Strategic Implications</h3>
              <div className="text-slate-700 leading-relaxed">
                {parseHtmlToReact(data.executiveSummary.strategicImplication)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key Metrics Grid */}
      {data.keyMetrics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Performance Overview</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Strengths */}
            {data.keyMetrics.keyStrengths && data.keyMetrics.keyStrengths.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Key Strengths
                </h3>
                <div className="space-y-3">
                  {data.keyMetrics.keyStrengths.map((strength, index) => {
                    const currentValue = strength.values?.[0];
                    const level = currentValue ? getPerformanceLevel(currentValue) : 'medium';
                    
                    return (
                      <div key={index} className={`border rounded-lg p-4 shadow-sm ${getPerformanceColor(level)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-800">
                            {formatMetricName(strength.description)}
                          </h4>
                          {currentValue && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium border bg-white text-slate-700">
                              {Math.round(currentValue)}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{strength.context}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {data.keyMetrics.improvementAreas && data.keyMetrics.improvementAreas.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Areas for Improvement
                </h3>
                <div className="space-y-3">
                  {data.keyMetrics.improvementAreas.map((area, index) => {
                    const currentValue = area.values?.[0];
                    const level = currentValue ? getPerformanceLevel(currentValue) : 'medium';
                    
                    return (
                      <div key={index} className={`border rounded-lg p-4 shadow-sm ${getPerformanceColor(level)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-slate-800">
                            {formatMetricName(area.description)}
                          </h4>
                          <div className="flex items-center gap-2">
                            {currentValue && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium border bg-white text-slate-700">
                                {Math.round(currentValue)}%
                              </span>
                            )}
                            {area.priority && (
                              <span className={`px-2 py-1 text-xs rounded-full font-medium uppercase tracking-wide
                                ${area.priority === 'high' ? 'bg-red-100 border border-red-300 text-slate-700' : 
                                  area.priority === 'medium' ? 'bg-yellow-100 border border-yellow-300 text-slate-700' : 
                                  'bg-blue-100 border border-blue-300 text-slate-700'}`}>
                                {area.priority}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600">{area.context}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!data.executiveSummary && !data.keyMetrics && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No overview data available</h3>
          <p className="mt-1 text-sm text-slate-500">
            Upload a file with executive summary or key metrics to see the overview.
          </p>
        </div>
      )}
    </div>
  );
} 