
import React, { useState, useEffect } from 'react';
import { FiGrid, FiBarChart2, FiMessageSquare, FiUser, FiLogIn, FiLogOut, FiMenu, FiX, FiMaximize2, FiMinimize2, FiSettings, FiClock } from 'react-icons/fi';
import type { User as FirebaseUser } from 'firebase/auth';
import type { AppView } from '@/App';
import type { PlayerData } from '@/types'; // Import PlayerData for recent research

interface PrimaryNavigationProps {
  currentView: AppView;
  onSetView: (view: AppView) => void;
  currentUser: FirebaseUser | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
  onToggleChatPanel: () => void;
  recentResearchHistory: PlayerData[];
  onViewResearchedPlayer: (playerData: PlayerData) => void;
}

const NAV_COLLAPSED_WIDTH = "w-16";
const NAV_EXPANDED_WIDTH = "w-64";

export const PrimaryNavigation: React.FC<PrimaryNavigationProps> = ({
  currentView,
  onSetView,
  currentUser,
  onLogout,
  onOpenAuthModal,
  onToggleChatPanel,
  recentResearchHistory,
  onViewResearchedPlayer,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showRecentResearch, setShowRecentResearch] = useState(false);

  useEffect(() => {
    const storedPinned = localStorage.getItem('primaryNavPinned');
    if (storedPinned === 'true') {
      setIsPinned(true);
      setIsExpanded(true);
    }
  }, []);

  const handleTogglePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    setIsExpanded(newPinnedState);
    if (!newPinnedState) setShowRecentResearch(false); // Collapse sub-menu if unpinned and collapsed
    localStorage.setItem('primaryNavPinned', String(newPinnedState));
  };

  const handleMouseEnter = () => {
    if (!isPinned) setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
      setShowRecentResearch(false); // Collapse sub-menu if not pinned and mouse leaves
    }
  };
  
  const navWidthClass = isExpanded ? NAV_EXPANDED_WIDTH : NAV_COLLAPSED_WIDTH;

  const NavItem: React.FC<{
    view?: AppView; 
    icon: React.ReactNode;
    label: string;
    action?: () => void;
    isActiveOverride?: boolean; 
    hasSubMenu?: boolean;
    isSubMenuOpen?: boolean;
    onToggleSubMenu?: () => void;
  }> = ({ view, icon, label, action, isActiveOverride, hasSubMenu, isSubMenuOpen, onToggleSubMenu }) => {
    const isActive = (view && currentView === view && !action) || isActiveOverride;
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (action) action();
      else if (view) onSetView(view);
      if (hasSubMenu && onToggleSubMenu) onToggleSubMenu();
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
      className={`hidden md:flex flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] text-[var(--text-primary)] transition-all duration-300 ease-in-out relative ${navWidthClass} h-screen flex-shrink-0`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`flex items-center p-4 border-b border-[var(--border-color)] mb-4 flex-shrink-0 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
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
                      ${isExpanded ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}
        >
          {isPinned ? <FiMinimize2 size={18} /> : <FiMaximize2 size={18} />}
        </button>
      </div>

      <div className="flex-grow px-2 space-y-2 overflow-y-auto custom-scrollbar">
        {currentUser && (
            <NavItem view="dashboard" icon={<FiGrid />} label="My Dashboard" />
        )}
        <NavItem view="analytics" icon={<FiBarChart2 />} label="THE FIVE" />
        {currentUser && (
          <>
            <NavItem 
                icon={<FiMessageSquare />} 
                label="Player Research" 
                action={() => {
                  onToggleChatPanel();
                  if (isExpanded) setShowRecentResearch(prev => !prev); // Toggle submenu only if nav is expanded
                }}
                hasSubMenu={true}
                isSubMenuOpen={showRecentResearch && isExpanded}
            />
            {isExpanded && showRecentResearch && recentResearchHistory.length > 0 && (
              <ul className="pl-8 mt-1 space-y-1 border-l border-[var(--border-color)] ml-3">
                {recentResearchHistory.map(player => (
                  <li key={player.mlbId || player.player}>
                    <button
                      onClick={() => onViewResearchedPlayer(player)}
                      title={`View report for ${player.player}`}
                      className="flex items-center w-full text-left px-2 py-1.5 rounded-md text-xs text-[var(--text-secondary)] hover:bg-[var(--selected-item-bg)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <FiClock size={12} className="mr-2 opacity-70 flex-shrink-0"/>
                      <span className="truncate">{player.player}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
             {isExpanded && showRecentResearch && recentResearchHistory.length === 0 && (
                 <p className="pl-8 mt-1 text-xs text-[var(--text-secondary)]">No recent research.</p>
             )}
          </>
        )}
      </div>

      <div className="mt-auto p-2 border-t border-[var(--border-color)] flex-shrink-0">
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
