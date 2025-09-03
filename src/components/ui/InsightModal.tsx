'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QualitativeInsight } from '@/types/survey';

interface InsightModalProps {
  insight: QualitativeInsight | null;
  isOpen: boolean;
  onClose: () => void;
  frequency: number;
}

export function InsightModal({ insight, isOpen, onClose, frequency }: InsightModalProps) {
  if (!insight) return null;

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 z-50 flex items-center justify-center"
          >
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-full overflow-hidden flex flex-col">
              {/* Header */}
              <div className={`bg-gradient-to-r ${getCategoryColor(insight.category)} p-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {formatCategoryName(insight.category)}
                      </h2>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-white/90 text-sm font-medium">
                          {frequency} employee mentions
                        </span>
                        <span className="text-white/70 text-sm">
                          Question Reference: {insight.questionReference}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Insight Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Analysis Summary</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {insight.content}
                    </p>
                  </div>
                </div>

                {/* Employee Responses */}
                {insight.sampleResponses && insight.sampleResponses.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h8z" />
                      </svg>
                      Employee Voice Examples
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {insight.sampleResponses.map((response, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="group"
                        >
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-start gap-3">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mt-3 flex-shrink-0 group-hover:bg-gray-600 transition-colors"></div>
                              <blockquote className="text-gray-700 italic leading-relaxed flex-1">
                                &ldquo;{response}&rdquo;
                              </blockquote>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Scroll to view all {insight.sampleResponses?.length || 0} employee responses
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}