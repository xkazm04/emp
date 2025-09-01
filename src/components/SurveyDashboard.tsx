'use client';

import React, { useState } from 'react';
import { SurveyData } from '@/types/survey';
import { DashboardHeader } from './DashboardHeader';
import { OverviewTab } from './tabs/OverviewTab';
import { StatisticsTab } from './tabs/StatisticsTab';
import { LeadershipTab } from './tabs/LeadershipTab';
import { InsightsTab } from './tabs/InsightsTab';

interface SurveyDashboardProps {
  data: SurveyData;
}

type TabType = 'overview' | 'statistics' | 'leadership' | 'insights';

export function SurveyDashboard({ data }: SurveyDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Determine which tabs to show based on available data
  const availableTabs = [
    { id: 'overview' as TabType, label: 'Overview', condition: true },
    { id: 'statistics' as TabType, label: 'Statistics', condition: !!data.performanceMetrics?.length },
    { id: 'leadership' as TabType, label: 'Leadership', condition: !!data.leaders?.length },
    { id: 'insights' as TabType, label: 'Insights', condition: !!data.qualitativeInsights?.length || !!data.executiveSummary }
  ].filter(tab => tab.condition);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab data={data} />;
      case 'statistics':
        return <StatisticsTab data={data} />;
      case 'leadership':
        return <LeadershipTab data={data} />;
      case 'insights':
        return <InsightsTab data={data} />;
      default:
        return <OverviewTab data={data} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Dashboard Header with Stats */}
      <DashboardHeader data={data} />

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 bg-slate-50">
        <nav className="flex space-x-0 overflow-x-auto">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-4 text-sm font-medium border-b-3 whitespace-nowrap transition-all duration-200
                ${activeTab === tab.id
                  ? 'text-blue-600 border-blue-600 bg-white'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderTabContent()}
      </div>
    </div>
  );
} 