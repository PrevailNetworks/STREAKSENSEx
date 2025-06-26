
import React, { useState, FormEvent, useRef, useEffect, useCallback } from 'react';
import { FiSend, FiLoader, FiMessageSquare, FiUser, FiCpu, FiCheckSquare, FiHeart, FiAlertCircle, FiClipboard, FiX } from 'react-icons/fi';
import { fetchPlayerResearchResponse, fetchStructuredReportForPlayer } from '@/services/geminiService';
import { getAdditionalPlayerReport, saveAdditionalPlayerReport } from '@/services/firestoreService';
import { addUserDailyPick, addPlayerToFavorites, removePlayerFromFavorites, isPlayerFavorite } from '@/services/userService';
import { useAuth } from '@/contexts/AuthContext';
import type { PlayerData, PlayerPickInfo } from '@/types';
import { formatDateForDisplay, formatDateForKey } from '@/utils/dateUtils';

interface ChatPanelProps {
  className?: string;
  selectedDate: Date;
  onDisplayResearchedPlayer: (playerData: PlayerData) => void;
  onSetPick: (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  onToggleFavorite: (playerData: Pick<PlayerData, 'player' | 'team' | 'mlbId'>) => Promise<void>;
  favoritePlayersMap: Record<string, boolean>;
  onOpenAuthModal: () => void;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
  playerContext?: {
    name: string;
    mlbId?: string;
    team?: string;
  };
}

// Helper functions (can be moved to utils if complex enough)
const extractPlayerNameFromQuery = (query: string): string | undefined => {
    const patterns = [
        /how has ([\w\s.-]+) been/i, /tell me about ([\w\s.-]+)/i,
        /stats for ([\w\s.-]+)/i, /info on ([\w\s.-]+)/i,
        /([\w\s.-]+)\s*(?:'s stats|'s performance)/i,
    ];
    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match && match[1]) return match[1].trim();
    }
    if (query.split(' ').length <= 3 && query.length > 3) return query.trim();
    return undefined;
};
const extractMlbIdFromText = (text: string): string | undefined => text.match(/mlbId:\s*(\d+)/i)?.[1];
const extractTeamFromText = (text: string, playerName: string): string | undefined => {
    const teamRegex = new RegExp(`(?:${playerName}\\s*\\(([^)]+)\\)|${playerName}\\s*(?:plays for|of the|on the)\\s*(the\\s*)?([^.,\\n]+))`, "i");
    const match = text.match(teamRegex);
    if (match) {
        const capturedTeam = match[1] || match[3];
        if (capturedTeam && capturedTeam.length > 3 && !capturedTeam.match(/^\d+$/) && !capturedTeam.match(/^(LHP|RHP|DH|SS|OF|P|C|1B|2B|3B)$/i)) {
            return capturedTeam.replace(/^the\s*/i, '').trim();
        }
    }
    return undefined;
};


