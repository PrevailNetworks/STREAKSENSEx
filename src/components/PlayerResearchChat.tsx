
import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { FiX, FiSend, FiLoader, FiMessageSquare, FiUser, FiCpu, FiCheckSquare, FiHeart, FiAlertCircle } from 'react-icons/fi';
import { fetchPlayerResearchResponse, fetchStructuredReportForPlayer } from '@/services/geminiService';
import { getAdditionalPlayerReport, saveAdditionalPlayerReport } from '@/services/firestoreService';
import { saveUserDailyPick, addPlayerToFavorites, removePlayerFromFavorites, isPlayerFavorite, UserDailyPick } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import type { PlayerData } from '@/types';
import { formatDateForDisplay, formatDateForKey } from '@/utils/dateUtils'; // Assuming date utils exist

interface PlayerResearchChatProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date; // Pass current analysis date
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
  playerContext?: { // Store potential player name identified from AI response
    name: string;
    mlbId?: string; // If AI provides it
    team?: string;
  };
}

const extractPlayerNameFromQuery = (query: string): string | undefined => {
    // Basic extraction, can be improved with NLP or more robust parsing
    const patterns = [
        /how has ([\w\s.-]+) been/i,
        /tell me about ([\w\s.-]+)/i,
        /stats for ([\w\s.-]+)/i,
        /info on ([\w\s.-]+)/i,
        /([\w\s.-]+)\s*(?:'s stats|'s performance)/i,
    ];
    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    // Fallback if no specific pattern matched but query seems to be a name
    if (query.split(' ').length <= 3 && query.length > 3) return query.trim();
    return undefined;
};

// Function to try and extract MLB ID from text like "(mlbId: 123456)"
const extractMlbIdFromText = (text: string): string | undefined => {
    const match = text.match(/mlbId:\s*(\d+)/i);
    return match ? match[1] : undefined;
};
const extractTeamFromText = (text: string, playerName: string): string | undefined => {
    // Regex to find team names, often in parentheses after player name or mentioned with "plays for"
    // Example: "Shohei Ohtani (Los Angeles Dodgers)" or "Shohei Ohtani plays for the Los Angeles Dodgers"
    const teamRegex = new RegExp(`(?:${playerName}\\s*\\(([^)]+)\\)|${playerName}\\s*(?:plays for|of the|on the)\\s*(the\\s*)?([^.,\\n]+))`, "i");
    const match = text.match(teamRegex);
    if (match) {
        // Prefer the explicitly captured group for team if available
        const capturedTeam = match[1] || match[3];
        if (capturedTeam) {
          // Avoid capturing things like "DH" or other non-team info if in parentheses
          if (capturedTeam.length > 3 && !capturedTeam.match(/^\d+$/) && !capturedTeam.match(/^(LHP|RHP|DH|SS|OF|P|C|1B|2B|3B)$/i)) {
             return capturedTeam.replace(/^the\s*/i, '').trim();
          }
        }
    }
    return undefined;
};


