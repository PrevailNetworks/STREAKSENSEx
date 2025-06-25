
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar, RecommendationItemProps } from '@/components/Sidebar'; // Assuming RecommendationItemProps is exported if needed
import { MainDisplay } from '@/components/MainDisplay';
import { Loader } from '@/components/Loader';
import { fetchAnalysisForDate, fetchStructuredReportForPlayer } from './services/geminiService';
import { getAnalysisReportFromFirestore, saveAnalysisReportToFirestore, FirestoreReportWithTimestamp, getAdditionalPlayerReport, saveAdditionalPlayerReport } from './services/firestoreService';
import { saveUserDailyPick, addPlayerToFavorites, removePlayerFromFavorites, isPlayerFavorite, getUserFavoritePlayers, FavoritePlayer } from './services/userService';
import type { AnalysisReport, PlayerData } from './types';
import { FiAlertTriangle } from 'react-icons/fi';
import { useAuth, EMAIL_FOR_SIGN_IN_LINK_KEY } from './contexts/AuthContext';
import { MobileHeader } from './components/MobileHeader';
import { FlyoutMenu } from './components/FlyoutMenu';
import { MobilePlayerPicker } from './components/MobilePlayerPicker';
import { LandingPage } from './components/LandingPage';
import { DashboardPage } from './components/DashboardPage';
import { AuthModal } from './components/AuthModal';
import { PlayerResearchChat } from './components/PlayerResearchChat';
import { formatDateForDisplay, formatDateForKey, formatDateToMMDDYY } from './utils/dateUtils';


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
  const [authTriggerView, setAuthTriggerView] = useState<AppView | null>(null); // For login redirection

  const [isResearchChatOpen, setIsResearchChatOpen] = useState<boolean>(false);

  // Audio Player State (managed in App for persistence)
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [selectedDateForAudio, setSelectedDateForAudio] = useState<Date>(selectedDate);

  // Favorite Players State
  const [favoritePlayersMap, setFavoritePlayersMap] = useState<Record<string, boolean>>({});

  const authContext = useAuth();
  const { currentUser, loading: authLoading } = authContext;

  const today = new Date();
  const maxDate = today.toISOString().split('T')[0];

  // Initialize Audio Element
  useEffect(() => {
    if (typeof Audio !== 'undefined' && !audioRef.current) {
      (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = new Audio();
      
      audioRef.current.onloadedmetadata = () => {
        setIsAudioLoading(false);
        setAudioError(null);
      };
      audioRef.current.onended = () => setIsAudioPlaying(false);
      audioRef.current.onerror = (e) => {
        let message = "Audio error.";
        if (audioRef.current?.error) {
            switch(audioRef.current.error.code) {
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

  // Update Audio Source when selectedDateForAudio changes (for mobile header)
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
      // setIsAudioPlaying(false); // Don't stop playback if source changes due to date change elsewhere while playing
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


  // Fetch user's favorite players on login
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


  // Email Link Sign-In Logic
  useEffect(() => {
    const link = window.location.href;
    if (authContext.isSignInWithEmailLink(link)) {
      let email = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_LINK_KEY);
      // ... (rest of email link logic remains the same)
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

  // View Routing Logic
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      if (authTriggerView === 'landing' || currentView === 'landing') {
        setCurrentView('dashboard');
      } else if (currentView !== 'analytics' && currentView !== 'dashboard') { // If logged in from somewhere else, stay or go to dashboard
        setCurrentView('dashboard'); // Default to dashboard if current view isn't analytics
      }
      setAuthTriggerView(null); // Reset trigger
    } else { // No current user
      if (currentView === 'dashboard') { // If on dashboard and logs out
        setCurrentView('landing');
      }
      // If not on landing or analytics, and logs out, go to landing.
      // If on analytics and logs out, stay on analytics.
      // If on landing and logs out (session expired etc), stay on landing.
    }
  }, [currentUser, authLoading, currentView, authTriggerView]);


  const loadData = useCallback(async (dateToLoad: Date,currentPlayerData?: PlayerData | null) => {
    setIsLoading(true);
    setError(null);

    const dateKey = formatDateForKey(dateToLoad);
    const humanReadable = formatDateForDisplay(dateToLoad);
    let forceRefresh = false;

    try {
      const firestoreResult: FirestoreReportWithTimestamp | null = await getAnalysisReportFromFirestore(dateKey);
      let currentSelectedPlayerStillValid = false;
      
      if (firestoreResult) {
        // ... (stale check logic remains the same)
        const todayKey = formatDateForKey(new Date());
        if (dateKey === todayKey) {
          const now = new Date();
          const dataAgeHours = (now.getTime() - firestoreResult.fetchedAt.getTime()) / (1000 * 60 * 60);
          if (dataAgeHours > STALE_THRESHOLD_HOURS && now.getUTCHours() < REFRESH_CUTOFF_UTC_HOUR) {
            forceRefresh = true;
          }
        }

        if (!forceRefresh) {
          setAnalysisData(firestoreResult.report);
           if (firestoreResult.report.recommendations && firestoreResult.report.recommendations.length > 0) {
            // Check if existing selectedPlayer (passed as currentPlayerData) is in the new report
            if (currentPlayerData && firestoreResult.report.recommendations.some(p => p.player === currentPlayerData.player && p.team === currentPlayerData.team)) {
                setSelectedPlayer(currentPlayerData);
                currentSelectedPlayerStillValid = true;
            } else {
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
           if (currentPlayerData && geminiData.recommendations.some(p => p.player === currentPlayerData.player && p.team === currentPlayerData.team)) {
                setSelectedPlayer(currentPlayerData);
                currentSelectedPlayerStillValid = true;
            } else {
                setSelectedPlayer(geminiData.recommendations[0]);
            }
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
  }, []); // Removed selectedPlayer from deps

  useEffect(() => {
    if (currentView === 'analytics' && !authLoading) {
      loadData(selectedDate, selectedPlayer);
    }
  }, [selectedDate, currentView, authLoading, loadData]); // selectedPlayer removed from here too

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsFlyoutOpen(false);
  };
  
  const handleMobileHeaderDateChange = (date: Date) => {
    setSelectedDateForAudio(date); // For audio file
    handleDateChange(date); // For main analytics
  };


  const handlePlayerSelect = (player: PlayerData) => {
    setSelectedPlayer(player);
  };
  
  const openAuthModal = (triggeredFromView: AppView) => {
    setAuthTriggerView(triggeredFromView);
    setIsAuthModalOpen(true);
  };

  // --- Quick Add Action Handlers ---
  const ensureStructuredReport = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>, forDateKey: string, forHumanReadableDate: string): Promise<PlayerData | null> => {
    const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
    
    // Check if player is already in main recommendations
    const mainRec = analysisData?.recommendations.find(p => (p.mlbId === playerId) || (p.player === playerData.player && p.team === playerData.team));
    if (mainRec && mainRec.playerSpecificVerdict) return mainRec;

    // Check cache in additionalPlayers
    let report = await getAdditionalPlayerReport(forDateKey, playerId);
    if (report) return report;

    // Fetch from Gemini and cache
    report = await fetchStructuredReportForPlayer(playerData.player, forDateKey, forHumanReadableDate);
    if (report) {
      await saveAdditionalPlayerReport(forDateKey, playerId, report);
      return report;
    }
    return null;
  };

  const handleSetPick = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => {
    if (!currentUser) {
      openAuthModal(currentView);
      return;
    }
    const dateKey = formatDateForKey(selectedDate);
    const humanReadable = formatDateForDisplay(selectedDate);

    const fullReport = await ensureStructuredReport(playerData, dateKey, humanReadable);
    if (!fullReport) {
      alert(`Could not retrieve full data for ${playerData.player} to set pick.`);
      return;
    }

    try {
      await saveUserDailyPick(currentUser.uid, dateKey, {
        playerId: fullReport.mlbId || fullReport.player.toLowerCase().replace(/\s+/g, '-'),
        playerName: fullReport.player,
        team: fullReport.team,
        source: 'researched', // Or determine source more accurately
      });
      alert(`${fullReport.player} set as your pick for ${humanReadable}.`);
      // Optionally, update dashboard if it's visible or has a list of picks
    } catch (e) {
      console.error("Error setting pick:", e);
      alert(`Failed to set pick for ${fullReport.player}.`);
    }
  };

  const handleToggleFavorite = async (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => {
    if (!currentUser) {
      openAuthModal(currentView);
      return;
    }
    const playerId = playerData.mlbId || playerData.player.toLowerCase().replace(/\s+/g, '-');
    const isFav = favoritePlayersMap[playerId];

    // Ensure structured report for full name/team, even if not strictly needed for toggle by ID
    // This makes sure we have good data if adding for the first time
    const fullReport = await ensureStructuredReport(playerData, formatDateForKey(selectedDate), formatDateForDisplay(selectedDate));
    if (!fullReport && !isFav) { // Only critical if adding and couldn't get report
        alert(`Could not retrieve full data for ${playerData.player} to manage favorite.`);
        return;
    }

    try {
      if (isFav) {
        await removePlayerFromFavorites(currentUser.uid, playerId);
        setFavoritePlayersMap(prev => ({ ...prev, [playerId]: false }));
        alert(`${playerData.player} removed from favorites.`);
      } else {
        await addPlayerToFavorites(currentUser.uid, { // Use fullReport data if available, else playerData
            player: fullReport?.player || playerData.player,
            team: fullReport?.team || playerData.team,
            mlbId: fullReport?.mlbId || playerData.mlbId,
        });
        setFavoritePlayersMap(prev => ({ ...prev, [playerId]: true }));
        alert(`${playerData.player} added to favorites!`);
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      alert(`Failed to update favorites for ${playerData.player}.`);
    }
  };


  // --- Render Logic ---
  if (authLoading && currentView !== 'landing' && currentView !== 'dashboard') {
    return (
      <div className="min-h-screen bg-[var(--sidebar-bg)] flex items-center justify-center">
        <Loader message="Initializing STREAKSENSE..." />
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage
              onEnterApp={() => currentUser ? setCurrentView('dashboard') : setCurrentView('analytics')}
              onLoginClick={() => openAuthModal('landing')}
           />;
  }

  if (currentUser && currentView === 'dashboard') {
    return (
      <>
        <DashboardPage
          currentUser={currentUser}
          selectedDate={selectedDate}
          onNavigateToAnalytics={() => {
            setCurrentView('analytics');
            if (!analysisData || formatDateForKey(selectedDate) !== analysisData.date) {
              loadData(selectedDate, selectedPlayer);
            }
          }}
          onLogout={() => {
            authContext.signOutUser();
            setCurrentView('landing');
          }}
          onOpenResearchChat={() => setIsResearchChatOpen(true)}
        />
        {isResearchChatOpen && (
          <PlayerResearchChat
            isOpen={isResearchChatOpen}
            onClose={() => setIsResearchChatOpen(false)}
            selectedDate={selectedDate}
          />
        )}
        {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
      </>
    );
  }

  // Analytics View
  let mainContent;
  if (isLoading && currentView === 'analytics') {
    mainContent = (
      <div className="flex flex-col items-center justify-center flex-grow h-full w-full">
        <Loader message="Analyzing Matchups..." />
      </div>
    );
  } else if (error && currentView === 'analytics') {
    mainContent = (
      <div className="flex flex-col items-center justify-center text-center p-8 h-full">
        <FiAlertTriangle className="w-16 h-16 text-[var(--accent-negative)] mb-4" />
        <h2 className="text-2xl font-[var(--font-display)] text-[var(--primary-glow)] mb-2">Analysis Unavailable</h2>
        <p className="text-[var(--text-secondary)]">{error}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">Please try a different date or check back later.</p>
      </div>
    );
  } else if (analysisData && selectedPlayer && currentView === 'analytics') {
    mainContent = <MainDisplay player={selectedPlayer} reportDate={analysisData.date} />;
  } else if (currentView === 'analytics') {
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
        selectedDate={selectedDateForAudio} // Use separate date for audio to decouple from analytics date if needed
        onMenuToggle={() => setIsFlyoutOpen(true)}
        onDateChange={handleMobileHeaderDateChange}
        maxDate={maxDate}
        className="md:hidden sticky top-0 z-30 bg-[var(--sidebar-bg)] shadow-md"
        onLogoClick={currentUser ? () => setCurrentView('dashboard') : () => setCurrentView('landing')}
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
        onNavigateToDashboard={currentUser ? () => {setCurrentView('dashboard'); setIsFlyoutOpen(false);} : undefined}
        onOpenAuthModal={() => {setIsFlyoutOpen(false); openAuthModal(currentView);}}
        onOpenResearchChat={() => {setIsResearchChatOpen(true); setIsFlyoutOpen(false);}}
        currentUser={currentUser}
        favoritePlayersMap={favoritePlayersMap}
        onSetPick={handleSetPick}
        onToggleFavorite={handleToggleFavorite}
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
          onOpenAuthModal={() => openAuthModal(currentView)}
          currentUser={currentUser}
          favoritePlayersMap={favoritePlayersMap}
          onSetPick={handleSetPick}
          onToggleFavorite={handleToggleFavorite}
        />

        <div className="flex-1 flex flex-col overflow-y-auto" id="main-content-scroll-area">
          <MobilePlayerPicker
            analysisData={analysisData}
            onPlayerSelect={handlePlayerSelect}
            selectedPlayerId={selectedPlayer?.player}
            isLoading={isLoading}
            className="md:hidden sticky top-0 z-20 bg-[var(--main-bg)] shadow-sm"
            currentUser={currentUser}
            favoritePlayersMap={favoritePlayersMap}
            onSetPick={handleSetPick}
            onToggleFavorite={handleToggleFavorite}
            onOpenAuthModal={() => openAuthModal(currentView)}
            selectedDate={selectedDate}
          />

          <main className={`flex-grow bg-[var(--main-bg)] p-4 sm:p-6 lg:p-8 flex flex-col
                           ${selectedPlayer && analysisData && currentView === 'analytics' ? 'pt-2 md:pt-4' : 'pt-4'}`}>
            {mainContent}
          </main>
        </div>
      </div>
      {isAuthModalOpen && <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />}
      {isResearchChatOpen && currentUser && ( // Ensure user is logged in for research chat
        <PlayerResearchChat
          isOpen={isResearchChatOpen}
          onClose={() => setIsResearchChatOpen(false)}
          selectedDate={selectedDate}
        />
      )}
    </div>
  );
};

export default App;
