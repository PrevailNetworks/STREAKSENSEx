import React from 'react';
import type { AnalysisReport, PlayerData, WatchListCautionaryNotesData } from '../types';
import { FiChevronRight, FiAlertCircle, FiRadio, FiVolume2, FiMoreHorizontal, FiPlay } from 'react-icons/fi'; // Added FiPlay

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  onPlayerSelect: (player: PlayerData) => void;
  selectedPlayerId?: string;
  isLoading: boolean;
}

const AudioPlayerPlaceholder: React.FC = () => (
  <div className="bg-[var(--card-bg)] p-3 rounded-lg border border-[var(--border-color)]">
    <div className="flex items-center justify-between">
      <FiPlay className="w-6 h-6 text-[var(--text-primary)] cursor-pointer hover:text-[var(--primary-glow)]" />
      <div className="text-xs text-[var(--text-secondary)]">0:00 / 6:51</div>
      <div className="flex items-center space-x-2">
        <FiVolume2 className="w-4 h-4 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-glow)]" />
        <FiMoreHorizontal className="w-4 h-4 text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-glow)]" />
      </div>
    </div>
    <div className="w-full bg-[var(--border-color)] h-1.5 rounded-full mt-2 overflow-hidden">
      <div className="bg-[var(--primary-glow)] h-full w-1/4"></div>
    </div>
  </div>
);

const ImportantNote: React.FC = () => (
  <div className="bg-blue-900/30 text-blue-300 p-3 rounded-md border border-blue-700 text-xs">
    <p className="flex items-start">
      <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
      <span><strong>Important:</strong> Always confirm players are in the final starting lineup on MLB.com before making your selection.</span>
    </p>
  </div>
);

const RecommendationItem: React.FC<{ player: PlayerData; onSelect: () => void; isSelected: boolean; index: number }> = ({ player, onSelect, isSelected, index }) => (
  <li
    className={`flex justify-between items-center p-2.5 rounded-md cursor-pointer transition-colors duration-150 ease-in-out
                ${isSelected ? 'bg-[var(--selected-item-bg)] shadow-md' : 'hover:bg-[var(--main-bg)]'}
              `}
    onClick={onSelect}
  >
    <div className="flex items-center">
      <span className={`mr-3 text-sm font-medium ${isSelected ? 'text-[var(--primary-glow)]' : 'text-[var(--text-secondary)]'}`}>{index + 1}</span>
      <span className={`text-sm ${isSelected ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>{player.player}</span>
    </div>
    <div className="flex items-center">
      <span className={`text-sm font-semibold mr-2 ${isSelected ? 'text-[var(--primary-glow)]' : 'text-[var(--accent-positive)]'}`}>
        {player.finalVerdict.compositeHitProbability}%
      </span>
      {isSelected && <FiChevronRight className="w-4 h-4 text-[var(--primary-glow)]" />}
    </div>
  </li>
);

const WatchListItemDisplay: React.FC<{ item: { player: string; description?: string; reason?: string }; type: 'mention' | 'ineligible' }> = ({ item, type }) => (
     <li className="flex items-start text-xs mb-1">
        <span className={`mr-2 text-sm ${type === 'mention' ? 'text-[var(--accent-positive)]' : 'text-[var(--accent-negative)]'}`}>•</span>
        <div>
            <span className="font-semibold text-[var(--text-primary)]">{item.player}: </span>
            <span className="text-[var(--text-secondary)]">{item.description || item.reason}</span>
        </div>
    </li>
);


export const Sidebar: React.FC<SidebarProps> = ({ selectedDate, onDateChange, analysisData, onPlayerSelect, selectedPlayerId, isLoading }) => {
  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      onDateChange(new Date(year, month - 1, day));
    }
  };
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

  return (
    <aside className="w-full md:w-80 lg:w-96 bg-[var(--sidebar-bg)] p-4 sm:p-6 text-[var(--text-primary)] border-r border-[var(--border-color)] flex-shrink-0 space-y-6 overflow-y-auto h-screen md:sticky md:top-0">
      <div className="logo text-left">
        <h1 className="font-[var(--font-display)] font-bold text-4xl tracking-tight uppercase neon-text italic">
          STREAKSENSE
        </h1>
        <div className="flex items-center mt-1">
            <p className="text-xs text-[var(--text-secondary)] uppercase mr-2">BTS Analysis for</p>
            <input
                type="date"
                id="sidebar-date-picker"
                value={selectedDate.toISOString().split('T')[0]}
                max={maxDate}
                onChange={handleDateInputChange}
                className="bg-transparent border-0 text-[var(--primary-glow)] p-0 text-xs font-semibold focus:outline-none focus:ring-0 appearance-none"
                style={{ colorScheme: 'dark' }}
            />
        </div>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Top Recommendations</h2>
        {isLoading && <p className="text-xs text-[var(--text-secondary)]">Loading recommendations...</p>}
        {!isLoading && analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
          <ul className="space-y-1.5">
            {analysisData.recommendations.slice(0, 5).map((player, index) => ( // Show top 5
              <RecommendationItem
                key={player.player}
                player={player}
                onSelect={() => onPlayerSelect(player)}
                isSelected={player.player === selectedPlayerId}
                index={index}
              />
            ))}
          </ul>
        ) : !isLoading && (
          <p className="text-xs text-[var(--text-secondary)]">No recommendations available.</p>
        )}
      </section>

      {analysisData?.watchListCautionaryNotes && (
        <>
        <section>
            <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Watch List</h2>
             {analysisData.watchListCautionaryNotes.honorableMentions.length > 0 ? (
                <ul className="space-y-1">
                    {analysisData.watchListCautionaryNotes.honorableMentions.slice(0,3).map((item, idx) => ( // Show top 3
                         <RecommendationItem
                            key={item.player + idx}
                            player={{ player: item.player, team:item.team, position: '', finalVerdict: {compositeHitProbability: 0}, corePerformance: {} as any, statcastValidation: [], matchup: {} as any, synthesis: {} as any}} // Partial mock for display
                            onSelect={() => { /* Placeholder: No direct selection to main view for watchlist items yet */ }}
                            isSelected={false} // Watchlist items are not "selected" in the main view
                            index={idx + (analysisData.recommendations?.length || 0)} // Continue numbering
                        />
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-[var(--text-secondary)]">No honorable mentions.</p>
            )}
        </section>
        </>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Daily Overview</h2>
        <AudioPlayerPlaceholder />
      </section>

      <ImportantNote />

    </aside>
  );
};
