
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnalyticsContextualPanel } from '@/components/AnalyticsContextualPanel';
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate, fetchStructuredReportForPlayer } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore, FirestoreReportWithTimestamp, getAdditionalPlayerReport, saveAdditionalPlayerReport } from './services/firestoreService';
import { addUserDailyPick, addPlayerToFavorites, removePlayerFromFavorites, getUserFavoritePlayers, getUserDailyPicks, removeUserDailyPick as removePickService } from './services/userService';
import type { AnalysisReport, PlayerData, PlayerPickInfo, FavoritePlayer } from './types';
import { FiAlertTriangle } from 'react-icons/fi';
import { useAuth, EMAIL_FOR_SIGN_IN_LINK_KEY } from './contexts/AuthContext';
import { MobileHeader } from './components/MobileHeader';
import { FlyoutMenu } from './components/FlyoutMenu';
import { MobilePlayerPicker } from './components/MobilePlayerPicker';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { AuthModal } from './components/AuthModal';
import { ChatPanel } from './components/ChatPanel'; // New ChatPanel import
import { PrimaryNavigation } from './components/PrimaryNavigation';
import { formatDateForDisplay, formatDateForKey, formatDateToMMDDYY } from './utils/dateUtils';


const STALE_THRESHOLD_HOURS = 4;
const REFRESH_CUTOFF_UTC_HOUR = 23;

