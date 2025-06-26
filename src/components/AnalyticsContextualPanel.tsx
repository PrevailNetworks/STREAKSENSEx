
import React, { useState } from 'react';
import type { AnalysisReport, PlayerData, HonorableMention } from '../types';
import { FiChevronRight, FiAlertCircle, FiCalendar, FiLogIn, FiLogOut, FiUser, FiBarChart2, FiCheckSquare, FiHeart, FiLoader } from 'react-icons/fi';
import { AudioPlayer } from './AudioPlayer'; 
import { Loader } from './Loader';
import type { User as FirebaseUser } from 'firebase/auth';

// Props for RecommendationItem are used internally by AnalyticsContextualPanel and potentially MobilePlayerPicker/FlyoutMenu
export interface RecommendationItemProps {
  player: Pick<PlayerData, 'player' | 'team' | 'mlbId' | 'finalVerdict'>;
  onSelect?: () => void;
  isSelected: boolean;
  isSelectable: boolean;
  index?: number;
  // itemKey?: string; // Replaced by standard React key prop
  currentUser: FirebaseUser | null;
  selectedDate: Date;
  favoritePlayersMap: Record<string, boolean>;
  onSetPick: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onOpenAuthModal: () => void;
  isCompact?: boolean;
}

// RecommendationItem component (could be moved to its own file if extensively used elsewhere)
export const RecommendationItem: React.FC<RecommendationItemProps> = ({ 
  player, onSelect, isSelected, isSelectable, index, /* itemKey, */
  currentUser, favoritePlayersMap, onSetPick, onToggleFavorite, onOpenAuthModal, isCompact
}) => {
  const [actionLoading, setActionLoading] = useState<'pick' | 'favorite' | null>(null);
  const playerId = player.mlbId || player.player.toLowerCase().replace(/\s+/g, '-');
  const isFavorite = favoritePlayersMap[playerId] || false;

  const handlePickAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) { onOpenAuthModal(); return; }
    setActionLoading('pick');
    await onSetPick(player);
    setActionLoading(null);
  };

  const handleFavoriteAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) { onOpenAuthModal(); return; }
    setActionLoading('favorite');
    await onToggleFavorite(player);
    setActionLoading(null);
  };

  const iconSizeClass = isCompact ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
  <li
    // key={itemKey || `rec-${player.player}-${index}`} // Ensure key is always present
    className={`group flex justify-between items-center p-2.5 rounded-md transition-colors duration-150 ease-in-out
                ${isSelected && isSelectable ? 'bg-[var(--selected-item-bg)] shadow-md' : 'hover:bg-[var(--main-bg)]'}
                ${isSelectable ? 'cursor-pointer' : 'cursor-default'}
              `}
    onClick={isSelectable && onSelect ? onSelect : undefined}
    aria-selected={isSelected && isSelectable}
    role={isSelectable ? "option" : undefined}
    tabIndex={isSelectable ? 0 : -1}
    onKeyDown={isSelectable && onSelect ? (e) => (e.key === 'Enter' || e.key === ' ') && onSelect() : undefined}
  >
    <div className="flex items-center flex-grow min-w-0">
      {typeof index === 'number' && <span className={`mr-2 text-sm font-medium ${isSelected && isSelectable ? 'text-[var(--primary-glow)]' : 'text-[var(--text-secondary)]'}`}>{index + 1}.</span>}
      <div className="min-w-0 flex-grow">
        <span className={`text-sm truncate ${isSelected && isSelectable ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>{player.player}</span>
        {player.team && <span className="block text-xs text-[var(--text-secondary)] truncate">{player.team}</span>}
      </div>
    </div>
    <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
      {currentUser && (
        <>
          <button 
            title="Set as My Pick" 
            onClick={handlePickAction} 
            disabled={!!actionLoading}
            className={`p-1 rounded hover:bg-[var(--selected-item-bg)] disabled:opacity-50 text-[var(--text-secondary)] hover:text-green-400`}
          >
            {actionLoading === 'pick' ? <FiLoader className={`${iconSizeClass} animate-spin`} /> : <FiCheckSquare className={iconSizeClass} />}
          </button>
          <button 
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"} 
            onClick={handleFavoriteAction} 
            disabled={!!actionLoading}
            className={`p-1 rounded hover:bg-[var(--selected-item-bg)] disabled:opacity-50 ${isFavorite ? 'text-pink-500 hover:text-pink-400' : 'text-[var(--text-secondary)] hover:text-pink-500'}`}
          >
            {actionLoading === 'favorite' ? <FiLoader className={`${iconSizeClass} animate-spin`} /> : <FiHeart className={`${iconSizeClass} ${isFavorite ? 'fill-current' : ''}`} />}
          </button>
        </>
      )}
      {!currentUser && isSelectable && (
         <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex space-x-1">
            <button title="Login to Set Pick" onClick={(e) => { e.stopPropagation(); onOpenAuthModal();}} className="p-1 rounded text-[var(--text-secondary)] hover:text-green-400"><FiCheckSquare className={iconSizeClass}/></button>
            <button title="Login to Favorite" onClick={(e) => { e.stopPropagation(); onOpenAuthModal();}} className="p-1 rounded text-[var(--text-secondary)] hover:text-pink-500"><FiHeart className={iconSizeClass}/></button>
         </div>
      )}
      {player.finalVerdict?.compositeHitProbability !== undefined && (
         <span className={`hidden sm:inline text-xs font-semibold mr-1 ${isSelected && isSelectable ? 'text-[var(--primary-glow)]' : (player.finalVerdict.compositeHitProbability > 0 ? 'text-[var(--accent-positive)]' : 'text-[var(--text-secondary)]')}`}>
            {player.finalVerdict.compositeHitProbability.toFixed(1)}%
        </span>
      )}
      {isSelected && isSelectable && <FiChevronRight className={`${iconSizeClass} text-[var(--primary-glow)]`} />}
    </div>
  </li>
  );
};


interface AnalyticsContextualPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  onPlayerSelect: (player: PlayerData) => void;
  selectedPlayerId?: string;
  isLoading: boolean;
  maxDate: string;
  className?: string; 
  currentUser: FirebaseUser | null;
  favoritePlayersMap: Record<string, boolean>;
  onSetPick: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onOpenAuthModal: () => void; 
}

const ImportantNote: React.FC = () => (
  <div className="bg-blue-900/30 text-blue-300 p-3 rounded-md border border-blue-700 text-xs mt-auto">
    <p className="flex items-start">
      <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
      <span><strong>Important:</strong> Always confirm players are in the final starting lineup on MLB.com before making your selection.</span>
    </p>
  </div>
);


export const AnalyticsContextualPanel: React.FC<AnalyticsContextualPanelProps> = ({
  selectedDate,
  onDateChange,
  analysisData,
  onPlayerSelect,
  selectedPlayerId,
  isLoading,
  maxDate,
  className,
  currentUser,
  favoritePlayersMap,
  onSetPick,
  onToggleFavorite,
  onOpenAuthModal,
}) => {

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      // Construct date as local midnight to avoid timezone issues
      const newSelectedDate = new Date(year, month - 1, day);
      onDateChange(newSelectedDate);
    }
  };
  
  const relevantPlayerData = (p: PlayerData): Pick<PlayerData, 'player' | 'team' | 'mlbId' | 'finalVerdict'> => ({
    player: p.player,
    team: p.team,
    mlbId: p.mlbId,
    finalVerdict: p.finalVerdict,
  });
   const relevantHonorableData = (h: HonorableMention): Pick<PlayerData, 'player' | 'team' | 'mlbId' | 'finalVerdict'> => ({
    player: h.player,
    team: h.team,
    mlbId: undefined,
    finalVerdict: { compositeHitProbability: h.compositeHitProbability || 0 },
  });


  return (
    <aside className={`w-full md:w-72 lg:w-80 bg-[var(--sidebar-bg)] p-4 sm:p-5 text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col h-full ${className}`}>
        <div className="flex-shrink-0 mb-6">
            <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Analytics Date</h2>
            <div className="relative flex items-center group bg-[var(--main-bg)] p-2.5 rounded-md border border-[var(--border-color)]">
                <FiCalendar className="w-4 h-4 text-[var(--primary-glow)] opacity-80 mr-3 pointer-events-none" />
                <input
                    type="date"
                    id="analytics-panel-date-picker"
                    value={selectedDate.toISOString().split('T')[0]}
                    max={maxDate}
                    onChange={handleDateInputChange}
                    className="bg-transparent border-0 text-[var(--text-primary)] p-0 text-sm font-medium focus:outline-none focus:ring-0 appearance-none w-full cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                    aria-label="Select analysis date"
                />
            </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-5 pr-1 pb-4 custom-scrollbar">
            <section>
              <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Top Recommendations</h2>
              {isLoading ? (
                <Loader message="Loading Picks..." />
              ) : analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
                <ul className="space-y-1.5" role="listbox" aria-label="Top Player Recommendations">
                  {analysisData.recommendations.slice(0, 5).map((p, index) => (
                    <RecommendationItem
                      key={`analytics-rec-${p.player}-${index}`}
                      player={relevantPlayerData(p)}
                      onSelect={() => onPlayerSelect(p)}
                      isSelected={p.player === selectedPlayerId}
                      isSelectable={true}
                      index={index}
                      currentUser={currentUser}
                      selectedDate={selectedDate}
                      favoritePlayersMap={favoritePlayersMap}
                      onSetPick={onSetPick}
                      onToggleFavorite={onToggleFavorite}
                      onOpenAuthModal={onOpenAuthModal}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-center py-4 text-[var(--text-secondary)]">No recommendations available.</p>
              )}
            </section>

            {analysisData?.watchListCautionaryNotes && (
              <section>
                  <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Watch List</h2>
                  {analysisData.watchListCautionaryNotes.honorableMentions.length > 0 ? (
                      <ul className="space-y-1">
                          {analysisData.watchListCautionaryNotes.honorableMentions.slice(0,3).map((item: HonorableMention, idx) => (
                              <RecommendationItem
                                  key={`analytics-watch-${item.player}-${idx}`}
                                  player={relevantHonorableData(item)}
                                  isSelected={false}
                                  isSelectable={false} 
                                  currentUser={currentUser}
                                  selectedDate={selectedDate}
                                  favoritePlayersMap={favoritePlayersMap}
                                  onSetPick={onSetPick}
                                  onToggleFavorite={onToggleFavorite}
                                  onOpenAuthModal={onOpenAuthModal}
                              />
                          ))}
                      </ul>
                  ) : (
                      <p className="text-xs text-[var(--text-secondary)] text-center py-2">No honorable mentions.</p>
                  )}
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Daily Overview</h2>
              <AudioPlayer selectedDate={selectedDate} /> 
            </section>

            <ImportantNote />
        </div>
    </aside>
  );
};
