
import React, { useState, useEffect, useCallback } from 'react'; 
import type { User } from 'firebase/auth';
import { FiUser, FiCalendar, FiTrendingUp, FiList, FiMessageSquare, FiUploadCloud, FiSettings, FiLogOut, FiBarChart2, FiEdit3, FiEye, FiHeart, FiLoader, FiXCircle, FiPlusCircle } from 'react-icons/fi';
import { formatDateForDisplay, formatDateForKey } from '@/utils/dateUtils';
import { getUserDailyPicks, addUserDailyPick, PlayerPickInfo, FavoritePlayer, getUserFavoritePlayers, removeUserDailyPick as removePickService, UserDailyPicksDocument } from '@/services/userService'; 
import type { PlayerData } from '@/types';
import { Loader } from '@/components/Loader'; 


interface DashboardPageProps {
  currentUser: User;
  selectedDate: Date; 
  onViewPlayerAnalytics: (playerInfo: Pick<PlayerData, 'player' | 'team' | 'mlbId'>, date: Date) => Promise<void>;
  onLogout: () => void;
  onOpenResearchChat: () => void;
  favoritePlayers: FavoritePlayer[]; 
  handleToggleFavorite: (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>; // Changed prop name
}

const DashboardSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; comingSoon?: boolean; className?: string }> = ({ title, icon, children, comingSoon, className = "" }) => (
  <section className={`bg-[var(--card-bg)] p-6 rounded-lg shadow-xl border border-[var(--border-color)] ${className}`}>
    <div className="flex items-center mb-4">
      <span className="mr-3 text-xl text-[var(--primary-glow)]">{icon}</span>
      <h2 className="text-xl font-[var(--font-display)] text-[var(--primary-glow)]">{title}</h2>
      {comingSoon && <span className="ml-auto text-xs bg-[var(--primary-glow)] text-black px-2 py-0.5 rounded-full font-semibold">Coming Soon</span>}
    </div>
    <div className="text-sm text-[var(--text-secondary)] space-y-3">
      {children}
    </div>
  </section>
);

