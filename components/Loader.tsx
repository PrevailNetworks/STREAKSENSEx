
import React from 'react';

interface LoaderProps {
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-[var(--text-secondary)]">
      <div 
        className="w-12 h-12 border-4 border-[var(--border-color)] border-t-4 border-t-[var(--primary-glow)] rounded-full animate-spin"
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
      <p className="mt-4 font-[var(--font-display)] tracking-wider text-lg">{message}</p>
    </div>
  );
};