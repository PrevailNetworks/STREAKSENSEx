
import React, { useState }  from 'react';
import { FiX, FiCalendar, FiLogIn, FiLogOut, FiUser, FiList, FiGrid, FiMessageSquare } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
// AudioPlayer is removed from FlyoutMenu
import type { AnalysisReport, HonorableMention, PlayerData } from '../types';
import { Loader } from './Loader';
import { RecommendationItem } from './AnalyticsContextualPanel';
import type { User as FirebaseUser } from 'firebase/auth';

interface FlyoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  isLoading: boolean;
  maxDate: string;
  className?: string;
  onNavigateToDashboard?: () => void;
  onOpenAuthModal: () => void;
  // onOpenResearchChat: () => void; // Removed
  currentUser: FirebaseUser | null;
  favoritePlayersMap: Record<string, boolean>;
  onSetPick: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (player: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
}

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  analysisData,
  isLoading,
  maxDate,
  className,
  onNavigateToDashboard,
  onOpenAuthModal,
  // onOpenResearchChat, // Removed
  currentUser,
  favoritePlayersMap,
  onSetPick,
  onToggleFavorite
}) => {
  const { signOutUser, loading: authLoading } = useAuth();
  const [isAuthModalOpenForFlyout, setIsAuthModalOpenForFlyout] = useState(false);


  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      const newSelectedDate = new Date(year, month - 1, day, selectedDate.getHours(), selectedDate.getMinutes());
      onDateChange(newSelectedDate);
    }
  };
  
  const handleSignOut = async () => {
    await signOutUser();
    onClose();
  };

  const handleOpenAuthFromFlyout = () => {
    onClose();
    onOpenAuthModal();
  }
  
  const relevantHonorableData = (h: HonorableMention): Pick<PlayerData, 'player' | 'team' | 'mlbId' | 'finalVerdict'> => ({
    player: h.player,
    team: h.team,
    mlbId: undefined,
    finalVerdict: { compositeHitProbability: h.compositeHitProbability || 0 },
  });


  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside
        className={`fixed top-0 left-0 w-80 h-full bg-[var(--sidebar-bg)] shadow-xl p-6 text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flyout-menu-title"
      >
        <div className="flex items-center justify-between mb-8 flex-shrink-0">
          <h2 id="flyout-menu-title" className="font-[var(--font-display)] text-2xl neon-text italic">STREAKSENSE</h2>
          <button onClick={onClose} aria-label="Close menu" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-6 pr-1 pb-6 custom-scrollbar-flyout">
          {currentUser && onNavigateToDashboard && (
            <section>
                 <button
                    onClick={() => { onNavigateToDashboard(); onClose(); }}
                    className="w-full flex items-center justify-center bg-[var(--card-bg)] text-[var(--primary-glow)] px-3 py-3 rounded-md text-sm font-semibold hover:bg-[var(--selected-item-bg)] transition-colors"
                >
                    <FiGrid className="mr-2"/> My Dashboard
                </button>
            </section>
          )}

          <section>
            <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Analysis Date</h3>
            <div className="relative flex items-center group bg-[var(--main-bg)] p-2 rounded-md border border-[var(--border-color)]">
              <FiCalendar className="w-4 h-4 text-[var(--primary-glow)] opacity-80 mr-3 pointer-events-none" />
              <input
                  type="date"
                  id="flyout-date-picker"
                  value={selectedDate.toISOString().split('T')[0]}
                  max={maxDate}
                  onChange={handleDateInputChange}
                  className="bg-transparent border-0 text-[var(--text-primary)] p-0 text-sm font-medium focus:outline-none focus:ring-0 appearance-none w-full cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                  aria-label="Select analysis date"
              />
            </div>
          </section>

          {/* Player Research AI button removed from here, as ChatPanel is persistent on desktop */}
          {/* Consider if a mobile-specific way to access chat is needed later, or if it's desktop-only for now */}

          {analysisData?.watchListCautionaryNotes && (
            <section>
              <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2 flex items-center">
                <FiList className="mr-2"/>Watch List
              </h3>
              {isLoading && !analysisData.watchListCautionaryNotes.honorableMentions.length ? (
                 <div className="py-4"><Loader message="Checking watch list..." /></div>
              ) : analysisData.watchListCautionaryNotes.honorableMentions.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysisData.watchListCautionaryNotes.honorableMentions.slice(0, 3).map((item: HonorableMention, idx) => (
                    <RecommendationItem
                      key={`flyout-watch-${item.player}-${idx}`}
                      player={relevantHonorableData(item)}
                      isSelected={false}
                      isSelectable={false}
                      currentUser={currentUser}
                      selectedDate={selectedDate}
                      favoritePlayersMap={favoritePlayersMap}
                      onSetPick={onSetPick}
                      onToggleFavorite={onToggleFavorite}
                      onOpenAuthModal={handleOpenAuthFromFlyout}
                      isCompact={true}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-2">No honorable mentions today.</p>
              )}
            </section>
          )}

          <section className="border-t border-[var(--border-color)] pt-6 mt-auto">
             <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-3">Account</h3>
            {authLoading ? (
              <div className="flex items-center justify-center h-10">
                <div className="w-5 h-5 border-2 border-[var(--border-color)] border-t-[var(--primary-glow)] rounded-full animate-spin"></div>
              </div>
            ) : currentUser ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <FiUser className="w-5 h-5 text-[var(--primary-glow)] mr-3 shrink-0"/>
                  <span className="text-sm text-[var(--text-secondary)] truncate" title={currentUser.email || 'Authenticated User'}>
                      {currentUser.displayName || currentUser.email}
                  </span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center text-sm text-[var(--primary-glow)] hover:underline py-2 rounded-md border border-[var(--primary-glow)] hover:bg-[var(--primary-glow)]/10"
                    aria-label="Logout"
                >
                   <FiLogOut className="mr-2"/> Logout
                </button>
              </div>
            ) : (
              <button
                  onClick={handleOpenAuthFromFlyout}
                  className="w-full flex items-center justify-center bg-[var(--primary-glow)] text-black px-3 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                  <FiLogIn className="mr-2"/> Login / Sign Up
              </button>
            )}
          </section>
        </div>
      </aside>
      {isAuthModalOpenForFlyout && <AuthModal isOpen={isAuthModalOpenForFlyout} onClose={() => setIsAuthModalOpenForFlyout(false)} />}
    </>
  );
};
