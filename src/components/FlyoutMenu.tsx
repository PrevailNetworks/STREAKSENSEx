
import React, { useState }  from 'react';
import { FiX, FiCalendar, FiLogIn, FiLogOut, FiUser, FiList } from 'react-icons/fi'; // Removed FiAlertCircle
import { useAuth } from '@/contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { AudioPlayer } from './AudioPlayer';
import type { AnalysisReport, HonorableMention } from '../types';
import { Loader } from './Loader';
import { RecommendationItem } from './Sidebar';

interface FlyoutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  analysisData: AnalysisReport | null;
  isLoading: boolean;
  maxDate: string; // Added maxDate prop
  className?: string;
}

export const FlyoutMenu: React.FC<FlyoutMenuProps> = ({ 
  isOpen, 
  onClose, 
  selectedDate, 
  onDateChange,
  analysisData,
  isLoading,
  maxDate, // Use passed maxDate
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

  // Removed: if (!isOpen) return null; // This allows AudioPlayer to persist

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

        <div className="flex-grow overflow-y-auto space-y-6 pr-1 pb-6">
          {/* Date Picker Section */}
          <section>
            <h3 className="text-sm font-semibold uppercase text-[var(--text-secondary)] tracking-wider mb-2">Analysis Date</h3>
            <div className="relative flex items-center group bg-[var(--main-bg)] p-2 rounded-md border border-[var(--border-color)]">
              <FiCalendar className="w-4 h-4 text-[var(--primary-glow)] opacity-80 mr-3 pointer-events-none" />
              <input
                  type="date"
                  id="flyout-date-picker"
                  value={selectedDate.toISOString().split('T')[0]}
                  max={maxDate} // Use prop
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
              {isLoading && !analysisData.watchListCautionaryNotes.honorableMentions.length ? (
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
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[var(--text-secondary)] text-center py-2">No honorable mentions today.</p>
              )}
            </section>
          )}

          {/* Auth Section - Moved to bottom of scrollable content */}
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
        </div>
        {/* ImportantNoteFlyout removed from here */}
      </aside>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => { setIsAuthModalOpen(false); /* onClose(); // Decided against auto-closing flyout */ }} />}
    </>
  );
};
