
import React, { useState, useEffect } from 'react';
import { FiGrid, FiBarChart2, FiMessageSquare, FiUser, FiLogIn, FiLogOut, FiMenu, FiX, FiMaximize2, FiMinimize2, FiSettings } from 'react-icons/fi'; // Added FiSettings
import type { User as FirebaseUser } from 'firebase/auth';
import type { AppView } from '@/App'; // Import AppView type

interface PrimaryNavigationProps {
  currentView: AppView;
  onSetView: (view: AppView) => void;
  currentUser: FirebaseUser | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  onOpenResearchChat: () => void;
}

const NAV_COLLAPSED_WIDTH = "w-16"; // approx 4rem
const NAV_EXPANDED_WIDTH = "w-64"; // approx 16rem

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  currentView,
  onSetView,
  currentUser,
  onLogout,
  onOpenAuthModal,
  onOpenResearchChat,
}) => {
  const [isExpanded, setIsExpanded] = useState(false); // Default to collapsed
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    // Load pinned state from localStorage
    const storedPinned = localStorage.getItem('primaryNavPinned');
    if (storedPinned === 'true') {
      setIsPinned(true);
      setIsExpanded(true);
    }
  }, []);

  const handleTogglePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    setIsExpanded(newPinnedState); // If unpinned, collapse. If pinned, expand.
    localStorage.setItem('primaryNavPinned', String(newPinnedState));
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
    }
  };
  
  const navWidthClass = isExpanded ? NAV_EXPANDED_WIDTH : NAV_COLLAPSED_WIDTH;

  const NavItem: React.FC<{
    view: AppView;
    icon: React.ReactNode;
    label: string;
    action?: () => void; // For non-view changing actions like opening modals
  }> = ({ view, icon, label, action }) => {
    const isActive = currentView === view && !action; // Action items don't have an "active" view state
    const handleClick = () => {
      if (action) action();
      else onSetView(view);
    };
    return (
      <button
        onClick={handleClick}
        title={label}
        className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 ease-in-out
                    ${isActive ? 'bg-[var(--primary-glow)] text-black shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--selected-item-bg)] hover:text-[var(--text-primary)]'}
                    ${isExpanded ? 'justify-start' : 'justify-center'}`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`text-xl ${isActive ? '' : 'text-[var(--primary-glow)]'}`}>{icon}</span>
        {isExpanded && <span className="ml-3 text-sm font-medium">{label}</span>}
      </button>
    );
  };

  return (
    <nav 
      className={`hidden md:flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] text-[var(--text-primary)] transition-all duration-300 ease-in-out relative ${navWidthClass}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header section with Logo and Pin button */}
      <div className={`flex items-center p-4 border-b border-[var(--border-color)] mb-4 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        {isExpanded && (
            <span 
                className="font-[var(--font-display)] text-xl neon-text italic cursor-pointer"
                onClick={() => onSetView(currentUser ? 'dashboard' : 'landing')}
                title="STREAKSENSE Home"
            >
                STREAKSENSE
            </span>
        )}
        {!isExpanded && (
             <span 
                className="font-[var(--font-display)] text-2xl neon-text italic cursor-pointer transform scale-90"
                onClick={() => onSetView(currentUser ? 'dashboard' : 'landing')}
                title="STREAKSENSE Home"
            >
                S
            </span>
        )}
        <button
          onClick={handleTogglePin}
          title={isPinned ? "Unpin Navigation" : "Pin Navigation"}
          className={`p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--selected-item-bg)] hover:text-[var(--text-primary)] transition-colors 
                      ${isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`} // Always show on desktop if not expanded by hover
        >
          {isPinned ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow px-2 space-y-2">
        {currentUser && (
            <NavItem view="dashboard" icon={<FiGrid />} label="My Dashboard" />
        )}
        <NavItem view="analytics" icon={<FiBarChart2 />} label="Player Analytics" />
         {currentUser && ( // Only show research AI if logged in for now, as it involves user-specific actions
            <NavItem view="analytics" icon={<FiMessageSquare />} label="Player Research AI" action={onOpenResearchChat} />
        )}
      </div>

      {/* Footer / Auth section */}
      <div className="mt-auto p-2 border-t border-[var(--border-color)]">
        {currentUser ? (
          <div className={`flex items-center w-full px-2 py-3 rounded-lg ${isExpanded ? 'justify-start' : 'justify-center'}`}>
             <FiUser className={`text-xl ${isExpanded ? 'mr-3' : ''} text-[var(--primary-glow)]`} />
            {isExpanded && (
              <div className="flex-grow min-w-0">
                <span className="block text-xs font-medium truncate" title={currentUser.displayName || currentUser.email || undefined}>{currentUser.displayName || currentUser.email}</span>
              </div>
            )}
             {isExpanded && (
                 <button onClick={onLogout} title="Logout" className="ml-2 p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--selected-item-bg)] hover:text-[var(--primary-glow)]">
                    <FiLogOut size={18} />
                </button>
             )}
          </div>
        ) : (
          <NavItem view="landing" icon={<FiLogIn />} label="Login / Sign Up" action={onOpenAuthModal} />
        )}
      </div>
    </nav>
  );
};
