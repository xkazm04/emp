'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Leader } from '@/types/survey';
import { ScoreBar } from './ScoreBar';
import { LeaderExpandableRow } from './LeaderExpandableRow';

interface LeaderTableBodyProps {
  leaders: Leader[];
  expandedLeader: string | null;
  onToggleExpanded: (leaderId: string | null) => void;
}

export function LeaderTableBody({ 
  leaders, 
  expandedLeader, 
  onToggleExpanded 
}: LeaderTableBodyProps) {
  return (
    <tbody className="bg-white divide-y divide-slate-200">
      {leaders.map((leader) => {
        const keyStats = leader.keyStats || {};
        const leadershipScore = keyStats.leadershipConfidence?.values?.[0] || 0;
        const toolsScore = keyStats.tools?.values?.[0] || 0;
        const empowermentScore = keyStats.empowerment?.values?.[0] || 0;
        const retentionScore = keyStats.retention?.values?.[0] || 0;
        const teamSize = leader.metrics?.find(m => m.metricKey === 'total_responses')?.values?.[0] || 0;

        const isExpanded = expandedLeader === leader.id;

        return (
          <React.Fragment key={leader.id}>
            <tr
              className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                isExpanded ? 'bg-blue-50' : ''
              }`}
              onClick={() => onToggleExpanded(isExpanded ? null : leader.id)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="mr-3">
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-4 h-4 text-slate-400"
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M9 5l7 7-7 7" 
                        />
                      </svg>
                    </motion.div>
                  </div>
                  <div>
                    <div className="text font-medium text-slate-900">
                      {leader.name.split('(')[0].trim()}
                    </div>
                    <div className="text-sm text-slate-500">
                      {leader.name.includes('(') ? leader.name.split('(')[1]?.replace(')', '') : ''}
                    </div>
                  </div>
                </div>
              </td>

              {/* Responses */}
              <td className="px-4 py-4 text-center">
                <div className="inline-flex items-center justify-center px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg">
                  <span className="text-lg font-bold text-slate-900">
                    {teamSize}
                  </span>
                </div>
              </td>

              {/* Leadership Score */}
              <td className="px-4 py-4">
                <ScoreBar score={leadershipScore} variant="prominent" size="md" />
              </td>

              {/* Tools Score */}
              <td className="px-4 py-4">
                <ScoreBar score={toolsScore} variant="prominent" size="md" />
              </td>

              {/* Empowerment Score */}
              <td className="px-4 py-4">
                <ScoreBar score={empowermentScore} variant="prominent" size="md" />
              </td>

              {/* Retention Score */}
              <td className="px-4 py-4">
                <ScoreBar score={retentionScore} variant="prominent" size="md" />
              </td>
            </tr>

            <LeaderExpandableRow
              leader={leader}
              isExpanded={isExpanded}
            />
          </React.Fragment>
        );
      })}
    </tbody>
  );
}