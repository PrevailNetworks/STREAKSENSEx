
import React from 'react';
import type { WatchListCautionaryNotesData } from '../types';

interface WatchListCardProps {
  watchList: WatchListCautionaryNotesData;
}

export const WatchListCard: React.FC<WatchListCardProps> = ({ watchList }) => {
  return (
    <section className="bg-[var(--bg-card)] p-6 rounded-lg shadow-xl border border-[var(--border-color)] backdrop-blur-sm">
      <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-4">Watch List & Cautionary Notes</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Honorable Mentions</h3>
          {watchList.honorableMentions.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] text-sm">
              {watchList.honorableMentions.map((item, index) => (
                <li key={index}>
                  <strong>{item.player} ({item.team}):</strong> {item.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No honorable mentions for this date.</p>
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Ineligible Players to Note</h3>
          {watchList.ineligiblePlayersToNote.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-[var(--text-secondary)] text-sm">
            {watchList.ineligiblePlayersToNote.map((item, index) => (
              <li key={index}>
                <strong>{item.player} ({item.team}):</strong> {item.reason}
              </li>
            ))}
          </ul>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No notable ineligible players for this date.</p>
          )}
        </div>
      </div>
    </section>
  );
};