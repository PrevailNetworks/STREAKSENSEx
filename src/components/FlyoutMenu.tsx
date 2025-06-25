
import React, { useState }  from 'react';
import { FiX, FiCalendar, FiLogIn, FiLogOut, FiUser, FiList, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { AudioPlayer } from './AudioPlayer';
import type { AnalysisReport, HonorableMention } from '../types';
import { Loader } from './Loader';
import { RecommendationItem } from './Sidebar'; // Re-use RecommendationItem

interface FlyoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  isLoading: boolean; // Overall loading state
  className?: string;
}

const ImportantNoteFlyout: React.FC = () => (
  <div className="bg-blue-900/30 text-blue-300 p-3 rounded-md border border-blue-700 text-xs">
    <p className="flex items-start">
      <FiAlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
      <span><strong>Important:</strong> Always confirm players are in the final starting lineup on MLB.com before making your selection.</span>
    </p>
  </div>
);

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onDateChange,
  analysisData,
  isLoading,
  className 
}) => {
  const { currentUser, signOutUser, loading: authLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      onDateChange(new Date(year, month - 1, day));
    }
  };
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      ></div>
      <aside 
        className={`fixed top-0 left-0 w-80 h-full bg-[var(--sidebar-bg)] shadow-xl p-6 text-[var(--text-primary)] border-r border-[var(--border-color)] flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="flyout-menu-title"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 id="flyout-menu-title" className="font-[var(--font-display)] text-2xl neon-text italic">STREAKSENSE</h2>
          <button onClick={onClose} aria-label="Close menu" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <FiX size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto space-y-6 pr-1 pb-6">
          {/* Auth Section */}
          <section className="border-b border-[var(--border-color)] pb-6">
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
                    onClick={() => { signOutUser(); onClose(); }} 
                    className="w-full flex items-center justify-center text-sm text-[var(--primary-glow)] hover:underline py-2 rounded-md border border-[var(--primary-glow)] hover:bg-[var(--primary-glow)]/10"
                    aria-label="Logout"
                >
                   <FiLogOut className="mr-2"/> Logout
                </button>
              </div>
            ) : (
              <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full flex items-center justify-center bg-[var(--primary-glow)] text-black px-3 py-2.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                  <FiLogIn className="mr-2"/> Login / Sign Up
              </button>
            )}
          </section>

          {/* Date Picker Section */}
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
          
          {/* Daily Overview Section */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Daily Overview</h3>
            <AudioPlayer selectedDate={selectedDate} />
          </section>
          
          {/* Watch List Section */}
          {analysisData?.watchListCautionaryNotes && (
            <section>
              <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2 flex items-center">
                <FiList className="mr-2"/>Watch List
              </h3>
              {isLoading && !analysisData.watchListCautionaryNotes.honorableMentions.length ? ( // Show loader only if data is loading AND no watchlist items yet
                 <div className="py-4"><Loader message="Checking watch list..." /></div>
              ) : analysisData.watchListCautionaryNotes.honorableMentions.length > 0 ? (
                <ul className="space-y-1.5">
                  {analysisData.watchListCautionaryNotes.honorableMentions.slice(0, 3).map((item: HonorableMention, idx) => ( 
                    <RecommendationItem
                      itemKey={`flyout-watch-${item.player}-${idx}`}
                      playerName={item.player}
                      team={item.team}
                      probability={item.compositeHitProbability}
                      onSelect={() => { /* Non-interactive in flyout */}}
                      isSelected={false}
                      isSelectable={false}
                      // No index numbers for flyout watchlist
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-2">No honorable mentions today.</p>
              )}
            </section>
          )}

        </div>
          {/* Important Note - at the very bottom of the scrollable area */}
        <div className="mt-auto flex-shrink-0 pt-4">
             <ImportantNoteFlyout />
        </div>
      </aside>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => { setIsAuthModalOpen(false); onClose(); }} />}
    </>
  );
};
