
import React from 'react';
import { FiArrowRightCircle, FiTrendingUp, FiZap } from 'react-icons/fi'; // Added FiZap

interface LandingPageProps {
  onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--sidebar-bg)] to-[var(--main-bg)] text-[var(--text-primary)] flex flex-col items-center justify-center p-6 sm:p-12 text-center">
      <header className="mb-12">
        <h1 className="font-[var(--font-display)] font-extrabold text-5xl sm:text-7xl tracking-tighter uppercase neon-text italic mb-4">
          STREAKSENSE
        </h1>
        <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
          Your AI-powered edge for MLB "Beat the Streak" analysis. Dive deep into daily player insights and make smarter picks.
        </p>
      </header>

      <div className="mb-12 flex flex-col sm:flex-row gap-6 sm:gap-8 items-center justify-center">
          <div className="flex items-center text-lg p-4 bg-[var(--card-bg)]/50 rounded-lg border border-[var(--border-color)]">
              <FiTrendingUp className="text-[var(--primary-glow)] w-7 h-7 mr-3"/>
              <span>Data-Driven Picks</span>
          </div>
          <div className="flex items-center text-lg p-4 bg-[var(--card-bg)]/50 rounded-lg border border-[var(--border-color)]">
              <FiZap className="text-[var(--primary-glow)] w-7 h-7 mr-3"/>
              <span>Daily AI Analysis</span>
          </div>
      </div>

      <button
        onClick={onEnterApp}
        className="bg-[var(--primary-glow)] text-black font-semibold text-lg py-4 px-10 rounded-lg shadow-xl hover:opacity-90 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center group"
      >
        View Player Analysis
        <FiArrowRightCircle className="ml-3 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
      </button>

      <section className="mt-20 w-full max-w-3xl">
        <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-6">Stay Tuned</h2>
        <div className="bg-[var(--card-bg)]/30 p-6 rounded-lg border border-[var(--border-color)]">
          <p className="text-[var(--text-secondary)]">
            Exciting new features, including in-depth articles and advanced analytical tools, are coming soon to STREAKSENSE!
          </p>
        </div>
      </section>

      <footer className="mt-auto pt-10 text-xs text-[var(--text-secondary)]">
        &copy; {new Date().getFullYear()} STREAKSENSE. All rights reserved. For entertainment purposes only.
      </footer>
    </div>
  );
};