export type AppView = 'landing' | 'dashboard' | 'analytics' | 'researchedPlayer';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisReport | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isFlyoutOpen, setIsFlyoutOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authTriggerView, setAuthTriggerView] = useState<AppView | null>(null);

  // State for the new ChatPanel and displaying its results
  const [isChatPanelOpen, setIsChatPanelOpen] = useState<boolean>(true); // Or manage open/close state
  const [researchedPlayerDataToDisplay, setResearchedPlayerDataToDisplay] = useState<PlayerData | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedDateForAudio, setSelectedDateForAudio] = useState<Date>(selectedDate);

  const [favoritePlayersMap, setFavoritePlayersMap] = useState<Record<string, boolean>>({});

  const authContext = useAuth();
  const { currentUser, loading: authLoading, signOutUser } = authContext;

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      const audioElement = new Audio();
      audioRef.current = audioElement;
      
      audioElement.onloadedmetadata = () => {
        setIsAudioLoading(false);
        setAudioError(null);
      };
      audioElement.onended = () => setIsAudioPlaying(false);
      audioElement.onerror = (e: Event | string) => {
        let message = "Audio error.";
        if (audioElement.error) {
            switch(audioElement.error.code) {
                case MediaError.MEDIA_ERR_ABORTED: message = "Playback aborted."; break;
                case MediaError.MEDIA_ERR_NETWORK: message = "Network error."; break;
                case MediaError.MEDIA_ERR_DECODE: message = "Decode error."; break;
                case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: message = "Audio unavailable."; break;
                default: message = "Unknown audio error.";
            }
        }
        setAudioError(message);
        setIsAudioLoading(false);
        setIsAudioPlaying(false);
      };
    }
  }, []);

   useEffect(() => {
    const fileName = formatDateToMMDDYY(selectedDateForAudio);
    const src = `/audio/${fileName}.mp3`;
    setAudioSrc(src);
  }, [selectedDateForAudio]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.load();
      setIsAudioLoading(true);
      setAudioError(null);
    }
  }, [audioSrc]);

  const toggleAudioPlayPause = useCallback(() => {
    if (audioRef.current && !audioError && !isAudioLoading) {
      if (isAudioPlaying) {
        audioRef.current.pause();
        setIsAudioPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsAudioPlaying(true)).catch(() => {
            setAudioError("Playback failed.");
            setIsAudioPlaying(false);
        });
      }
    }
  }, [isAudioPlaying, audioError, isAudioLoading]);

  useEffect(() => {
    if (currentUser) {
      getUserFavoritePlayers(currentUser.uid).then(favs => {
        const favMap: Record<string, boolean> = {};
        favs.forEach(fav => favMap[fav.playerId] = true);
        setFavoritePlayersMap(favMap);
      });
    } else {
      setFavoritePlayersMap({});
    }
  }, [currentUser]);

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

    if (currentUser) {
      if (authTriggerView === 'landing' || currentView === 'landing') {
        setCurrentView('dashboard');
      } else if (currentView !== 'analytics' && currentView !== 'dashboard' && currentView !== 'researchedPlayer') {
        setCurrentView('dashboard');
      }
      setAuthTriggerView(null);
    } else {
      if (currentView === 'dashboard' || currentView === 'researchedPlayer') {
        setCurrentView('landing');
      }
    }
  }, [currentUser, authLoading, currentView, authTriggerView]);

  const loadData = useCallback(async (dateToLoad: Date, currentPlayerDataToPreserve?: PlayerData | null) => {
    setIsLoading(true);
    setError(null);
    setResearchedPlayerDataToDisplay(null); // Clear researched player when loading main analytics
    const dateKey = formatDateForKey(dateToLoad);
    const humanReadable = formatDateForDisplay(dateToLoad);
    let forceRefresh = false;

    try {
      const firestoreResult: FirestoreReportWithTimestamp | null = await getAnalysisReportFromFirestore(dateKey);
      let reportToSet: AnalysisReport | null = null;

      if (firestoreResult) {
        const todayKey = formatDateForKey(new Date());
        if (dateKey === todayKey) {
          const now = new Date();
          const dataAgeHours = (now.getTime() - firestoreResult.fetchedAt.getTime()) / (1000 * 60 * 60);
          if (dataAgeHours > STALE_THRESHOLD_HOURS && now.getUTCHours() < REFRESH_CUTOFF_UTC_HOUR) {
            forceRefresh = true;
          }
        }
        if (!forceRefresh) {
          reportToSet = firestoreResult.report;
        }
      } else { forceRefresh = true; }

      if (forceRefresh) {
        const geminiData = await fetchAnalysisForDate(dateKey, humanReadable);
        reportToSet = geminiData;
        if (geminiData && geminiData.recommendations && geminiData.recommendations.length > 0) {
          saveAnalysisReportToFirestore(dateKey, geminiData)
            .catch(fsError => console.error("Failed to save report to Firestore in background:", fsError));
        }
      }
      
      setAnalysisData(reportToSet);
      if (reportToSet && reportToSet.recommendations && reportToSet.recommendations.length > 0) {
        const isCurrentPlayerStillInRecommendations = currentPlayerDataToPreserve && reportToSet.recommendations.some(p => p.player === currentPlayerDataToPreserve.player && p.team === currentPlayerDataToPreserve.team);
        if (isCurrentPlayerStillInRecommendations && currentPlayerDataToPreserve) {
          setSelectedPlayer(currentPlayerDataToPreserve);
        } else {
          setSelectedPlayer(reportToSet.recommendations[0]);
        }
      } else {
        setSelectedPlayer(null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while loading data.';
      setError(errorMessage);
      setAnalysisData(null);
      setSelectedPlayer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'analytics' && !authLoading) {
      loadData(selectedDate, selectedPlayer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, currentView, authLoading]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    // If current view is researchedPlayer, switch to analytics for the new date
    if (currentView === 'researchedPlayer') {
        setCurrentView('analytics');
    }
    setIsFlyoutOpen(false);
  };
  
  const handleMobileHeaderDateChange = (date: Date) => {
    setSelectedDateForAudio(date);
    handleDateChange(date);
  };

  const handlePlayerSelect = (player: PlayerData) => {
    setSelectedPlayer(player);
    setResearchedPlayerDataToDisplay(null); // Clear researched player
    setCurrentView('analytics'); // Ensure view is analytics
  };
  
  const openAuthModal = (triggeredFromView?: AppView) => {
    setAuthTriggerView(triggeredFromView || currentView);
    setIsAuthModalOpen(true);
  };
  
  const handleSetCurrentView = (view: AppView) => {
    if (view !== 'researchedPlayer') {
        setResearchedPlayerDataToDisplay(null);
    }
    setCurrentView(view);
  };

  const ensureStructuredReport = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>, forDateKey: string, forHumanReadableDate: string): Promise<PlayerData | null> => {
    const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
    
    // Check main recommendations if analysisData is loaded and matches the forDateKey
    // Only check main analysisData if selectedDate matches the date for the report.
    if (formatDateForKey(selectedDate) === forDateKey && analysisData) {
        const mainRec = analysisData.recommendations.find(p => (p.mlbId === playerId) || (p.player === playerData.player && p.team === playerData.team));
        if (mainRec && mainRec.playerSpecificVerdict) return mainRec;
    }
    
    let report = await getAdditionalPlayerReport(forDateKey, playerId);
    if (report) return report;
    
    console.log(`Report not found in cache for ${playerData.player} on ${forDateKey}, fetching from Gemini...`);
    report = await fetchStructuredReportForPlayer(playerData.player, forDateKey, forHumanReadableDate);
    if (report) {
      await saveAdditionalPlayerReport(forDateKey, playerId, report);
      return report;
    }
    return null;
  };

  const handleSetPick = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => {
    if (!currentUser) { openAuthModal(currentView); return; }
    // Use selectedDate from App state for consistency, not from a specific component's prop
    const dateKeyForPick = formatDateForKey(selectedDate);
    const humanReadableForPick = formatDateForDisplay(selectedDate);

    const fullReport = await ensureStructuredReport(playerData, dateKeyForPick, humanReadableForPick);
    if (!fullReport) {
      alert(`Could not retrieve full data for ${playerData.player} to set pick.`);
      return;
    }

    const pickInfoToAdd: Omit<PlayerPickInfo, 'pickedAt' | 'pickDate'> = {
      playerId: fullReport.mlbId || fullReport.player.toLowerCase().replace(/\s+/g, '-'),
      playerName: fullReport.player,
      team: fullReport.team,
      source: 'researched', // This could be more dynamic if picks can be set from different contexts
    };

    try {
      const result = await addUserDailyPick(currentUser.uid, dateKeyForPick, pickInfoToAdd);
      alert(result.message);
    } catch (e) {
      console.error("Error setting pick:", e);
      alert(`Failed to set pick for ${fullReport.player}.`);
    }
  };

  const handleToggleFavorite = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => {
    if (!currentUser) { openAuthModal(currentView); return; }
    const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
    const isFav = favoritePlayersMap[playerId];
    
    let fullReport: PlayerData | null = null;
    if (!isFav) {
      // Use selectedDate from App state
      const dateKeyForFavorite = formatDateForKey(selectedDate);
      const humanReadableForFavorite = formatDateForDisplay(selectedDate);
      fullReport = await ensureStructuredReport(playerData, dateKeyForFavorite, humanReadableForFavorite);
      if (!fullReport) { alert(`Could not retrieve full data for ${playerData.player} to manage favorite.`); return; }
    }

    try {
      if (isFav) {
        await removePlayerFromFavorites(currentUser.uid, playerId);
        setFavoritePlayersMap(prev => {
            const newMap = {...prev};
            delete newMap[playerId];
            return newMap;
        });
        alert(`${playerData.player} removed from favorites.`);
      } else if (fullReport) {
        await addPlayerToFavorites(currentUser.uid, {
            player: fullReport.player,
            team: fullReport.team,
            mlbId: fullReport.mlbId,
        });
        setFavoritePlayersMap(prev => ({ ...prev, [playerId]: true }));
        alert(`${playerData.player} added to favorites!`);
      }
    } catch (e) { console.error("Error toggling favorite:", e); alert(`Failed to update favorites for ${playerData.player}.`); }
  };

  const handleViewPlayerAnalytics = async (playerInfo: Pick<PlayerData, 'player' | 'team' | 'mlbId'>, dateForAnalysis: Date) => {
    setIsLoading(true);
    setCurrentView('analytics'); // Switch view first
    setSelectedDate(dateForAnalysis); // Set date for analytics
    
    // loadData will be triggered by useEffect due to selectedDate/currentView change.
    // We need to ensure the *specific player* is selected after data loads.
    
    // To select the specific player *after* loadData completes for the new date:
    const dateKey = formatDateForKey(dateForAnalysis);
    const humanReadable = formatDateForDisplay(dateForAnalysis);

    // Ensure analysis for the date is loaded or reloaded
    if (!analysisData || formatDateForKey(selectedDate) !== dateKey || currentView !== 'analytics') {
      await loadData(dateForAnalysis); // Wait for this to potentially update analysisData
    }
    
    // Now, ensure the specific player report is fetched and set
    const fullReport = await ensureStructuredReport(playerInfo, dateKey, humanReadable);
    
    if (fullReport) {
        setSelectedPlayer(fullReport);
        setResearchedPlayerDataToDisplay(null);
    } else {
        alert(`Could not load analysis for ${playerInfo.player}.`);
        setSelectedPlayer(null); // Clear selected player if report fails
    }
    setIsLoading(false);
  };
  
  const handleDisplayResearchedPlayer = (playerData: PlayerData) => {
    setResearchedPlayerDataToDisplay(playerData);
    setSelectedPlayer(null); // Clear main analytics player
    setAnalysisData(null); // Clear main analytics report
    setCurrentView('researchedPlayer');
    // The date for this researched player is implicitly the App's `selectedDate`
  };


  if (authLoading && currentView !== 'landing' && !currentUser) {
    return (
      <div className="min-h-screen bg-[var(--sidebar-bg)] flex items-center justify-center">
        <Loader message="Initializing STREAKSENSE..." />
      </div>
    );
  }

  let mainContentArea;

  if (currentView === 'dashboard' && currentUser) {
    mainContentArea = (
      <DashboardPage
        currentUser={currentUser}
        selectedDate={selectedDate} // Dashboard operates on app's selectedDate
        onViewPlayerAnalytics={handleViewPlayerAnalytics}
        onLogout={async () => { await signOutUser(); setCurrentView('landing');}}
        favoritePlayers={[]} // This prop might need updating based on how favorites are managed globally or fetched by DashboardPage itself
        handleToggleFavorite={handleToggleFavorite}
        onDateChange={handleDateChange} // Allow dashboard to change app's selectedDate
      />
    );
  } else if (currentView === 'analytics') {
    mainContentArea = (
      <div className="flex flex-row flex-1 overflow-hidden">
        <AnalyticsContextualPanel
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          analysisData={analysisData}
          onPlayerSelect={handlePlayerSelect}
          selectedPlayerId={selectedPlayer?.mlbId || selectedPlayer?.player}
          isLoading={isLoading}
          maxDate={maxDate}
          className="hidden md:flex md:flex-col"
          currentUser={currentUser}
          favoritePlayersMap={favoritePlayersMap}
          onSetPick={handleSetPick}
          onToggleFavorite={handleToggleFavorite}
          onOpenAuthModal={() => openAuthModal(currentView)}
        />
        <div className="flex-1 flex flex-col overflow-y-auto" id="main-content-scroll-area">
          <MobilePlayerPicker
            analysisData={analysisData}
            onPlayerSelect={handlePlayerSelect}
            selectedPlayerId={selectedPlayer?.mlbId || selectedPlayer?.player}
            isLoading={isLoading}
            className="md:hidden sticky top-0 z-20 bg-[var(--main-bg)] shadow-sm"
            currentUser={currentUser}
            favoritePlayersMap={favoritePlayersMap}
            onSetPick={handleSetPick}
            onToggleFavorite={handleToggleFavorite}
            onOpenAuthModal={() => openAuthModal(currentView)}
            selectedDate={selectedDate}
          />
          <main className={`flex-grow bg-[var(--main-bg)] p-4 sm:p-6 lg:p-8 flex flex-col ${selectedPlayer && analysisData ? 'pt-2 md:pt-4' : 'pt-4'}`}>
            {isLoading && !error ? (
                <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
                    <Loader message="Analyzing Matchups..." />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center text-center p-8 h-full">
                    <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
                    <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
                    <p className="text-[var(--text-secondary)]">{error}</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
                </div>
            ) : analysisData && selectedPlayer ? (
                <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />
            ) : (
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
  } else if (currentView === 'researchedPlayer' && researchedPlayerDataToDisplay) {
      mainContentArea = (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[var(--main-bg)]">
            <MainDisplay player={researchedPlayerDataToDisplay} reportDate={formatDateForDisplay(selectedDate)} />
        </div>
      );
  } else if (isLoading && (currentView === 'dashboard' || currentView === 'researchedPlayer')) {
      mainContentArea = <div className="flex-1 flex items-center justify-center"><Loader message="Loading content..." /></div>;
  } else {
      // Fallback for unexpected view state or no user for dashboard
      mainContentArea = <div className="flex-1 flex items-center justify-center p-8 text-center"><p className="text-[var(--text-secondary)]">Please select a view or log in.</p></div>;
  }


  if (currentView === 'landing') {
    return (
        <>
            <LandingPage
              onEnterApp={() => currentUser ? handleSetCurrentView('dashboard') : handleSetCurrentView('analytics')}
              onLoginClick={() => openAuthModal('landing')}
            />
            {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
        </>
    );
  }
  
  return (
    <>
      <div className="min-h-screen bg-[var(--sidebar-bg)] font-[var(--font-body)] flex flex-col md:flex-row">
        <PrimaryNavigation
          currentView={currentView}
          onSetView={handleSetCurrentView}
          currentUser={currentUser}
          onLogout={async () => { await signOutUser(); handleSetCurrentView('landing');}}
          onOpenAuthModal={() => openAuthModal()}
          // onOpenResearchChat is removed
        />
        <MobileHeader
          selectedDate={selectedDateForAudio}
          onMenuToggle={() => setIsFlyoutOpen(true)}
          onDateChange={handleMobileHeaderDateChange}
          maxDate={maxDate}
          className="md:hidden sticky top-0 z-30 bg-[var(--sidebar-bg)] shadow-md"
          onLogoClick={currentUser ? () => handleSetCurrentView('dashboard') : () => handleSetCurrentView('landing')}
          isAudioPlaying={isAudioPlaying}
          isAudioLoading={isAudioLoading}
          audioError={audioError}
          onToggleAudio={toggleAudioPlayPause}
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
          onNavigateToDashboard={currentUser ? () => {handleSetCurrentView('dashboard'); setIsFlyoutOpen(false);} : undefined}
          onOpenAuthModal={() => {setIsFlyoutOpen(false); openAuthModal(currentView);}}
          // onOpenResearchChat is removed
          currentUser={currentUser}
          favoritePlayersMap={favoritePlayersMap}
          onSetPick={handleSetPick}
          onToggleFavorite={handleToggleFavorite}
        />
        
        {/* ChatPanel for Desktop */}
        {currentUser && (
            <ChatPanel
                className="hidden md:flex" // Show on desktop
                selectedDate={selectedDate}
                onDisplayResearchedPlayer={handleDisplayResearchedPlayer}
                onSetPick={handleSetPick}
                onToggleFavorite={handleToggleFavorite}
                favoritePlayersMap={favoritePlayersMap} 
                onOpenAuthModal={() => openAuthModal(currentView)} 
            />
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          {mainContentArea}
        </div>
      </div>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
    </>
  );
};

export default App;
