
import React from 'react';
import { FiMenu, FiCalendar, FiPlay, FiLoader } from 'react-icons/fi'; // Added FiPlay, FiLoader

interface MobileHeaderProps {
  selectedDate: Date;
  onMenuToggle: () => void;
  onDateChange: (date: Date) => void;
  maxDate: string;
  className?: string;
  onLogoClick?: () => void;
  isAudioPlaying: boolean;
  isAudioLoading: boolean;
  audioError: string | null;
  onToggleAudio: () => void;
  // hideMenuButton?: boolean; // Prop removed
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  selectedDate,
  onMenuToggle,
  onDateChange,
  maxDate,
  className,
  onLogoClick,
  isAudioPlaying,
  isAudioLoading,
  audioError,
  onToggleAudio,
  // hideMenuButton // Prop removed
}) => {
  const formattedDate = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateInputId = "mobile-header-date-picker";

  const handleDateInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      const [year, month, day] = dateValue.split('-').map(Number);
      // Construct date as local midnight
      const newSelectedDate = new Date(year, month - 1, day);
      onDateChange(newSelectedDate);
    }
  };
  
  let audioIconTooltip = "Play Daily Overview";
  if (audioError) audioIconTooltip = audioError;
  else if (isAudioLoading) audioIconTooltip = "Loading audio...";
  else if (isAudioPlaying) audioIconTooltip = "Pause Daily Overview";


  return (
    <header className={`flex items-center justify-between p-4 text-[var(--text-primary)] ${className}`}>
      <div
        className={`flex items-center ${onLogoClick ? 'cursor-pointer' : ''}`}
        onClick={onLogoClick}
        title={onLogoClick ? "Go to Dashboard/Home" : "STREAKSENSE"}
      >
        <h1 className="font-[var(--font-display)] font-bold text-xl sm:text-2xl tracking-tight uppercase neon-text italic">
          STREAKSENSE
        </h1>
      </div>
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Date Picker */}
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
            className="opacity-0 w-full h-full absolute top-0 left-0 cursor-pointer"
            style={{ colorScheme: 'dark' }}
            aria-label="Select analysis date"
          />
        </div>

        {/* Audio Toggle Button */}
        <button
            onClick={onToggleAudio}
            disabled={isAudioLoading || !!audioError}
            className={`relative text-[var(--text-primary)] hover:text-[var(--primary-glow)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed
                        ${isAudioPlaying ? 'audio-playing-pulse' : ''}`}
            aria-label={audioIconTooltip}
            title={audioIconTooltip}
        >
            {isAudioLoading ? <FiLoader size={20} className="animate-spin" /> : <FiPlay size={20} className={isAudioPlaying ? 'fill-current' : ''}/>}
        </button>

        {/* Menu button should always be visible now */}
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
