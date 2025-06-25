
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore } from './services/firestoreService';
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

  const formatDateForKey = (date: Date): string => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD for document ID
  };

  const loadData = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setSelectedPlayer(null);
    
    const dateKey = formatDateForKey(date);
    const humanReadableDate = formatDateForDisplay(date);

    try {
      console.log(`Attempting to load data for ${dateKey} from Firestore...`);
      let data = await getAnalysisReportFromFirestore(dateKey);

      if (data) {
        console.log(`Data for ${dateKey} successfully loaded from Firestore.`);
        setAnalysisData(data);
        if (data.recommendations && data.recommendations.length > 0) {
          setSelectedPlayer(data.recommendations[0]);
        }
      } else {
        console.log(`No data in Firestore for ${dateKey}. Fetching from Gemini API...`);
        data = await fetchAnalysisForDate(dateKey, humanReadableDate);
        console.log(`Data for ${dateKey} successfully fetched from Gemini API.`);
        setAnalysisData(data);
        if (data.recommendations && data.recommendations.length > 0) {
          setSelectedPlayer(data.recommendations[0]);
        }
        // Save the newly fetched data to Firestore (do not await, let it run in background)
        // Only save if data is valid
        if (data && data.recommendations && data.recommendations.length > 0) {
            console.log(`Attempting to save data for ${dateKey} to Firestore...`);
            saveAnalysisReportToFirestore(dateKey, data)
              .catch(fsError => console.error("Failed to save report to Firestore in background:", fsError));
        } else {
            console.warn(`Not saving data for ${dateKey} to Firestore due to invalid or empty report from Gemini.`);
        }
      }
    } catch (err) {
      console.error(`Error in loadData for date ${dateKey}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
      setError(errorMessage);
      // Log the full error if it's not a simple message string
      if (!(err instanceof Error && err.message === errorMessage)) {
        console.error("Full error object:", err);
      }
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
      <div className="flex-grow flex flex-col md:overflow-y-auto">
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
          {!analysisData && !isLoading && !error && (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                  <FiAlertTriangle className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
                  <h2 className="text-2xl font-[var(--font-display)] text-[var(--text-primary)]">No Data Available</h2>
                  <p className="text-[var(--text-secondary)]">Player analysis data could not be loaded for the selected date.</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">This could be due to no games on this day, or an issue fetching the analysis.</p>
              </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;