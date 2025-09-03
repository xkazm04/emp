'use client';

import React from 'react';

export function LeadershipTableHeader() {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">
          Leader
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
          Responses
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
          Leadership
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
          Tools
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
          Empowerment
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
          Retention
        </th>
      </tr>
    </thead>
  );
}