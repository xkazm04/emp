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
                <span className="font-bold text-slate-900">
                  {teamSize}
                </span>
              </td>

              {/* Leadership Score */}
              <td className="px-4 py-4">
                <ScoreBar score={leadershipScore} />
              </td>

              {/* Tools Score */}
              <td className="px-4 py-4">
                <ScoreBar score={toolsScore} />
              </td>

              {/* Empowerment Score */}
              <td className="px-4 py-4">
                <ScoreBar score={empowermentScore} />
              </td>

              {/* Retention Score */}
              <td className="px-4 py-4">
                <ScoreBar score={retentionScore} />
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