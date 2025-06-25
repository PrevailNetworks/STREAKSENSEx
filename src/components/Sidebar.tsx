
import React, { useState } from 'react';
import type { AnalysisReport, PlayerData, HonorableMention } from '../types';
import { FiChevronRight, FiAlertCircle, FiCalendar, FiLogIn, FiLogOut, FiUser, FiBarChart2, FiCheckSquare, FiHeart, FiLoader } from 'react-icons/fi';
import { AudioPlayer } from './AudioPlayer'; // This AudioPlayer is for Desktop Sidebar, kept as is.
import { Loader } from './Loader';
import { useAuth } from '@/contexts/AuthContext';
import type { User as FirebaseUser } from 'firebase/auth';

interface SidebarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  onPlayerSelect: (player: PlayerData) => void;
  selectedPlayerId?: string;
  isLoading: boolean;
  maxDate: string;
  className?: string;
  onLogoClick?: () => void;
  onOpenAuthModal: () => void;
  currentUser: FirebaseUser | null;
  favoritePlayersMap: Record<string, boolean>;
  onSetPick: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
}

const ImportantNote: React.FC = () => (
  <div className="bg-blue-900/30 text-blue-300 p-3 rounded-md border border-blue-700 text-xs mt-auto">
    <p className="flex items-start">
      <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
      <span><strong>Important:</strong> Always confirm players are in the final starting lineup on MLB.com before making your selection.</span>
    </p>
  </div>
);

// Exporting Props for potential external use or stricter typing if RecommendationItem were separate
export interface RecommendationItemProps {
  player: Pick<PlayerData, 'player' | 'team' | 'mlbId' | 'finalVerdict'>; // Use Pick for relevant fields
  onSelect?: () => void; // Main selection for display
  isSelected: boolean;
  isSelectable: boolean;
  index?: number;
  itemKey?: string;
  // Props for quick actions
  currentUser: FirebaseUser | null;
  selectedDate: Date; // Needed for context if fetching structured report
  favoritePlayersMap: Record<string, boolean>;
  onSetPick: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onOpenAuthModal: () => void;
  isCompact?: boolean; // For potentially smaller icons in flyout/mobile picker
}

