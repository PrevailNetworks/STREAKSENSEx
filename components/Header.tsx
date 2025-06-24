
import React from 'react';

interface HeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const Header: React.FC<HeaderProps> = ({ selectedDate, onDateChange }) => {
  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value; // YYYY-MM-DD
    if (dateValue) {
      // HTML date input returns date in local timezone midnight.
      // Date constructor parses YYYY-MM-DD as UTC midnight.
      // To keep it local timezone midnight:
      const [year, month, day] = dateValue.split('-').map(Number);
      onDateChange(new Date(year, month - 1, day));
    }
  };
  
  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];


  return (
    <header className="mb-6 pb-6 border-b border-[var(--border-color)]">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
        <div className="logo text-center sm:text-left mb-4 sm:mb-0">
          <h1 
            className="font-[var(--font-display)] font-bold text-5xl sm:text-7xl tracking-tight uppercase neon-text italic"
          >
            STREAKSENSE
          </h1>
          <span className="block font-[var(--font-body)] text-xs sm:text-sm text-[var(--text-secondary)] tracking-normal uppercase mt-1 sm:mt-2">
            THE MORE YOU KNOW, THE LESS YOU SUCK
          </span>
        </div>
        <div className="date-picker-container mt-4 sm:mt-0">
          <label htmlFor="date-picker" className="block text-xs text-[var(--text-secondary)] mb-1 uppercase tracking-wider text-center sm:text-right">
            Select Briefing Date
          </label>
          <input
            type="date"
            id="date-picker"
            value={selectedDate.toISOString().split('T')[0]}
            max={maxDate}
            onChange={handleDateInputChange}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] p-2.5 rounded-md font-[var(--font-body)] w-full sm:w-auto text-center appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-glow)]"
            style={{ colorScheme: 'dark' }} // For better dark mode styling of date picker icon
          />
        </div>
      </div>
    </header>
  );
};