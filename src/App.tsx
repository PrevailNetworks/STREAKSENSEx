
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore, FirestoreReportWithTimestamp } from './services/firestoreService';
import type { AnalysisReport, PlayerData } from './types';
import { FiAlertTriangle } from 'react-icons/fi';
import { useAuth, EMAIL_FOR_SIGN_IN_LINK_KEY } from './contexts/AuthContext';
import { MobileHeader } from './components/MobileHeader'; // Added
import { FlyoutMenu } from './components/FlyoutMenu'; // Added
import { MobilePlayerPicker } from './components/MobilePlayerPicker'; // Added

const STALE_THRESHOLD_HOURS = 4;
const REFRESH_CUTOFF_UTC_HOUR = 23;

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false); // Added for FlyoutMenu

  const authContext = useAuth();

  useEffect(() => {
    const link = window.location.href;
    if (authContext.isSignInWithEmailLink(link)) {
      let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
      if (!email) {
        email = window.prompt('Please provide your email to complete sign-in:');
      }
      if (email) {
        authContext.completeSignInWithEmailLink(email, link)
          .then(() => {
            console.log('Successfully signed in with email link.');
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(err => {
            console.error('Error completing sign in with email link:', err);
            setError('Failed to sign in with email link. Link may be expired or invalid.');
          })
          .finally(() => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
            }
          });
      } else {
        setError('Email confirmation required to complete sign-in with link.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDateForDisplay = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const loadData = useCallback(async (date: Date) => {
    setIsLoading(true);
    setError(null);
    setAnalysisData(null);
    setSelectedPlayer(null);

    const dateKey = formatDateForKey(date);
    const humanReadableDate = formatDateForDisplay(date);
    let forceRefresh = false;

    try {
      const firestoreResult: FirestoreReportWithTimestamp | null = await getAnalysisReportFromFirestore(dateKey);

      if (firestoreResult) {
        const todayKey = formatDateForKey(new Date());
        if (dateKey === todayKey) {
          const now = new Date();
          const dataAgeHours = (now.getTime() - firestoreResult.fetchedAt.getTime()) / (1000 * 60 * 60);
          
          if (dataAgeHours > STALE_THRESHOLD_HOURS) {
            if (now.getUTCHours() < REFRESH_CUTOFF_UTC_HOUR) {
                forceRefresh = true;
            }
          }
        }

        if (!forceRefresh) {
          setAnalysisData(firestoreResult.report);
          if (firestoreResult.report.recommendations && firestoreResult.report.recommendations.length > 0) {
            setSelectedPlayer(firestoreResult.report.recommendations[0]);
          }
        }
      } else {
        forceRefresh = true;
      }

      if (forceRefresh) {
        const geminiData = await fetchAnalysisForDate(dateKey, humanReadableDate);
        setAnalysisData(geminiData);
        if (geminiData.recommendations && geminiData.recommendations.length > 0) {
          setSelectedPlayer(geminiData.recommendations[0]);
        }
        
        if (geminiData && geminiData.recommendations && geminiData.recommendations.length > 0) {
            saveAnalysisReportToFirestore(dateKey, geminiData)
              .catch(fsError => console.error("Failed to save report to Firestore in background:", fsError));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authContext.loading) {
        loadData(selectedDate);
    }
  }, [selectedDate, loadData, authContext.loading]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsFlyoutOpen(false); // Close flyout when date changes from flyout
  };

  const handlePlayerSelect = (player: PlayerData) => {
    setSelectedPlayer(player);
    // Potentially close MobilePlayerPicker's expanded view if it's open
  };
  
  const overallIsLoading = isLoading || authContext.loading;

  return (
    <div className="min-h-screen bg-[var(--sidebar-bg)] font-[var(--font-body)] flex flex-col">
      <MobileHeader
        selectedDate={selectedDate}
        onMenuToggle={() => setIsFlyoutOpen(true)}
        className="md:hidden sticky top-0 z-30 bg-[var(--sidebar-bg)] shadow-md"
      />

      <FlyoutMenu
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        analysisData={analysisData}
        isLoading={overallIsLoading}
        className="md:hidden" // Ensures it's part of the mobile layout flow
      />

      <div className="flex flex-row flex-1 overflow-hidden">
        <Sidebar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          analysisData={analysisData}
          onPlayerSelect={handlePlayerSelect}
          selectedPlayerId={selectedPlayer?.player}
          isLoading={overallIsLoading}
          className="hidden md:flex md:flex-col" // Only for desktop
        />

        <div className="flex-1 flex flex-col overflow-y-auto" id="main-content-scroll-area">
          <MobilePlayerPicker
            analysisData={analysisData}
            onPlayerSelect={handlePlayerSelect}
            selectedPlayerId={selectedPlayer?.player}
            isLoading={isLoading}
            className="md:hidden sticky top-0 z-20 bg-[var(--main-bg)] shadow-sm"
          />

          <main className={`flex-grow bg-[var(--main-bg)] p-4 sm:p-6 lg:p-8 flex flex-col 
                           ${selectedPlayer && analysisData ? 'pt-2 md:pt-4' : 'pt-4'}`}> {/* Adjust pt based on picker presence */}
            {overallIsLoading && (
              <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
                <Loader message={authContext.loading ? "Authenticating..." : "Analyzing Matchups..."} />
              </div>
            )}
            {error && !overallIsLoading && (
              <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
                <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
                <p className="text-[var(--text-secondary)]">{error}</p>
                <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
              </div>
            )}
            {analysisData && selectedPlayer && !overallIsLoading && !error && (
              <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />
            )}
            {!analysisData && !selectedPlayer && !overallIsLoading && !error && (
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
    </div>
  );
};

export default App;
