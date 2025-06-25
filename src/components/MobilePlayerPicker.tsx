
import React, { useState, useEffect, useRef } from 'react';
import type { AnalysisReport, PlayerData } from '../types';
import { RecommendationItem } from './Sidebar'; // Re-use RecommendationItem
import { FiChevronDown, FiChevronUp, FiList, FiX } from 'react-icons/fi';
import { Loader } from './Loader';

interface MobilePlayerPickerProps {
  analysisData: AnalysisReport | null;
  onPlayerSelect: (player: PlayerData) => void;
  selectedPlayerId?: string;
  isLoading: boolean; // Data loading state
  className?: string;
}

export const MobilePlayerPicker: React.FC<MobilePlayerPickerProps> = ({
  analysisData,
  onPlayerSelect,
  selectedPlayerId,
  isLoading,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const selectedPlayer = analysisData?.recommendations.find(p => p.player === selectedPlayerId);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handlePlayerSelection = (player: PlayerData) => {
    onPlayerSelect(player);
    setIsExpanded(false);
  };
  
  // Close picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);


  if (isLoading && !analysisData) {
    return (
      <div className={`p-3 bg-[var(--main-bg)] border-b border-[var(--border-color)] text-center ${className}`}>
        <span className="text-xs text-[var(--text-secondary)]">Loading player picks...</span>
      </div>
    );
  }
  
  if (!analysisData || !analysisData.recommendations || analysisData.recommendations.length === 0) {
     return (
      <div className={`p-3 bg-[var(--main-bg)] border-b border-[var(--border-color)] text-center ${className}`}>
        <span className="text-xs text-[var(--text-secondary)]">No recommendations available.</span>
      </div>
    );
  }

  return (
    <div ref={pickerRef} className={`bg-[var(--main-bg)] border-b border-[var(--border-color)] ${className}`}>
      <div 
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-[var(--sidebar-bg)] transition-colors"
        onClick={toggleExpand}
        role="button"
        aria-expanded={isExpanded}
        aria-controls="mobile-player-list"
      >
        <div className="flex items-center">
          <FiList className="w-4 h-4 text-[var(--primary-glow)] mr-2" />
          <span className="text-sm text-[var(--text-primary)] font-medium">
            {selectedPlayer ? `Selected: ${selectedPlayer.player}` : 'Select a Player'}
          </span>
        </div>
        {isExpanded ? <FiChevronUp className="w-5 h-5 text-[var(--text-secondary)]" /> : <FiChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />}
      </div>

      {isExpanded && (
        <div id="mobile-player-list" className="absolute top-full left-0 right-0 bg-[var(--main-bg)] shadow-lg border-b border-x border-[var(--border-color)] rounded-b-md z-20 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-4"><Loader message="Refreshing picks..." /></div>
          ) : analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
            <ul className="p-2 space-y-1">
              {analysisData.recommendations.slice(0, 5).map((player, index) => (
                <RecommendationItem
                  itemKey={`mp-rec-${player.player}-${index}`}
                  playerName={player.player}
                  team={player.team}
                  probability={player.finalVerdict.compositeHitProbability}
                  onSelect={() => handlePlayerSelection(player)}
                  isSelected={player.player === selectedPlayerId}
                  isSelectable={true}
                  index={index}
                />
              ))}
            </ul>
          ) : (
             <p className="p-4 text-xs text-center text-[var(--text-secondary)]">No recommendations found.</p>
          )}
           <button 
                onClick={() => setIsExpanded(false)} 
                className="w-full text-center py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--primary-glow)] border-t border-[var(--border-color)] mt-1"
            >
                Close
            </button>
        </div>
      )}
    </div>
  );
};