export const ChatPanel: React.FC<ChatPanelProps> = ({
  className,
  selectedDate,
  onDisplayResearchedPlayer,
  onSetPick,
  onToggleFavorite,
  favoritePlayersMap,
  onOpenAuthModal,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); 

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollableMessagesRef = useRef<HTMLDivElement>(null); // Ref for the scrollable message area
  const { currentUser } = useAuth();

  const scrollToBottom = useCallback(() => {
    if (scrollableMessagesRef.current) {
        scrollableMessagesRef.current.scrollTop = scrollableMessagesRef.current.scrollHeight;
    }
  }, []);

  useEffect(scrollToBottom, [messages, scrollToBottom]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'ai-initial-' + Date.now(),
        sender: 'ai',
        text: "Ask me about MLB players! E.g., 'Latest on Mookie Betts' or 'Freddie Freeman stats'.",
      }]);
    }
  }, [messages.length]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || isAiLoading) return;
    setActionError(null);

    const userMessage: ChatMessage = { id: 'user-' + Date.now(), sender: 'user', text: currentQuery.trim() };
    setMessages(prev => [...prev, userMessage, { id: 'ai-loading-' + Date.now(), sender: 'ai', text: '', isLoading: true }]);
    const queryForAi = currentQuery.trim();
    setCurrentQuery('');
    setIsAiLoading(true);

    try {
      const aiResponseText = await fetchPlayerResearchResponse(queryForAi);
      const identifiedPlayerName = extractPlayerNameFromQuery(queryForAi) || extractPlayerNameFromQuery(aiResponseText);
      let playerContext: ChatMessage['playerContext'] = undefined;
      if (identifiedPlayerName) {
        playerContext = {
          name: identifiedPlayerName,
          mlbId: extractMlbIdFromText(aiResponseText),
          team: extractTeamFromText(aiResponseText, identifiedPlayerName),
        };
      }
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: 'ai-' + Date.now(), sender: 'ai', text: aiResponseText, playerContext,
      }));
    } catch (error) {
      console.error("Player research chat error:", error);
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat({
        id: 'ai-error-' + Date.now(), sender: 'ai',
        text: error instanceof Error ? error.message : "Sorry, I encountered an error.",
      }));
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleViewFullReport = async (playerInfo: { name: string, mlbId?: string, team?: string }) => {
    if (!currentUser) { onOpenAuthModal(); return; }
    if (!playerInfo || !playerInfo.name) { setActionError("Cannot view report: Player context missing."); return; }
    
    const playerId = playerInfo.mlbId || playerInfo.name.toLowerCase().replace(/\s+/g, '-');
    setActionLoading(`view-${playerId}`);
    setActionError(null);
    const dateKey = formatDateForKey(selectedDate);
    const humanReadable = formatDateForDisplay(selectedDate);

    try {
      let report = await getAdditionalPlayerReport(dateKey, playerId);
      if (!report) {
        report = await fetchStructuredReportForPlayer(playerInfo.name, dateKey, humanReadable);
        if (report) {
          await saveAdditionalPlayerReport(dateKey, playerId, report);
        } else {
          throw new Error(`Could not generate a report for ${playerInfo.name}.`);
        }
      }
      onDisplayResearchedPlayer(report);
    } catch (err) {
      console.error("Error viewing full report:", err);
      setActionError(err instanceof Error ? err.message : "Failed to load report.");
    } finally {
      setActionLoading(null);
    }
  };
  
  const createPlayerPickData = (playerContextParam: ChatMessage['playerContext']): Pick<PlayerData, 'player' | 'team' | 'mlbId'> => {
    if (!playerContextParam || !playerContextParam.name) { 
        throw new Error("Player context is undefined or missing name.");
    }
    return {
        player: playerContextParam.name,
        team: playerContextParam.team || '', 
        mlbId: playerContextParam.mlbId,
    };
  };

  return (
    <div className={`w-80 bg-[var(--sidebar-bg)] border-r border-[var(--border-color)] p-4 flex flex-col h-screen max-h-screen ${className}`}> {/* Ensure fixed height */}
      <header className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)] flex-shrink-0">
        <div className="flex items-center">
          <FiMessageSquare className="w-5 h-5 text-[var(--primary-glow)] mr-2" />
          <h2 className="text-lg font-[var(--font-display)] text-[var(--primary-glow)]">Player Research</h2>
        </div>
        <button onClick={onClose} title="Close Chat Panel" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <FiX size={20} />
        </button>
      </header>

      {actionError && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 p-2 rounded-md text-xs mb-2 flex items-center flex-shrink-0">
          <FiAlertCircle className="mr-1.5 shrink-0" /> {actionError}
        </div>
      )}

      {/* This div will handle the scrolling of messages */}
      <div ref={scrollableMessagesRef} className="flex-grow overflow-y-auto space-y-3 pr-1.5 mb-3 custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id}>
            <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] p-2.5 rounded-lg text-xs flex items-start space-x-1.5 shadow
                            ${msg.sender === 'user' ? 'bg-[var(--primary-glow)] text-black rounded-br-none'
                                                    : 'bg-[var(--main-bg)] text-[var(--text-primary)] rounded-bl-none'}`}
              >
                {msg.sender === 'ai' && <FiCpu className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--primary-glow)]" />}
                {msg.isLoading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-225"></div>
                  </div>
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text}</p>
                )}
                {msg.sender === 'user' && <FiUser className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
              </div>
            </div>
            {currentUser && msg.sender === 'ai' && msg.playerContext && !msg.isLoading && (
              <div className="flex justify-start mt-1 ml-6 space-x-1.5">
                <button
                  onClick={() => handleViewFullReport(msg.playerContext!)}
                  disabled={!!actionLoading}
                  className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-0.5 rounded flex items-center disabled:opacity-50"
                >
                  {actionLoading === `view-${msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')}` ? <FiLoader className="animate-spin mr-1 text-xs"/> : <FiClipboard className="mr-1 text-xs" />} View Report
                </button>
                <button
                  onClick={async () => {
                    setActionLoading(`pick-${msg.playerContext!.mlbId || msg.playerContext!.name.toLowerCase().replace(/\s+/g, '-')}`);
                    await onSetPick(createPlayerPickData(msg.playerContext));
                    setActionLoading(null);
                  }}
                  disabled={!!actionLoading}
                  className="text-[10px] bg-green-600 hover:bg-green-700 text-white px-1.5 py-0.5 rounded flex items-center disabled:opacity-50"
                >
                  {actionLoading === `pick-${msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')}` ? <FiLoader className="animate-spin mr-1 text-xs"/> : <FiCheckSquare className="mr-1 text-xs" />} Set Pick
                </button>
                <button
                  onClick={async () => {
                     setActionLoading(`fav-${msg.playerContext!.mlbId || msg.playerContext!.name.toLowerCase().replace(/\s+/g, '-')}`);
                     await onToggleFavorite(createPlayerPickData(msg.playerContext));
                     setActionLoading(null);
                  }}
                  disabled={!!actionLoading}
                  className={`text-[10px] px-1.5 py-0.5 rounded flex items-center disabled:opacity-50
                              ${favoritePlayersMap[msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')]
                                ? 'bg-pink-600 hover:bg-pink-700 text-white'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
                >
                  {actionLoading === `fav-${msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')}` ? <FiLoader className="animate-spin mr-1 text-xs"/> : <FiHeart className="mr-1 text-xs" />}
                  {favoritePlayersMap[msg.playerContext.mlbId || msg.playerContext.name.toLowerCase().replace(/\s+/g, '-')] ? 'Unfavorite' : 'Favorite'}
                </button>
              </div>
            )}
          </div>
        ))}
        {/* The messagesEndRef does not need to be inside the map, but it's fine here as part of the overall strategy */}
        <div ref={messagesEndRef} /> 
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3 border-t border-[var(--border-color)] flex-shrink-0">
        <input
          type="text"
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          placeholder="Ask AI..."
          className="flex-grow bg-[var(--main-bg)] border border-[var(--border-color)] rounded-md p-2.5 text-xs text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--primary-glow)] focus:outline-none placeholder:text-[var(--text-secondary)]/70"
          disabled={isAiLoading}
        />
        <button
          type="submit"
          disabled={!currentQuery.trim() || isAiLoading}
          className="bg-[var(--primary-glow)] text-black p-2.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Send message"
        >
          {isAiLoading ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
};