export const PlayerResearchChat: React.FC<PlayerResearchChatProps> = ({ isOpen, onClose, selectedDate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Stores ID of player being actioned
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({}); // PlayerId -> isFavorite

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();

  const dateKey = formatDateForKey(selectedDate);
  const humanReadableDate = formatDateForDisplay(selectedDate);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          id: 'ai-initial-' + Date.now(), 
          sender: 'ai', 
          text: "Hello! I'm your MLB Player Research Assistant. Ask me anything about player stats, matchups, or performance! For example, 'Tell me about Shohei Ohtani's recent games'." 
        }
      ]);
      setActionError(null);
      setFavoriteStatus({});
    }
  }, [isOpen]); // Removed messages.length dependency to avoid re-triggering initial message if user clears chat

  useEffect(() => {
    // When a new AI message with playerContext arrives, check favorite status
    const lastMessage = messages[messages.length - 1];
    if (currentUser && lastMessage?.sender === 'ai' && lastMessage.playerContext?.name) {
      const playerId = lastMessage.playerContext.mlbId || lastMessage.playerContext.name.toLowerCase().replace(/\s+/g, '-');
      if (favoriteStatus[playerId] === undefined) { // Check only if not already checked
        isPlayerFavorite(currentUser.uid, playerId).then(isFav => {
          setFavoriteStatus(prev => ({ ...prev, [playerId]: isFav }));
        });
      }
    }
  }, [messages, currentUser, favoriteStatus]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || isAiLoading) return;
    setActionError(null);

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: currentQuery.trim(),
    };
    
    setMessages(prev => [...prev, userMessage, {id: 'ai-loading-' + Date.now(), sender: 'ai', text: '', isLoading: true}]);
    const queryForAi = currentQuery.trim();
    setCurrentQuery('');
    setIsAiLoading(true);

    try {
      const aiResponseText = await fetchPlayerResearchResponse(queryForAi);
      const identifiedPlayerName = extractPlayerNameFromQuery(queryForAi) || extractPlayerNameFromQuery(aiResponseText);
      let playerContext;
      if (identifiedPlayerName) {
          playerContext = {
              name: identifiedPlayerName,
              mlbId: extractMlbIdFromText(aiResponseText),
              team: extractTeamFromText(aiResponseText, identifiedPlayerName)
          };
      }

      const aiMessage: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiResponseText,
        playerContext: playerContext
      };
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(aiMessage));
    } catch (error) {
      console.error("Player research chat error:", error);
      const errorMessage: ChatMessage = {
        id: 'ai-error-' + Date.now(),
        sender: 'ai',
        text: error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.",
      };
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(errorMessage));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePlayerAction = async (action: 'pick' | 'favoriteToggle', playerInfo: { name: string, mlbId?: string, team?: string }) => {
    if (!currentUser) {
      setActionError("You must be logged in to perform this action.");
      return;
    }
    if (!playerInfo || !playerInfo.name) {
        setActionError("Could not identify player to action.");
        return;
    }

    const playerId = playerInfo.mlbId || playerInfo.name.toLowerCase().replace(/\s+/g, '-');
    setActionLoading(playerId);
    setActionError(null);

    try {
      let structuredReport: PlayerData | null = await getAdditionalPlayerReport(dateKey, playerId);
      if (!structuredReport) {
        structuredReport = await fetchStructuredReportForPlayer(playerInfo.name, dateKey, humanReadableDate);
        if (structuredReport) {
          await saveAdditionalPlayerReport(dateKey, playerId, structuredReport);
        } else {
          throw new Error(`Could not retrieve or generate a structured report for ${playerInfo.name}.`);
        }
      }
      
      // Ensure the report has the necessary fields for actions
      if (!structuredReport.player || !structuredReport.team) {
          throw new Error(`Structured report for ${playerInfo.name} is missing essential details.`);
      }


      if (action === 'pick') {
        const pickData: Omit<UserDailyPick, 'pickedAt' | 'pickDate'> = {
          playerId: playerId,
          playerName: structuredReport.player,
          team: structuredReport.team,
          source: 'researched',
        };
        await saveUserDailyPick(currentUser.uid, dateKey, pickData);
        alert(`${structuredReport.player} set as your pick for ${humanReadableDate}!`);
      } else if (action === 'favoriteToggle') {
        const isCurrentlyFavorite = favoriteStatus[playerId];
        if (isCurrentlyFavorite) {
          await removePlayerFromFavorites(currentUser.uid, playerId);
          setFavoriteStatus(prev => ({ ...prev, [playerId]: false }));
           alert(`${structuredReport?.player || playerInfo.name} removed from favorites.`);
        } else {
          await addPlayerToFavorites(currentUser.uid, {
            player: structuredReport.player,
            team: structuredReport.team,
            mlbId: structuredReport.mlbId,
          });
          setFavoriteStatus(prev => ({ ...prev, [playerId]: true }));
           alert(`${structuredReport?.player || playerInfo.name} added to favorites!`);
        }
      }
    } catch (err) {
      console.error(`Error during player action (${action}):`, err);
      setActionError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setActionLoading(null);
    }
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] border border-[var(--border-color)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center">
            <FiMessageSquare className="w-6 h-6 text-[var(--primary-glow)] mr-3"/>
            <h2 className="text-xl font-[var(--font-display)] text-[var(--primary-glow)]">Player Research AI</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close player research chat"
          >
            <FiX size={24} />
          </button>
        </header>

        {actionError && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 p-2 rounded-md text-xs mb-3 flex items-center">
            <FiAlertCircle className="mr-2 shrink-0" /> {actionError}
          </div>
        )}

        <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[80%] p-3 rounded-lg text-sm flex items-start space-x-2
                              ${msg.sender === 'user' ? 'bg-[var(--primary-glow)] text-black rounded-br-none' 
                                                      : 'bg-[var(--sidebar-bg)] text-[var(--text-primary)] rounded-bl-none'}`}
                >
                  {msg.sender === 'ai' && <FiCpu className="w-4 h-4 mt-0.5 shrink-0 text-[var(--primary-glow)]" />}
                  {msg.isLoading ? (
                      <div className="flex items-center space-x-1.5">
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75"></div>
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150"></div>
                          <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-225"></div>
                      </div>
                  ) : (
                      <p style={{whiteSpace: 'pre-wrap'}}>{msg.text}</p>
                  )}
                  {msg.sender === 'user' && <FiUser className="w-4 h-4 mt-0.5 shrink-0" />}
                </div>
              </div>
              {/* Action buttons for AI messages with playerContext */}
              {currentUser && msg.sender === 'ai' && msg.playerContext && !msg.isLoading && (
                <div className="flex justify-start mt-1.5 ml-8 space-x-2">
                  <button
                    onClick={() => handlePlayerAction('pick', msg.playerContext!)}
                    disabled={!!actionLoading}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md flex items-center disabled:opacity-50"
                  >
                    {actionLoading === (msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')) && actionLoading === 'pick' ? <FiLoader className="animate-spin mr-1"/> : <FiCheckSquare className="mr-1" />}
                    Set as Pick
                  </button>
                  <button
                    onClick={() => handlePlayerAction('favoriteToggle', msg.playerContext!)}
                    disabled={!!actionLoading}
                    className={`text-xs px-2 py-1 rounded-md flex items-center disabled:opacity-50 
                                ${favoriteStatus[msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')] 
                                  ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
                  >
                    {actionLoading === (msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')) && actionLoading === 'favorite' ? <FiLoader className="animate-spin mr-1"/> : <FiHeart className="mr-1" />}
                    {favoriteStatus[msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')] ? 'Unfavorite' : 'Favorite'}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
          <input
            type="text"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder="Ask about a player..."
            className="flex-grow bg-[var(--sidebar-bg)] border border-[var(--border-color)] rounded-lg p-3 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/70"
            disabled={isAiLoading}
          />
          <button
            type="submit"
            disabled={!currentQuery.trim() || isAiLoading}
            className="bg-[var(--primary-glow)] text-black p-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message"
          >
            {isAiLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
