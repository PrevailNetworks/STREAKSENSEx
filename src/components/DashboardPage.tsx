

import React, { useState, useEffect } from 'react'; 
import type { User } from 'firebase/auth';
import { FiUser, FiCalendar, FiTrendingUp, FiList, FiMessageSquare, FiUploadCloud, FiSettings, FiLogOut, FiBarChart2, FiEdit3, FiEye, FiHeart, FiLoader } from 'react-icons/fi';
import { formatDateForDisplay, formatDateForKey } from '@/utils/dateUtils';
import { getUserDailyPick, saveUserDailyPick, UserDailyPick, FavoritePlayer, getUserFavoritePlayers, removeUserDailyPick as removePickFromDbService } from '@/services/userService'; 
import type { PlayerData } from '@/types';
import { Loader } from '@/components/Loader'; // Added import for Loader


interface DashboardPageProps {
  currentUser: User;
  selectedDate: Date; // This is the date context for the dashboard
  onViewPlayerAnalytics: (playerInfo: Pick<PlayerData, 'player' | 'team' | 'mlbId'>, date: Date) => Promise<void>;
  onLogout: () => void;
  onOpenResearchChat: () => void;
  favoritePlayers: FavoritePlayer[]; // Pass full FavoritePlayer objects for display
  onToggleFavorite: (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
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
    // favoritePlayers: initialFavoritePlayers, // Renamed to avoid confusion with fetched list
    onToggleFavorite 
}) => {
  const [dailyPickInput, setDailyPickInput] = useState<string>('');
  const [currentDailyPick, setCurrentDailyPick] = useState<UserDailyPick | null>(null);
  const [pickLoading, setPickLoading] = useState<boolean>(true);
  const [favoritesList, setFavoritesList] = useState<FavoritePlayer[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState<boolean>(true);


  useEffect(() => {
    if(currentUser && selectedDate) {
      setPickLoading(true);
      const dateKey = formatDateForKey(selectedDate);
      getUserDailyPick(currentUser.uid, dateKey).then(pick => {
        setCurrentDailyPick(pick);
      }).finally(() => setPickLoading(false));
    }
  }, [currentUser, selectedDate]);

  useEffect(() => {
    if (currentUser) {
      setFavoritesLoading(true);
      getUserFavoritePlayers(currentUser.uid)
        .then(setFavoritesList)
        .finally(() => setFavoritesLoading(false));
    }
  }, [currentUser]);


  const handleSavePick = async () => {
    if (!dailyPickInput.trim() || !currentUser) return;
    setPickLoading(true);
    const dateKey = formatDateForKey(selectedDate);
    const pickToSave: Omit<UserDailyPick, 'pickedAt' | 'pickDate'> = {
        playerId: dailyPickInput.trim().toLowerCase().replace(/\s+/g, '-'), // Basic ID generation
        playerName: dailyPickInput.trim(),
        team: "Team TBD", // Ideal: use a search to get full player data first
        source: 'researched', 
    };
    try {
        await saveUserDailyPick(currentUser.uid, dateKey, pickToSave);
        setCurrentDailyPick({ ...pickToSave, pickDate: dateKey, pickedAt: new Date() } as UserDailyPick); // Optimistic update
        alert(`Pick "${dailyPickInput.trim()}" saved for ${formatDateForDisplay(selectedDate)}!`);
        setDailyPickInput(''); 
    } catch (error) {
        console.error("Error saving pick from dashboard:", error);
        alert("Failed to save pick. Please try again.");
    } finally {
        setPickLoading(false);
    }
  };

  const handleChangePick = async () => {
    if (!currentUser || !currentDailyPick) return;
    setPickLoading(true);
    try {
      await removePickFromDbService(currentUser.uid, currentDailyPick.pickDate);
      setCurrentDailyPick(null);
      setDailyPickInput(''); // Clear input if user wants to enter new one
      alert("Your pick has been cleared. You can now make a new selection.");
    } catch (error) {
      console.error("Error changing pick:", error);
      alert("Failed to change pick. Please try again.");
    } finally {
      setPickLoading(false);
    }
  };
  
  const handleViewPickAnalysis = () => {
    if (currentDailyPick) {
      onViewPlayerAnalytics(
        { player: currentDailyPick.playerName, team: currentDailyPick.team, mlbId: currentDailyPick.playerId.includes('-') ? undefined : currentDailyPick.playerId },
        selectedDate
      );
    }
  };
  
  const handleViewFavoriteAnalysis = (fav: FavoritePlayer) => {
     onViewPlayerAnalytics(
        { player: fav.playerName, team: fav.team, mlbId: fav.mlbId },
        selectedDate // Use dashboard's current date for analysis
     );
  };


  const dashboardDateFormatted = formatDateForDisplay(selectedDate);

  return (
    <div className="min-h-screen bg-[var(--main-bg)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl neon-text italic">STREAKSENSE</h1>
            <p className="text-md text-[var(--text-secondary)]">Welcome, {currentUser.displayName || currentUser.email}!</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
             <button
                onClick={() => onViewPlayerAnalytics({player: '', team: '', mlbId: undefined}, selectedDate)} // Simplistic way to trigger analytics view
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
        <DashboardSection title={`Today's Pick (${dashboardDateFormatted})`} icon={<FiCalendar />} className="md:col-span-2">
          {pickLoading ? (
            <div className="flex justify-center items-center py-4"><Loader message="Loading pick..."/></div>
          ) : currentDailyPick ? (
            <div className="space-y-3">
              <p>Your current pick: <strong className="text-[var(--primary-glow)]">{currentDailyPick.playerName}</strong> ({currentDailyPick.team || 'N/A'})</p>
              <div className="flex space-x-3">
                <button
                  onClick={handleViewPickAnalysis}
                  className="flex-1 bg-blue-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center text-xs"
                >
                  <FiEye className="mr-2"/> View Analysis
                </button>
                <button
                  onClick={handleChangePick}
                  className="flex-1 bg-gray-600 text-white font-semibold py-2 px-3 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center text-xs"
                >
                  <FiEdit3 className="mr-2"/> Change Pick
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>Make your selection for today's "Beat the Streak" game.</p>
              <input
                type="text"
                value={dailyPickInput}
                onChange={(e) => setDailyPickInput(e.target.value)}
                placeholder="Enter player name (or use Research AI)"
                className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/70 mt-2"
              />
              <button
                onClick={handleSavePick}
                disabled={!dailyPickInput.trim() || pickLoading}
                className="w-full mt-3 bg-[var(--primary-glow)] text-black font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Pick for Today
              </button>
            </>
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
                      onClick={() => onToggleFavorite({ player: fav.playerName, team: fav.team, mlbId: fav.mlbId })}
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