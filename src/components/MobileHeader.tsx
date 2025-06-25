
import React from 'react';
import { FiMenu, FiCalendar } from 'react-icons/fi';

interface MobileHeaderProps {
  selectedDate: Date;
  onMenuToggle: () => void;
  onDateChange: (date: Date) => void; // Added
  maxDate: string; // Added
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ 
  selectedDate, 
  onMenuToggle, 
  onDateChange, 
  maxDate, 
  className 
}) => {
  const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateInputId = "mobile-header-date-picker";

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      // Dates from input type="date" are yyyy-mm-dd. Need to adjust for local timezone.
      const dateParts = dateValue.split('-').map(Number);
      const newSelectedDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
      
      // Get user's current time to preserve it, avoiding timezone shifts to midnight UTC
      const userCurrentHours = selectedDate.getHours();
      const userCurrentMinutes = selectedDate.getMinutes();
      newSelectedDate.setHours(userCurrentHours, userCurrentMinutes, 0, 0);

      onDateChange(newSelectedDate);
    }
  };

  return (
    <header className={`flex items-center justify-between p-4 text-[var(--text-primary)] ${className}`}>
      <div className="flex items-center">
        <h1 className="font-[var(--font-display)] font-bold text-2xl tracking-tight uppercase neon-text italic">
          STREAKSENSE
        </h1>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        <div className="relative">
          <label 
            htmlFor={dateInputId} 
            className="flex items-center text-xs text-[var(--text-secondary)] cursor-pointer group hover:text-[var(--text-primary)] transition-colors"
            title="Change analysis date"
          >
            <FiCalendar className="w-4 h-4 text-[var(--primary-glow)] mr-1.5 group-hover:brightness-125 transition-all" />
            <span>{formattedDate}</span>
          </label>
          <input
            type="date"
            id={dateInputId}
            value={selectedDate.toISOString().split('T')[0]}
            max={maxDate}
            onChange={handleDateInputChange}
            className="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer" // Covers the label to be clickable
            style={{ colorScheme: 'dark' }}
            aria-label="Select analysis date"
          />
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
