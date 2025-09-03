'use client';

import React, { useState } from 'react';
import { SurveyData } from '@/types/survey';
import { EmptyLeadershipState, LeadershipTableHeader, LeaderTableBody } from './leadership';

interface LeadershipTabProps {
  data: SurveyData;
}

export function LeadershipTab({ data }: LeadershipTabProps) {
  const [expandedLeader, setExpandedLeader] = useState<string | null>(null);

  const handleToggleExpanded = (leaderId: string | null) => {
    setExpandedLeader(expandedLeader === leaderId ? null : leaderId);
  };

  if (!data.leaders || data.leaders.length === 0) {
    return <EmptyLeadershipState />;
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
            <LeadershipTableHeader />
            <LeaderTableBody
              leaders={data.leaders}
              expandedLeader={expandedLeader}
              onToggleExpanded={handleToggleExpanded}
            />
          </table>
        </div>
      </div>
    </div>
  );
} 