
import React, { useState, useEffect } from 'react'; // Added useEffect
import type { User } from 'firebase/auth';
// PlayerResearchChat is now rendered by App.tsx
import { FiUser, FiCalendar, FiTrendingUp, FiList, FiMessageSquare, FiUploadCloud, FiSettings, FiLogOut, FiBarChart2 } from 'react-icons/fi';
import { formatDateForDisplay, formatDateForKey } from '@/utils/dateUtils';
import { getUserDailyPick, saveUserDailyPick, UserDailyPick } from '@/services/userService'; // Import userService functions


interface DashboardPageProps {
  currentUser: User;
  selectedDate: Date;
  onNavigateToAnalytics: () => void;
  onLogout: () => void;
  onOpenResearchChat: () => void; // New prop
}

const DashboardSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; comingSoon?: boolean }> = ({ title, icon, children, comingSoon }) => (
  <section className="bg-[var(--card-bg)] p-6 rounded-lg shadow-xl border border-[var(--border-color)]">
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ currentUser, selectedDate, onNavigateToAnalytics, onLogout, onOpenResearchChat }) => {
  const [dailyPickInput, setDailyPickInput] = useState<string>('');
  const [savedPickDisplay, setSavedPickDisplay] = useState<string | null>(null);
  const [pickLoading, setPickLoading] = useState<boolean>(false); // For loading state of pick


  useEffect(() => {
    if(currentUser && selectedDate) {
      setPickLoading(true);
      const dateKey = formatDateForKey(selectedDate);
      getUserDailyPick(currentUser.uid, dateKey).then(pick => {
        if (pick) setSavedPickDisplay(pick.playerName);
        else setSavedPickDisplay(null);
      }).finally(() => setPickLoading(false));
    }
  }, [currentUser, selectedDate]);


  const handleSavePick = async () => {
    if (!dailyPickInput.trim()) return;
    setPickLoading(true);
    // This will eventually use userService.saveUserDailyPick
    // For now, local state update for UI feedback
    // TODO: Need to fetch structured player report if not just a name.
    // For now, assuming dailyPickInput is just the player name and we need a way to get other details.
    // This part needs to align with how handleSetPick in App.tsx works (ensureStructuredReport)
    // For this simple dashboard input, we'll directly save if name is provided.
    const dateKey = formatDateForKey(selectedDate);
    try {
        await saveUserDailyPick(currentUser.uid, dateKey, {
            // This is a simplified version for dashboard direct input.
            // In a real scenario, you'd want to search for the player, get their ID and team.
            // For now, we'll use a placeholder for team and use name as ID.
            playerId: dailyPickInput.trim().toLowerCase().replace(/\s+/g, '-'),
            playerName: dailyPickInput.trim(),
            team: "Team TBD", // Placeholder
            source: 'researched', // Or 'direct_input'
        });
        setSavedPickDisplay(dailyPickInput.trim());
        alert(`Pick "${dailyPickInput.trim()}" saved for ${formatDateForDisplay(selectedDate)}!`);
        setDailyPickInput(''); // Clear input
    } catch (error) {
        console.error("Error saving pick from dashboard:", error);
        alert("Failed to save pick. Please try again.");
    } finally {
        setPickLoading(false);
    }
  };

  const todayFormattedDate = formatDateForDisplay(selectedDate);

  return (
    <div className="min-h-screen bg-[var(--main-bg)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center">
        <div>
            <h1 className="font-[var(--font-display)] text-3xl sm:text-4xl neon-text italic">STREAKSENSE</h1>
            <p className="text-md text-[var(--text-secondary)]">Welcome, {currentUser.displayName || currentUser.email}!</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
                onClick={onNavigateToAnalytics}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardSection title={`Today's Pick (${todayFormattedDate})`} icon={<FiCalendar />}>
          <p>Make your selection for today's "Beat the Streak" game.</p>
          <input
            type="text"
            value={dailyPickInput}
            onChange={(e) => setDailyPickInput(e.target.value)}
            placeholder="Enter player name"
            className="w-full bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-md p-2.5 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/70 mt-2"
          />
          <button
            onClick={handleSavePick}
            disabled={!dailyPickInput.trim() || pickLoading}
            className="w-full mt-3 bg-[var(--primary-glow)] text-black font-semibold py-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pickLoading ? 'Saving...' : 'Save Pick for Today'}
          </button>
          {pickLoading && !savedPickDisplay && <p className="mt-3 text-sm">Checking current pick...</p>}
          {savedPickDisplay && <p className="mt-3 text-green-400">Your current pick: <strong>{savedPickDisplay}</strong></p>}
          {!savedPickDisplay && !pickLoading && <p className="mt-3">You haven't made a pick yet for today.</p>}
        </DashboardSection>

        <DashboardSection title="Player Research AI" icon={<FiMessageSquare />}>
          <p>Have questions about a player? Ask our AI assistant for insights, stats, and matchup details.</p>
          <button
            onClick={onOpenResearchChat} // Use prop here
            className="w-full mt-3 bg-blue-500 text-white font-semibold py-2.5 rounded-md hover:bg-blue-600 transition-colors"
          >
            Open Player Research Chat
          </button>
        </DashboardSection>

        <DashboardSection title="My Profile & Favorites" icon={<FiUser />} comingSoon>
          <p>Set up your user profile, manage your favorite teams, and tailor your STREAKSENSE experience.</p>
          <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">Configure Profile (Soon)</button>
        </DashboardSection>

        <DashboardSection title="My Picks History" icon={<FiList />} comingSoon>
          <p>Review your past "Beat the Streak" selections and see how you've performed throughout the season.</p>
           <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">View History (Soon)</button>
        </DashboardSection>

        <DashboardSection title="News & Alerts" icon={<FiTrendingUp />} comingSoon>
          <p>Get the latest news, injury updates, and performance alerts for your favorite players and teams.</p>
          <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">Setup Alerts (Soon)</button>
        </DashboardSection>

        <DashboardSection title="Import Picks" icon={<FiUploadCloud />} comingSoon>
          <p>Have picks from another platform? We're working on a way for you to import them.</p>
          <button className="mt-3 text-[var(--primary-glow)] hover:underline opacity-50 cursor-not-allowed">Import (Soon)</button>
        </DashboardSection>
      </div>

      {/* PlayerResearchChat is now rendered by App.tsx */}
       <footer className="mt-12 text-center text-xs text-[var(--text-secondary)]">
            &copy; {new Date().getFullYear()} STREAKSENSE Dashboard. All rights reserved.
        </footer>
    </div>
  );
};
