
import React from 'react';
import { FiArrowRightCircle, FiTrendingUp, FiZap, FiLogIn } from 'react-icons/fi';

interface LandingPageProps {
  onEnterApp: () => void;
  onLoginClick: () => void; // New prop
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onLoginClick }) => {
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

      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <button
          onClick={onEnterApp}
          className="bg-[var(--primary-glow)] text-black font-semibold text-lg py-4 px-10 rounded-lg shadow-xl hover:opacity-90 transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center group justify-center"
        >
          View Player Analysis
          <FiArrowRightCircle className="ml-3 w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" />
        </button>
        <button
          onClick={onLoginClick} // Use the new prop
          className="border-2 border-[var(--primary-glow)] text-[var(--primary-glow)] font-semibold text-lg py-3.5 px-10 rounded-lg shadow-xl hover:bg-[var(--primary-glow)] hover:text-black transition-all duration-300 ease-in-out transform hover:scale-105 flex items-center group justify-center"
        >
          <FiLogIn className="mr-3 w-6 h-6" />
          Login / Sign Up
        </button>
      </div>


      <section className="w-full max-w-3xl">
        <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-6">Stay Tuned</h2>
        <div className="bg-[var(--card-bg)]/30 p-6 rounded-lg border border-[var(--border-color)]">
          <p className="text-[var(--text-secondary)]">
            Exciting new features, including personalized dashboards, pick tracking, player research chat, and in-depth articles are coming soon to STREAKSENSE!
          </p>
        </div>
      </section>

      <footer className="mt-auto pt-10 text-xs text-[var(--text-secondary)]">
        &copy; {new Date().getFullYear()} STREAKSENSE. All rights reserved. For entertainment purposes only.
      </footer>
    </div>
  );
};
