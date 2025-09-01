import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { SurveyData } from '@/types/survey';
import { exportToDocx } from '@/utils/docxExporter';

interface ExportButtonProps {
  data: SurveyData | null;
  className?: string;
}

export default function ExportButton({ data, className = '' }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!data) {
      setExportError('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportError(null);

    try {
      await exportToDocx(data);
      // Show success feedback briefly
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportError(error instanceof Error ? error.message : 'Export failed');
      setIsExporting(false);
    }
  };

  const isDisabled = !data || isExporting;

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isDisabled}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${
            isDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md'
          }
          ${className}
        `}
        title={
          !data 
            ? 'Upload survey data to enable export' 
            : isExporting 
            ? 'Generating document...' 
            : 'Export as Word document'
        }
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileText className="h-4 w-4" />
            <span>Export Report</span>
            <Download className="h-3 w-3" />
          </>
        )}
      </button>

      {/* Error tooltip */}
      {exportError && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-600 text-white text-sm rounded-lg shadow-lg z-10 whitespace-nowrap">
          <div className="relative">
            {exportError}
            <div className="absolute -top-1 left-4 w-2 h-2 bg-red-600 rotate-45 transform"></div>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="ml-2 text-red-200 hover:text-white"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}