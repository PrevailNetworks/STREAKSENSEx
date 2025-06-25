
import React from 'react';
import { FiMenu, FiCalendar } from 'react-icons/fi';

interface MobileHeaderProps {
  selectedDate: Date;
  onMenuToggle: () => void;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ selectedDate, onMenuToggle, className }) => {
  const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <header className={`flex items-center justify-between p-4 text-[var(--text-primary)] ${className}`}>
      <div className="flex items-center">
        <h1 className="font-[var(--font-display)] font-bold text-2xl tracking-tight uppercase neon-text italic">
          STREAKSENSE
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-xs text-[var(--text-secondary)]">
          <FiCalendar className="w-3.5 h-3.5 text-[var(--primary-glow)] mr-1.5" />
          <span>{formattedDate}</span>
        </div>
        <button 
          onClick={onMenuToggle} 
          aria-label="Open menu" 
          className="text-[var(--text-primary)] hover:text-[var(--primary-glow)]"
        >
          <FiMenu size={24} />
        </button>
      </div>
    </header>
  );
};