export const DashboardPage: React.FC<DashboardPageProps> = ({ 
    currentUser, 
    selectedDate, 
    onViewPlayerAnalytics, 
    onLogout, 
    onOpenResearchChat,
    handleToggleFavorite // Changed prop name
}) => {
  const [dailyPickInput, setDailyPickInput] = useState<string>('');
  const [currentPicksDoc, setCurrentPicksDoc] = useState<UserDailyPicksDocument | null>(null);
  const [pickLoading, setPickLoading] = useState<boolean>(true);
  const [favoritesList, setFavoritesList] = useState<FavoritePlayer[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(true);

  const fetchPicks = useCallback(() => {
    if(currentUser && selectedDate) {
      setPickLoading(true);
      const dateKey = formatDateForKey(selectedDate);
      getUserDailyPicks(currentUser.uid, dateKey).then(doc => {
        setCurrentPicksDoc(doc);
      }).finally(() => setPickLoading(false));
    }
  }, [currentUser, selectedDate]);

  useEffect(() => {
    fetchPicks();
  }, [fetchPicks]);

  useEffect(() => {
    if (currentUser) {
      setFavoritesLoading(true);
      getUserFavoritePlayers(currentUser.uid)
        .then(setFavoritesList)
        .finally(() => setFavoritesLoading(false));
    }
  }, [currentUser]);

  const handleSavePickFromInput = async () => {
    if (!dailyPickInput.trim() || !currentUser) return;
    
    const currentPicksArray = currentPicksDoc?.picks || [];
    if (currentPicksArray.length >= 2) {
        alert("You already have two picks. Please remove one first.");
        return;
    }
     if (currentPicksArray.some(p => p.playerName.toLowerCase() === dailyPickInput.trim().toLowerCase())) {
      alert("This player is already one of your picks.");
      return;
    }

    setPickLoading(true);
    const dateKey = formatDateForKey(selectedDate);
    const pickToSave: Omit<PlayerPickInfo, 'pickedAt' | 'pickDate'> = {
        playerId: dailyPickInput.trim().toLowerCase().replace(/\s+/g, '-'), 
        playerName: dailyPickInput.trim(),
        team: "Team TBD", 
        source: 'direct_input', 
    };
    try {
        const result = await addUserDailyPick(currentUser.uid, dateKey, pickToSave);
        alert(result.message);
        if (result.success) {
          fetchPicks(); // Refresh picks from DB
          setDailyPickInput(''); 
        }
    } catch (error) {
        console.error("Error saving pick from dashboard:", error);
        alert("Failed to save pick. Please try again.");
    } finally {
        setPickLoading(false);
    }
  };

  const handleRemovePick = async (playerIdToRemove: string) => {
    if (!currentUser) return;
    setPickLoading(true);
    const dateKey = formatDateForKey(selectedDate);
    try {
      const result = await removePickService(currentUser.uid, dateKey, playerIdToRemove);
      alert(result.message);
      if (result.success) {
        fetchPicks(); // Refresh picks from DB
      }
    } catch (error) {
      console.error("Error removing pick:", error);
      alert("Failed to remove pick. Please try again.");
    } finally {
      setPickLoading(false);
    }
  };
  
  const handleViewPickAnalysis = (pick: PlayerPickInfo) => {
    onViewPlayerAnalytics(
      { player: pick.playerName, team: pick.team, mlbId: pick.playerId.includes('-') ? undefined : pick.playerId },
      selectedDate
    );
  };
  
  const handleViewFavoriteAnalysis = (fav: FavoritePlayer) => {
     onViewPlayerAnalytics(
        { player: fav.playerName, team: fav.team, mlbId: fav.mlbId },
        selectedDate 
     );
  };

  const dashboardDateFormatted = formatDateForDisplay(selectedDate);
  const picksForDay = currentPicksDoc?.picks || [];

  return (
    <div className="min-h-screen bg-[var(--main-bg)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl neon-text italic">STREAKSENSE</h1>
            <p className="text-md text-[var(--text-secondary)]">Welcome, {currentUser.displayName || currentUser.email}!</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
             <button
                onClick={() => onViewPlayerAnalytics({player: '', team: '', mlbId: undefined}, selectedDate)} 
                className="text-xs sm:text-sm bg-[var(--primary-glow)] text-black font-semibold py-2 px-4 rounded-md hover:opacity-90 transition-opacity flex items-center"
            >
               <FiBarChart2 className="mr-2"/> View General Analysis
            </button>
            <button
                onClick={onLogout}
                className="text-xs sm:text-sm text-[var(--text-secondary)] hover:text-[var(--primary-glow)] font-semibold py-2 px-4 rounded-md border border-[var(--border-color)] hover:border-[var(--primary-glow)] transition-colors flex items-center"
            >
                <FiLogOut className="mr-2"/> Logout
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardSection title={`Today's Picks (${dashboardDateFormatted})`} icon={<FiCalendar />} className="md:col-span-2">
          {pickLoading && !currentPicksDoc ? (
            <div className="flex justify-center items-center py-4"><Loader message="Loading picks..."/></div>
          ) : (
            <div className="space-y-4">
              {picksForDay.length > 0 ? (
                picksForDay.map((pick, index) => (
                  <div key={pick.playerId} className="p-3 bg-[var(--sidebar-bg)] rounded-md border border-[var(--border-color)]">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-[var(--text-secondary)]">Pick {index + 1}</span>
                        <p className="font-semibold text-[var(--primary-glow)]">{pick.playerName} <span className="text-xs text-[var(--text-secondary)]">({pick.team || 'N/A'})</span></p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewPickAnalysis(pick)}
                          className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors" title="View Analysis"
                        > <FiEye size={16}/> </button>
                        <button
                          onClick={() => handleRemovePick(pick.playerId)}
                          disabled={pickLoading}
                          className="p-1.5 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50" title="Remove Pick"
                        > {pickLoading ? <FiLoader className="animate-spin w-4 h-4"/> : <FiXCircle size={16}/>} </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No picks made for today yet.</p>
              )}

              {picksForDay.length < 2 && (
                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                  <h4 className="text-sm font-semibold mb-2 text-[var(--text-primary)]">Add a Pick:</h4>
                  <input
                    type="text"
                    value={dailyPickInput}
                    onChange={(e) => setDailyPickInput(e.target.value)}
                    placeholder="Enter player name (or use Research AI / Quick Add)"
                    className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/70"
                  />
                  <button
                    onClick={handleSavePickFromInput}
                    disabled={!dailyPickInput.trim() || pickLoading}
                    className="w-full mt-3 bg-[var(--primary-glow)] text-black font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {pickLoading ? <FiLoader className="animate-spin mr-2"/> : <FiPlusCircle className="mr-2"/>} Add Pick
                  </button>
                </div>
              )}
               {picksForDay.length === 2 && (
                 <p className="mt-3 text-sm text-green-400">You have selected two picks for today!</p>
               )}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="My Favorite Players" icon={<FiHeart />}>
          {favoritesLoading ? (
            <div className="flex justify-center items-center py-4"><Loader message="Loading favorites..."/></div>
          ) : favoritesList.length > 0 ? (
            <ul className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {favoritesList.map(fav => (
                <li key={fav.playerId} className="flex items-center justify-between p-2.5 bg-[var(--main-bg)] rounded-md border border-[var(--border-color)]">
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">{fav.playerName}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{fav.team}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleViewFavoriteAnalysis(fav)}
                      className="p-1.5 text-blue-400 hover:text-blue-300 transition-colors" title="View Analysis"
                    >
                      <FiEye size={16}/>
                    </button>
                    <button 
                      onClick={() => handleToggleFavorite({ player: fav.playerName, team: fav.team, mlbId: fav.mlbId })}
                      className="p-1.5 text-pink-500 hover:text-pink-400 transition-colors" title="Unfavorite"
                    >
                      <FiHeart size={16} className="fill-current"/>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't added any favorite players yet. Find players in "Player Analytics" or "Research AI" to add them!</p>
          )}
        </DashboardSection>

        <DashboardSection title="Player Research AI" icon={<FiMessageSquare />}>
          <p>Have questions about a player? Ask our AI assistant for insights, stats, and matchup details.</p>
          <button
            onClick={onOpenResearchChat} 
            className="w-full mt-3 bg-blue-500 text-white font-semibold py-2.5 rounded-md hover:bg-blue-600 transition-colors"
          >
            Open Player Research Chat
          </button>
        </DashboardSection>

        <DashboardSection title="My Profile" icon={<FiUser />} comingSoon>
          <p>Set up your user profile, manage your favorite MLB teams, and tailor your STREAKSENSE experience.</p>
          <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">Configure Profile (Soon)</button>
        </DashboardSection>

        <DashboardSection title="My Picks History" icon={<FiList />} comingSoon>
          <p>Review your past "Beat the Streak" selections and see how you've performed throughout the season.</p>
           <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">View History (Soon)</button>
        </DashboardSection>
      </div>
      
       <footer className="mt-12 text-center text-xs text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} STREAKSENSE Dashboard. All rights reserved.
        </footer>
    </div>
  );
};
