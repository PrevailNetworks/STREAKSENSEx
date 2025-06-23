
import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ExecutiveSummaryCard } from './components/ExecutiveSummaryCard';
import { SynopsisTable } from './components/SynopsisTable';
import { PlayerCard } from './components/PlayerCard';
import { WatchListCard } from './components/WatchListCard';
import { fetchAnalysisForDate } from './services/geminiService';
import type { AnalysisReport } from './types';
import { FiAlertTriangle } from 'react-icons/fi';

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
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
    try {
      const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const data = await fetchAnalysisForDate(formattedDate, formatDateForDisplay(date));
      setAnalysisData(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]); // Intentionally only run when selectedDate changes. `loadData` is memoized.

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 bg-transparent relative z-10">
      <Header selectedDate={selectedDate} onDateChange={handleDateChange} />
      <main className="flex-grow pt-6">
        {isLoading && <Loader message="INITIALIZING STREAKSENSE HUB..." />}
        {error && (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--bg-card)] rounded-lg shadow-xl border border-[var(--border-color)]">
            <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
            <h2 className="text-2xl font-['Orbitron'] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
            <p className="text-[var(--text-secondary)]">{error}</p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
          </div>
        )}
        {analysisData && !isLoading && !error && (
          <div className="space-y-6">
            <ExecutiveSummaryCard summary={analysisData.executiveSummary} reportDate={analysisData.date} />
            <SynopsisTable synopsis={analysisData.executiveSummary.keyTableSynopsis} />
            
            <h2 className="text-2xl font-['Orbitron'] text-[var(--primary-glow)] border-b border-[var(--border-color)] pb-2">Player Deep Dives</h2>
            <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
              {analysisData.recommendations.map((player, index) => (
                <PlayerCard key={player.player + index} player={player} cardIndex={index}/>
              ))}
            </div>
            <WatchListCard watchList={analysisData.watchListCautionaryNotes} />
          </div>
        )}
      </main>
      <footer className="text-center py-4 mt-8 text-[var(--text-secondary)] text-sm border-t border-[var(--border-color)]">
        STREAKSENSE Analytics Hub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
