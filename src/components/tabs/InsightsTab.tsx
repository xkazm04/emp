'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SurveyData, QualitativeInsight } from '@/types/survey';
import { InsightModal } from '@/components/ui/InsightModal';

interface InsightsTabProps {
  data: SurveyData;
}

export function InsightsTab({ data }: InsightsTabProps) {
  const [selectedInsight, setSelectedInsight] = useState<QualitativeInsight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasContent = data.executiveSummary || (data.qualitativeInsights && data.qualitativeInsights.length > 0);

  if (!hasContent) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-32 h-32 mx-auto border-4 border-dashed border-gray-300 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">No Insights Available</h3>
          <p className="text-gray-600 max-w-md mx-auto text-lg">
            Upload survey data to unlock strategic analysis and employee sentiment insights.
          </p>
        </div>
      </div>
    );
  }

  // Flatten and prioritize all insights
  const allInsights = data.qualitativeInsights || [];
  const topInsights = allInsights
    .sort((a, b) => {
      const freqA = a.timeseries?.['Q2 2025']?.frequency || 0;
      const freqB = b.timeseries?.['Q2 2025']?.frequency || 0;
      return freqB - freqA; // Sort by frequency desc
    })
    .slice(0, 8); // Top 8 insights only

  // Get frequency for an insight
  const getInsightFrequency = (insight: typeof data.qualitativeInsights[0]) => {
    return insight.timeseries?.['Q2 2025']?.frequency || 0;
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'fulfilling_work': 'from-green-500 to-green-600',
      'obstacles': 'from-gray-500 to-gray-600',
      'bold_ideas': 'from-green-400 to-green-500',
      'leadership_support': 'from-slate-500 to-slate-600',
      'role_clarity': 'from-gray-400 to-gray-500',
      'tools_resources': 'from-green-500 to-green-600',
      'empowerment_changes': 'from-blue-500 to-blue-600'
    };
    return colorMap[category] || 'from-gray-500 to-slate-600';
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleInsightClick = (insight: QualitativeInsight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInsight(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50 relative overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gray-400 rounded-full filter blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-green-400 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 lg:p-8 max-w-[95rem] mx-auto">
        {/* Insights Matrix - Clean Grid */}
        {topInsights.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Employee Voice</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topInsights.map((insight, index) => {
                const frequency = getInsightFrequency(insight);
                const colorClass = getCategoryColor(insight.category);
                
                return (
                  <motion.div 
                    key={index} 
                    className="group relative cursor-pointer"
                    onClick={() => handleInsightClick(insight)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className={`absolute -inset-1 bg-gradient-to-r ${colorClass} rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300`}></div>
                    <div className="relative bg-white border border-gray-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 min-h-[280px] flex flex-col">
                      
                      {/* Header with frequency */}
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-gray-500 text font-bold uppercase tracking-wider">
                          {formatCategoryName(insight.category)}
                        </span>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            {frequency}×
                          </div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            mentions
                          </div>
                        </div>
                      </div>

                      {/* Content - Full description */}
                      <div className="flex-grow">
                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                          {insight.content}
                        </p>
                      </div>

                      {/* Response count indicator */}
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{insight.sampleResponses?.length || 0} responses</span>
                        </div>
                        <div className="text-xs text-gray-400 uppercase tracking-wide">
                          Click to view
                        </div>
                      </div>

                      {/* Click indicator */}
                      <div className="mt-4 flex items-center justify-center">
                        <div className="w-8 h-1 bg-gray-200 rounded-full">
                          <div className={`h-full w-2 bg-gradient-to-r ${colorClass} rounded-full transition-all duration-300 group-hover:w-full`} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-gray-500 text-sm">
                <span className="text-green-600 font-mono">CLICK</span> any insight card to view detailed employee responses
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <InsightModal
        insight={selectedInsight}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        frequency={selectedInsight ? getInsightFrequency(selectedInsight) : 0}
      />
    </div>
  );
} 