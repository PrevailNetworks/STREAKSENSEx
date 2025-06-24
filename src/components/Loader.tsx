
import React, { useState, useEffect } from 'react';
import { IoBaseball } from 'react-icons/io5'; // Import a baseball icon

const LOADING_MESSAGES = [
  "Scanning Player Stats...",
  "Checking Schedules...",
  "Analyzing Matchups...",
  "Evaluating Park Factors...",
  "Considering Weather Conditions...",
  "Simulating Game Outcomes...",
  "Consulting Predictive Models...",
  "Cross-Referencing Historical Data...",
  "Applying STREAKSENSE Algorithm...",
  "Finalizing Top Picks...",
  "Almost There...",
];

interface LoaderProps {
  message?: string; // This can be an initial message, or ignored if we always cycle
}

export const Loader: React.FC<LoaderProps> = ({ message }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessage, setDisplayedMessage] = useState(message || LOADING_MESSAGES[0]);

  useEffect(() => {
    // Set the initial message
    setDisplayedMessage(message || LOADING_MESSAGES[0]);

    // Start cycling after a short delay to show the initial/prop message first
    const initialDelayTimer = setTimeout(() => {
      // Set to the first message of the cycle if a custom message was shown
      if (message) {
         setCurrentMessageIndex(0); // Start cycle from beginning
         setDisplayedMessage(LOADING_MESSAGES[0]);
      }

      const intervalId = setInterval(() => {
        setCurrentMessageIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % LOADING_MESSAGES.length;
          setDisplayedMessage(LOADING_MESSAGES[nextIndex]);
          return nextIndex;
        });
      }, 5000); // Change message every 5 seconds

      return () => clearInterval(intervalId);
    }, message ? 2500 : 0); // Shorter delay if no custom message, immediate if no prop

    return () => clearTimeout(initialDelayTimer);
  }, [message]); // Rerun effect if the initial message prop changes

  return (
    <div className="flex flex-col items-center justify-center py-6 text-[var(--text-secondary)]">
      <IoBaseball 
        className="w-12 h-12 text-[var(--primary-glow)] animate-spin" /* Larger baseball icon */
        role="status"
      />
      <p className="mt-4 font-[var(--font-display)] tracking-wider text-base text-center px-4 min-h-[40px]">
        {displayedMessage}
      </p>
    </div>
  );
};
