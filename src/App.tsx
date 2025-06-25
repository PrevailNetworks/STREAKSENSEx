import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore, FirestoreReportWithTimestamp } from './services/firestoreService';
import type { AnalysisReport, PlayerData } from './types';
import { FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from './contexts/AuthContext'; // Added

const STALE_THRESHOLD_HOURS = 4; 
const REFRESH_CUTOFF_UTC_HOUR = 23; 

const EMAIL_FOR_SIGN_IN_LINK_KEY = 'streaksense_emailForSignInLink'; // Consistent key

const App: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const authContext = useAuth(); // Added

  // Effect to handle email link sign-in on component mount
  useEffect(() => {
    const link = window.location.href;
    if (authContext.isSignInWithEmailLink(link)) {
      let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
      if (!email) {
        // Prompt user for email if not found (Firebase requires this)
        email = window.prompt('Please provide your email for confirmation:');
      }
      if (email) {
        authContext.completeSignInWithEmailLink(email, link)
          .then(() => {
            console.log('Successfully signed in with email link.');
            // Optionally, clean up the URL by removing the sign-in link parameters
            if (window.history && window.history.replaceState) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          })
          .catch(err => {
            console.error('Error completing sign in with email link:', err);
            setError('Failed to sign in with email link. Please try again.');
          })
          .finally(() => {
            window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
          });
      } else {
        setError('Email confirmation required to complete sign-in.');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount, authContext functions are stable

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
      console.log(`Attempting to load data for ${dateKey} from Firestore...`);
      const firestoreResult: FirestoreReportWithTimestamp | null = await getAnalysisReportFromFirestore(dateKey);

      if (firestoreResult) {
        const todayKey = formatDateForKey(new Date());
        if (dateKey === todayKey) {
          const now = new Date();
          const dataAgeHours = (now.getTime() - firestoreResult.fetchedAt.getTime()) / (1000 * 60 * 60);
          
          if (dataAgeHours > STALE_THRESHOLD_HOURS) {
            if (now.getUTCHours() < REFRESH_CUTOFF_UTC_HOUR) {
                console.log(`Data for today (${dateKey}) is stale (older than ${STALE_THRESHOLD_HOURS} hours) AND before cutoff time (${REFRESH_CUTOFF_UTC_HOUR}:00 UTC). Forcing refresh from Gemini.`);
                forceRefresh = true;
            } else {
                console.log(`Data for today (${dateKey}) is stale BUT it's past the refresh cutoff time (${REFRESH_CUTOFF_UTC_HOUR}:00 UTC). Using stale Firestore version.`);
            }
          } else {
            console.log(`Data for today (${dateKey}) is fresh. Using Firestore version.`);
          }
        } else {
          console.log(`Data for past date ${dateKey} found in Firestore. Using Firestore version.`);
        }

        if (!forceRefresh) {
          setAnalysisData(firestoreResult.report);
          if (firestoreResult.report.recommendations && firestoreResult.report.recommendations.length > 0) {
            setSelectedPlayer(firestoreResult.report.recommendations[0]);
          }
        }
      } else {
        console.log(`No data in Firestore for ${dateKey}. Will fetch from Gemini API.`);
        forceRefresh = true;
      }

      if (forceRefresh) {
        console.log(`Fetching fresh data for ${dateKey} from Gemini API...`);
        const geminiData = await fetchAnalysisForDate(dateKey, humanReadableDate);
        console.log(`Data for ${dateKey} successfully fetched from Gemini API.`);
        setAnalysisData(geminiData);
        if (geminiData.recommendations && geminiData.recommendations.length > 0) {
          setSelectedPlayer(geminiData.recommendations[0]);
        }
        
        if (geminiData && geminiData.recommendations && geminiData.recommendations.length > 0) {
            console.log(`Attempting to save fresh data for ${dateKey} to Firestore...`);
            saveAnalysisReportToFirestore(dateKey, geminiData)
              .catch(fsError => console.error("Failed to save report to Firestore in background:", fsError));
        } else {
            console.warn(`Not saving data for ${dateKey} to Firestore due to invalid or empty report from Gemini.`);
        }
      }
    } catch (err) {
      console.error(`Error in loadData for date ${dateKey}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
      setError(errorMessage);
      if (!(err instanceof Error && err.message === errorMessage)) {
        console.error("Full error object:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load data if auth is not in its initial loading state.
    // This prevents double-fetching if auth state change triggers re-render.
    if (!authContext.loading) {
        loadData(selectedDate);
    }
  }, [selectedDate, loadData, authContext.loading]); // Added authContext.loading

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
        isLoading={isLoading || authContext.loading} // Consider auth loading as well for sidebar
      />
      <div className="flex-grow flex flex-col md:overflow-y-auto">
        <main className="flex-grow bg-[var(--main-bg)] p-4 sm:p-6 lg:p-8 flex flex-col overflow-y-auto md:overflow-y-visible">
          {(isLoading || authContext.loading) && ( // Check auth loading too
            <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
              <Loader message={authContext.loading ? "Checking auth..." : "Analyzing Matchups..."} />
            </div>
          )}
          {error && !isLoading && !authContext.loading && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
              <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
              <p className="text-[var(--text-secondary)]">{error}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
            </div>
          )}
          {analysisData && selectedPlayer && !isLoading && !error && !authContext.loading && (
            <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />
          )}
          {!analysisData && !isLoading && !error && !authContext.loading && (
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