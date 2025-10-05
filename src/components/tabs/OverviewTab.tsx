'use client';

import React from 'react';
import { SurveyData } from '@/types/survey';
import { parseHtmlToReact } from '@/utils/htmlParser';

interface OverviewTabProps {
  data: SurveyData;
}

export function OverviewTab({ data }: OverviewTabProps) {
  const getPerformanceLevel = (value: number, isEsatScore = false) => {
    if (isEsatScore) {
      // For eSAT score (1-5 scale), calculate thresholds differently
      if (value >= 4.2) return 'high';    // 4.2-5.0 = high
      if (value >= 3.0) return 'medium';  // 3.0-4.1 = medium  
      return 'low';                       // 1.0-2.9 = low
    }
    
    // For percentage metrics
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

  // Get eSAT score from data
  const esatScore = data.keyMetrics?.esatScore;
  const esatScoreOutOf = data.keyMetrics?.esatScoreOutOf || 5;

  return (
    <div className="p-8 space-y-8">
      {/* Executive Summary */}
      {data.executiveSummary && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Executive Summary</h2>
          
        {data.executiveSummary && (
          <div className="mb-16">
              
              {/* Overview Card */}
              {data.executiveSummary.overview && (
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-white border border-gray-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Executive Overview</h3>
                        <p className="text-green-600 text-sm">Strategic Analysis</p>
                      </div>
                    </div>
                    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                      {parseHtmlToReact(data.executiveSummary.overview)}
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}

              {/* Strategic Implications */}
              {data.executiveSummary.strategicImplication && (
                <div className="group relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-gray-400/20 to-gray-500/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="relative bg-white border border-gray-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-500">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Strategic Implications</h3>
                        <p className="text-gray-600 text-sm">Forward Analysis</p>
                      </div>
                    </div>
                    <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                      {parseHtmlToReact(data.executiveSummary.strategicImplication)}
                    </div>
                  </div>
                </div>
              )}
        </div>
      )}

      {/* eSAT Score Section */}
      {esatScore !== null && esatScore !== undefined && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">Employee Satisfaction Score</h2>
          
          <div className="group relative max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-white border border-gray-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all duration-500">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">eSAT Score</h3>
                  <p className="text-blue-600 text-sm">Overall Employee Satisfaction</p>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-6xl font-bold text-gray-800 mb-2">
                  {esatScore.toFixed(1)}
                </div>
                <div className="text-lg text-gray-600 mb-4">
                  out of {esatScoreOutOf}
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-4 mb-4">
                  <div 
                    className={`h-4 rounded-full ${getPerformanceColor(getPerformanceLevel(esatScore, true))}`}
                    style={{ width: `${(esatScore / esatScoreOutOf) * 100}%` }}
                  />
                </div>
                
                <div className={`px-4 py-2 rounded-full text-sm font-medium uppercase tracking-wide inline-block
                  ${getPerformanceLevel(esatScore, true) === 'high' ? 'bg-green-100 border border-green-300 text-slate-700' : 
                    getPerformanceLevel(esatScore, true) === 'medium' ? 'bg-yellow-100 border border-yellow-300 text-slate-700' : 
                    'bg-red-100 border border-red-300 text-slate-700'}`}>
                  {getPerformanceLevel(esatScore, true)} satisfaction
                </div>
              </div>
            </div>
          </div>
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
                  {data.keyMetrics.keyStrengths
                    .filter(strength => !strength.description.toLowerCase().includes('esat'))
                    .map((strength, index) => {
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
                  {data.keyMetrics.improvementAreas
                    .filter(area => !area.description.toLowerCase().includes('esat'))
                    .map((area, index) => {
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