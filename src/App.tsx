
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore, FirestoreReportWithTimestamp } from './services/firestoreService';
import type { AnalysisReport, PlayerData } from './types';
import { FiAlertTriangle } from 'react-icons/fi';
import { useAuth, EMAIL_FOR_SIGN_IN_LINK_KEY } from './contexts/AuthContext';
import { MobileHeader } from './components/MobileHeader';
import { FlyoutMenu } from './components/FlyoutMenu';
import { MobilePlayerPicker } from './components/MobilePlayerPicker';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage'; 
import { AuthModal } from './components/AuthModal'; 
import { formatDateForDisplay, formatDateForKey } from './utils/dateUtils';


const STALE_THRESHOLD_HOURS = 4;
const REFRESH_CUTOFF_UTC_HOUR = 23; 

type AppView = 'landing' | 'dashboard' | 'analytics';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); 
  const [error, setError] = useState<string | null>(null);
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false); 

  const authContext = useAuth();
  const { currentUser, loading: authLoading } = authContext;

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

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

  useEffect(() => {
    if (authLoading) return; 

    if (currentView === 'landing' && currentUser) {
      setCurrentView('dashboard'); 
    } else if (currentView === 'landing' && !currentUser) {
      // Stay on landing
    } else if (currentUser) {
      if (currentView !== 'analytics') {
        setCurrentView('dashboard');
      }
    } else {
      if (currentView !== 'analytics') {
         setCurrentView('landing'); 
      }
    }
  }, [currentUser, authLoading, currentView]);


  const loadData = useCallback(async (dateToLoad: Date) => {
    setIsLoading(true);
    setError(null);
    
    const dateKey = formatDateForKey(dateToLoad);
    const humanReadable = formatDateForDisplay(dateToLoad);
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
            const isCurrentSelectedPlayerValid = selectedPlayer && 
              firestoreResult.report.recommendations.some(p => p.player === selectedPlayer.player);
            if (!isCurrentSelectedPlayerValid) {
              setSelectedPlayer(firestoreResult.report.recommendations[0]);
            }
          } else {
            setSelectedPlayer(null);
          }
        }
      } else {
        forceRefresh = true; 
      }

      if (forceRefresh) {
        const geminiData = await fetchAnalysisForDate(dateKey, humanReadable);
        setAnalysisData(geminiData);
        if (geminiData.recommendations && geminiData.recommendations.length > 0) {
          setSelectedPlayer(geminiData.recommendations[0]);
        } else {
          setSelectedPlayer(null);
        }
        
        if (geminiData && geminiData.recommendations && geminiData.recommendations.length > 0) {
            saveAnalysisReportToFirestore(dateKey, geminiData)
              .catch(fsError => console.error("Failed to save report to Firestore in background:", fsError));
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
      setError(errorMessage);
      setAnalysisData(null); 
      setSelectedPlayer(null);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (currentView === 'analytics' && !authLoading) { 
        loadData(selectedDate);
    }
  }, [selectedDate, loadData, authLoading, currentView]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsFlyoutOpen(false); 
  };

  const handlePlayerSelect = (player: PlayerData) => {
    setSelectedPlayer(player);
  };
  
  if (authLoading && currentView !== 'landing') { // Show full page loader only if not on landing
    return (
      <div className="min-h-screen bg-[var(--sidebar-bg)] flex items-center justify-center">
        <Loader message="Initializing STREAKSENSE..." />
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage 
              onEnterApp={() => currentUser ? setCurrentView('dashboard') : setCurrentView('analytics')} 
              onLoginClick={() => setIsAuthModalOpen(true)}
           />;
  }

  if (currentUser && currentView === 'dashboard') {
    return <DashboardPage 
              currentUser={currentUser} 
              selectedDate={selectedDate} // Pass selectedDate
              onNavigateToAnalytics={() => {
                setCurrentView('analytics');
                if (!analysisData || formatDateForKey(selectedDate) !== analysisData.date) {
                    loadData(selectedDate);
                }
              }}
              onLogout={() => {
                authContext.signOutUser();
                setCurrentView('landing'); 
              }}
           />;
  }

  // Analytics View
  let mainContent;
  if (isLoading) { 
    mainContent = (
      <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
        <Loader message="Analyzing Matchups..." />
      </div>
    );
  } else if (error) {
    mainContent = (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full">
        <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
        <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
        <p className="text-[var(--text-secondary)]">{error}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
      </div>
    );
  } else if (analysisData && selectedPlayer) {
    mainContent = <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />;
  } else {
    mainContent = (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full">
          <FiAlertTriangle className="w-16 h-16 text-[var(--text-secondary)] mb-4" />
          <h2 className="text-2xl font-[var(--font-display)] text-[var(--text-primary)]">No Data Available</h2>
          <p className="text-[var(--text-secondary)]">Player analysis data could not be loaded for the selected date.</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">This could be due to no games on this day, or an issue fetching the analysis.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sidebar-bg)] font-[var(--font-body)] flex flex-col">
      <MobileHeader
        selectedDate={selectedDate}
        onMenuToggle={() => setIsFlyoutOpen(true)}
        onDateChange={handleDateChange} 
        maxDate={maxDate} 
        className="md:hidden sticky top-0 z-30 bg-[var(--sidebar-bg)] shadow-md"
        onLogoClick={currentUser ? () => setCurrentView('dashboard') : () => setCurrentView('landing')}
      />

      <FlyoutMenu
        isOpen={isFlyoutOpen}
        onClose={() => setIsFlyoutOpen(false)}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        analysisData={analysisData}
        isLoading={isLoading} 
        maxDate={maxDate} 
        className="md:hidden" 
        onNavigateToDashboard={currentUser ? () => setCurrentView('dashboard') : undefined}
      />

      <div className="flex flex-row flex-1 overflow-hidden">
        <Sidebar
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          analysisData={analysisData}
          onPlayerSelect={handlePlayerSelect}
          selectedPlayerId={selectedPlayer?.player}
          isLoading={isLoading} 
          maxDate={maxDate} 
          className="hidden md:flex md:flex-col"
          onLogoClick={currentUser ? () => setCurrentView('dashboard') : () => setCurrentView('landing')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
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
                           ${selectedPlayer && analysisData ? 'pt-2 md:pt-4' : 'pt-4'}`}>
            {mainContent}
          </main>
        </div>
      </div>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
    </div>
  );
};

export default App;
