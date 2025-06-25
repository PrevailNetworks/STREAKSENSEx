
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { Header } from '@/components/Header'; // Import the Header component
import { fetchAnalysisForDate } from './services/geminiService';
import type { AnalysisReport, PlayerData } from './types';
import { FiAlertTriangle } from 'react-icons/fi';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const loadData = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setSelectedPlayer(null);
    try {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const data = await fetchAnalysisForDate(formattedDate, formatDateForDisplay(date));
      setAnalysisData(data);
      if (data.recommendations && data.recommendations.length > 0) {
        setSelectedPlayer(data.recommendations[0]); // Select the first player by default
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate, loadData]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handlePlayerSelect = (player: PlayerData) => {
    setSelectedPlayer(player);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[var(--sidebar-bg)] font-[var(--font-body)]">
      <Sidebar
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        analysisData={analysisData}
        onPlayerSelect={handlePlayerSelect}
        selectedPlayerId={selectedPlayer?.player}
        isLoading={isLoading}
      />
      {/* Main content area including the header that's responsive */}
      <div className="flex-grow flex flex-col md:overflow-y-auto"> {/* Added overflow for md screens if content + header is too tall */}
        {/* Main page header - visible on md and up */}
        <div className="hidden md:block bg-[var(--main-bg)] px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
            <Header selectedDate={selectedDate} onDateChange={handleDateChange} />
        </div>

        {/* The rest of the main content */}
        <main className="flex-grow bg-[var(--main-bg)] p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto md:overflow-y-visible">
          {isLoading && (
            <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
              <Loader message="Analyzing Matchups..." />
            </div>
          )}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
              <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
              <p className="text-[var(--text-secondary)]">{error}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
            </div>
          )}
          {analysisData && selectedPlayer && !isLoading && !error && (
            <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />
          )}
          {!analysisData && !selectedPlayer && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                  <FiAlertTriangle className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
                  <h2 className="text-2xl font-[var(--font-display)] text-[var(--text-primary)]">No Data Available</h2>
                  <p className="text-[var(--text-secondary)]">Player analysis data could not be loaded for the selected date.</p>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
