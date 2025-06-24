import React from 'react';
import { FiPlay, FiVolume2, FiMoreHorizontal } from 'react-icons/fi';

export const AudioPlayerPlaceholder: React.FC = () => (
  <div className="bg-[var(--main-bg)] p-3 rounded-lg border border-[var(--border-color)]">
    <div className="flex items-center justify-between">
      <button aria-label="Play/Pause" className="text-[var(--text-primary)] hover:text-[var(--primary-glow)] transition-colors">
        <FiPlay className="w-5 h-5" />
      </button>
      <div className="text-xs text-[var(--text-secondary)]">0:00 / 6:51</div> {/* Example times */}
      <div className="flex items-center space-x-2">
        <button aria-label="Volume" className="text-[var(--text-secondary)] hover:text-[var(--primary-glow)] transition-colors">
            <FiVolume2 className="w-4 h-4" />
        </button>
        <button aria-label="More options" className="text-[var(--text-secondary)] hover:text-[var(--primary-glow)] transition-colors">
            <FiMoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
    <div className="relative w-full bg-[var(--border-color)] h-1.5 rounded-full mt-2 group cursor-pointer">
      <div className="bg-[var(--primary-glow)] h-full w-1/4 rounded-full"></div>
      <div className="absolute top-1/2 left-1/4 w-3 h-3 bg-white rounded-full -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  </div>
);