export const RecommendationItem: React.FC<RecommendationItemProps> = ({ 
  player, onSelect, isSelected, isSelectable, index, itemKey,
  currentUser, favoritePlayersMap, onSetPick, onToggleFavorite, onOpenAuthModal, isCompact
}) => {
  const [actionLoading, setActionLoading] = useState<'pick' | 'favorite' | null>(null);
  const playerId = player.mlbId || player.player.toLowerCase().replace(/\s+/g, '-');
  const isFavorite = favoritePlayersMap[playerId] || false;

  const handlePickAction = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect if clicking icon
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
    key={itemKey}
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
    <div className="flex items-center flex-grow min-w-0"> {/* Ensure player name can shrink */}
      {typeof index === 'number' && <span className={`mr-2 text-sm font-medium ${isSelected && isSelectable ? 'text-[var(--primary-glow)]' : 'text-[var(--text-secondary)]'}`}>{index + 1}.</span>}
      <div className="min-w-0 flex-grow"> {/* Player name and team container */}
        <span className={`text-sm truncate ${isSelected && isSelectable ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-secondary)]'}`}>{player.player}</span>
        {player.team && <span className="block text-xs text-[var(--text-secondary)] truncate">{player.team}</span>}
      </div>
    </div>
    <div className="flex items-center flex-shrink-0 ml-2 space-x-2">
      {/* Quick Action Icons */}
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

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDate,
  onDateChange,
  analysisData,
  onPlayerSelect,
  selectedPlayerId,
  isLoading,
  maxDate,
  className,
  onLogoClick,
  onOpenAuthModal,
  currentUser,
  favoritePlayersMap,
  onSetPick,
  onToggleFavorite
}) => {
  const { signOutUser, loading: authLoading } = useAuth();

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const dateParts = dateValue.split('-').map(Number);
      const newSelectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      const userCurrentHours = selectedDate.getHours();
      const userCurrentMinutes = selectedDate.getMinutes();
      newSelectedDate.setHours(userCurrentHours, userCurrentMinutes, 0, 0);
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
    mlbId: undefined, // Honorable mentions might not have mlbId readily
    finalVerdict: { compositeHitProbability: h.compositeHitProbability || 0 },
  });


  return (
    <>
      <aside className={`w-full md:w-80 lg:w-96 bg-[var(--sidebar-bg)] p-4 sm:p-6 text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col h-full ${className}`}>
        <div className="flex-shrink-0">
            <div
              className={`logo text-left mb-6 ${onLogoClick ? 'cursor-pointer' : ''}`}
              onClick={onLogoClick}
              title={onLogoClick ? (currentUser ? "Go to My Dashboard" : "Go to Home") : "STREAKSENSE"}
            >
              <h1 className="font-[var(--font-display)] font-bold text-4xl tracking-tight uppercase neon-text italic">
                STREAKSENSE
              </h1>
              <div className="flex items-center mt-1">
                  <p className="text-xs text-[var(--text-secondary)] uppercase mr-2">BTS Analysis for</p>
                  <div className="relative flex items-center group">
                      <input
                          type="date"
                          id="sidebar-date-picker"
                          value={selectedDate.toISOString().split('T')[0]}
                          max={maxDate}
                          onChange={handleDateInputChange}
                          className="bg-transparent border-0 text-[var(--primary-glow)] p-0 text-xs font-semibold focus:outline-none focus:ring-0 appearance-none pr-5 cursor-pointer"
                          style={{ colorScheme: 'dark' }}
                          aria-label="Select analysis date"
                      />
                      <FiCalendar className="w-3.5 h-3.5 text-[var(--primary-glow)] opacity-70 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
              </div>
            </div>
        </div>

        <div className="flex-grow overflow-y-auto space-y-6 pr-1 pb-4">
            {currentUser && onLogoClick && (
                <button
                    onClick={onLogoClick}
                    className="w-full flex items-center justify-center bg-[var(--card-bg)] text-[var(--primary-glow)] px-3 py-2.5 rounded-md text-sm font-semibold hover:bg-[var(--selected-item-bg)] transition-colors mb-4"
                >
                    <FiUser className="mr-2"/> Go to My Dashboard
                </button>
            )}
            <section>
              <h2 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Top Recommendations</h2>
              {isLoading ? (
                <Loader message="Loading Picks..." />
              ) : analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
                <ul className="space-y-1.5" role="listbox" aria-label="Top Player Recommendations">
                  {analysisData.recommendations.slice(0, 5).map((p, index) => (
                    <RecommendationItem
                      key={`sidebar-rec-${p.player}-${index}`} // Changed itemKey to key
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
                                  key={`sidebar-watch-${item.player}-${idx}`} // Changed itemKey to key
                                  player={relevantHonorableData(item)}
                                  // onSelect={() => { /* Watchlist items might become selectable for a mini-report later */ }}
                                  isSelected={false}
                                  isSelectable={false} // Watchlist items not directly selectable for MainDisplay from sidebar
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
              <AudioPlayer selectedDate={selectedDate} /> {/* Desktop sidebar AudioPlayer */}
            </section>

            <ImportantNote />
        </div>

        <div className="flex-shrink-0 mt-auto pt-4 border-t border-[var(--border-color)]">
            {authLoading ? (
                <div className="flex items-center justify-center h-10">
                    <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-[var(--primary-glow)] rounded-full animate-spin"></div>
                </div>
            ) : currentUser ? (
                <div className="flex items-center justify-between">
                    <div className="flex items-center overflow-hidden">
                        <FiUser className="w-5 h-5 text-[var(--primary-glow)] mr-2 shrink-0"/>
                        <span className="text-xs text-[var(--text-secondary)] truncate" title={currentUser.email || 'Authenticated User'}>
                            {currentUser.displayName || currentUser.email}
                        </span>
                    </div>
                    <button
                        onClick={async () => { await signOutUser(); }} // Ensure signout completes
                        className="text-xs text-[var(--primary-glow)] hover:underline flex items-center shrink-0"
                        aria-label="Logout"
                    >
                       <FiLogOut className="mr-1"/> Logout
                    </button>
                </div>
            ) : (
                <button
                    onClick={onOpenAuthModal}
                    className="w-full flex items-center justify-center bg-[var(--primary-glow)] text-black px-3 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                    <FiLogIn className="mr-2"/> Login / Sign Up
                </button>
            )}
        </div>
      </aside>
    </>
  );
};
