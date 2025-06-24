import React from 'react';
import type { AnalysisReport, PlayerData, WatchListCautionaryNotesData, HonorableMention } from '../types';
import { FiChevronRight, FiAlertCircle } from 'react-icons/fi'; 
import { AudioPlayer } from './AudioPlayer';
import { Loader } from './Loader'; // Import the Loader component


interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  onPlayerSelect: (player: PlayerData) => void;
  selectedPlayerId?: string;
  isLoading: boolean;
}

const ImportantNote: React.FC = () => (
  <div className="bg-blue-900/30 text-blue-300 p-3 rounded-md border border-blue-700 text-xs">
    <p className="flex items-start">
      <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
      <span><strong>Important:</strong> Always confirm players are in the final starting lineup on MLB.com before making your selection.</span>
    </p>
  </div>
);

interface RecommendationItemProps {
  playerName: string;
  probability: number | undefined; 
  onSelect: () => void;
  isSelected: boolean;
  isSelectable: boolean; 
  index: number;
  team?: string; 
}

const RecommendationItem: React.FC<RecommendationItemProps> = ({ playerName, probability, onSelect, isSelected, isSelectable, index, team }) => (
  <li
    className={`flex justify-between items-center p-2.5 rounded-md transition-colors duration-150 ease-in-out
                ${isSelected && isSelectable ? 'bg-[var(--selected-item-bg)] shadow-md' : 'hover:bg-[var(--main-bg)]'}
                ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
              `}
    onClick={isSelectable ? onSelect : undefined}
    aria-selected={isSelected && isSelectable}
    role={isSelectable ? "option" : undefined}
    tabIndex={isSelectable ? 0 : -1}
    onKeyDown={isSelectable ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
  >
    <div className="flex items-center">
      <span className={`mr-3 text-sm font-medium ${isSelected && isSelectable ? 'text-[var(--primary-glow)]' : 'text-[var(--text-secondary)]'}`}>{index + 1}</span>
      <div>
        <span className={`text-sm ${isSelected && isSelectable ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>{playerName}</span>
        {team && <span className="block text-xs text-[var(--text-secondary)]">{team}</span>}
      </div>
    </div>
    <div className="flex items-center">
      {probability !== undefined && (
         <span className={`text-sm font-semibold mr-2 ${isSelected && isSelectable ? 'text-[var(--primary-glow)]' : (probability > 0 ? 'text-[var(--accent-positive)]' : 'text-[var(--text-secondary)]')}`}>
            {probability.toFixed(1)}%
        </span>
      )}
      {isSelected && isSelectable && <FiChevronRight className="w-4 h-4 text-[var(--primary-glow)]" />}
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
        {isLoading ? (
          <Loader message="Loading Picks..." />
        ) : analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
          <ul className="space-y-1.5" role="listbox" aria-label="Top Player Recommendations">
            {analysisData.recommendations.slice(0, 5).map((player, index) => ( 
              <RecommendationItem
                key={player.player}
                playerName={player.player}
                team={player.team}
                probability={player.finalVerdict.compositeHitProbability}
                onSelect={() => onPlayerSelect(player)}
                isSelected={player.player === selectedPlayerId}
                isSelectable={true}
                index={index}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-center py-4 text-[var(--text-secondary)]">No recommendations available.</p>
        )}
      </section>

      {analysisData?.watchListCautionaryNotes && (
        <>
        <section>
            <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Watch List</h2>
             {analysisData.watchListCautionaryNotes.honorableMentions.length > 0 ? (
                <ul className="space-y-1">
                    {analysisData.watchListCautionaryNotes.honorableMentions.slice(0,3).map((item: HonorableMention, idx) => ( 
                         <RecommendationItem
                            key={item.player + idx}
                            playerName={item.player}
                            team={item.team}
                            probability={item.compositeHitProbability} 
                            onSelect={() => { /* Watchlist items are not selectable for main display */ }}
                            isSelected={false} 
                            isSelectable={false} 
                            index={idx + analysisData.recommendations.length}
                        />
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-2">No honorable mentions.</p>
            )}
        </section>
        </>
      )}

      <section>
        <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Daily Overview</h2>
        <AudioPlayer selectedDate={selectedDate} />
      </section>

      <ImportantNote />

    </aside>
  );
};