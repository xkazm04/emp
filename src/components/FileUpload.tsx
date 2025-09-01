'use client';

import React, { useCallback, useState } from 'react';
import { SurveyData } from '@/types/survey';

interface FileUploadProps {
  onUpload: (data: SurveyData) => void;
  onError: (error: string) => void;
}

export function FileUpload({ onUpload, onError }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateSurveyData = (data: unknown): data is SurveyData => {
    // Basic validation - check for required top-level properties
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for essential properties but be flexible about structure
    const dataObj = data as Record<string, unknown>;
    const hasMetadata = dataObj.metadata && typeof dataObj.metadata === 'object';
    const hasContent = Boolean(dataObj.executiveSummary || dataObj.keyMetrics || dataObj.leaders || dataObj.performanceMetrics);
    
    return Boolean(hasMetadata) || hasContent;
  };

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      onError('Please upload a JSON file');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = JSON.parse(content);
        
        if (validateSurveyData(parsedData)) {
          onUpload(parsedData);
        } else {
          onError('Invalid survey data format. Please check your JSON structure.');
        }
              } catch {
          onError('Invalid JSON file. Please check the file format.');
        } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      onError('Error reading file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  }, [onUpload, onError]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ease-in-out
          ${isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-6">
          {/* Upload Icon */}
          <div className="mx-auto w-16 h-16 text-slate-400">
            {isProcessing ? (
              <svg className="animate-spin w-16 h-16" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                />
              </svg>
            )}
          </div>

          {/* Upload Text */}
          <div className="space-y-2">
            {isProcessing ? (
              <p className="text-lg font-medium text-slate-600">
                Processing your file...
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-slate-600">
                  {isDragOver ? 'Drop your JSON file here' : 'Upload Survey Data'}
                </p>
                <p className="text-sm text-slate-500">
                  Drag and drop your survey JSON file, or click to browse
                </p>
              </>
            )}
          </div>

          {/* Upload Button */}
          {!isProcessing && (
            <button
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose File
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 