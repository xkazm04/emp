'use client';

import React, { useState, useCallback } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { SurveyDashboard } from '@/components/SurveyDashboard';
import ExportButton from '@/components/ExportButton';
import { SurveyData } from '@/types/survey';

export default function Home() {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback((data: SurveyData) => {
    setSurveyData(data);
    setError(null);
  }, []);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setSurveyData(null);
  }, []);

  const handleReset = useCallback(() => {
    setSurveyData(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error processing file
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!surveyData ? (
          <FileUpload onUpload={handleFileUpload} onError={handleError} />
        ) : (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <ExportButton data={surveyData} />
              <button
                onClick={handleReset}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload New File
              </button>
            </div>

            {/* Dashboard */}
            <SurveyDashboard data={surveyData} />
          </div>
        )}
      </div>
    </div>
  );
}
