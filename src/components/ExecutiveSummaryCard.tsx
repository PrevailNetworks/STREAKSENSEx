
import React from 'react';
import type { ExecutiveSummaryData } from '../types';

interface ExecutiveSummaryCardProps {
  summary: ExecutiveSummaryData;
  reportDate: string;
}

export const ExecutiveSummaryCard: React.FC<ExecutiveSummaryCardProps> = ({ summary, reportDate }) => {
  return (
    <section className="bg-[var(--bg-card)] p-6 rounded-lg shadow-xl border border-[var(--border-color)] backdrop-blur-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)]">Executive Summary</h2>
        <span className="text-sm text-[var(--text-secondary)] font-[var(--font-display)]">{reportDate}</span>
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Situational Overview</h3>
      <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
        {summary.situationalOverview}
      </p>
    </section>
  );
};