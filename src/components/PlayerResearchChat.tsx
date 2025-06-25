import React, { useState, FormEvent, useRef, useEffect } from 'react';
import { FiX, FiSend, FiLoader, FiMessageSquare, FiUser, FiCpu } from 'react-icons/fi';
import { fetchPlayerResearchResponse } from '@/services/geminiService';

interface PlayerResearchChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  isLoading?: boolean;
}

export const PlayerResearchChat: React.FC<PlayerResearchChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);
  
  useEffect(() => {
    // Add initial AI message when chat opens and is empty
    if (isOpen && messages.length === 0) {
      setMessages([
        { 
          id: 'ai-initial-' + Date.now(), 
          sender: 'ai', 
          text: "Hello! I'm your MLB Player Research Assistant. Ask me anything about player stats, matchups, recent performance, or other baseball-related queries to help with your picks!" 
        }
      ]);
    }
  }, [isOpen, messages.length]);


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentQuery.trim() || isAiLoading) return;

    const userMessage: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: currentQuery.trim(),
    };
    
    // Add user message and a temporary AI loading message
    setMessages(prev => [...prev, userMessage, {id: 'ai-loading-' + Date.now(), sender: 'ai', text: '', isLoading: true}]);
    setCurrentQuery('');
    setIsAiLoading(true);

    try {
      const aiResponseText = await fetchPlayerResearchResponse(userMessage.text);
      const aiMessage: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: aiResponseText,
      };
      // Replace AI loading message with actual response
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(aiMessage));
    } catch (error) {
      console.error("Player research chat error:", error);
      const errorMessage: ChatMessage = {
        id: 'ai-error-' + Date.now(),
        sender: 'ai',
        text: "Sorry, I encountered an error trying to get that information. Please try again or rephrase your question.",
      };
      setMessages(prev => prev.filter(msg => !msg.isLoading).concat(errorMessage));
    } finally {
      setIsAiLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onClose} // Close if backdrop is clicked
    >
      <div 
        className="bg-[var(--card-bg)] p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg h-[80vh] max-h-[700px] border border-[var(--border-color)] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent click inside from closing
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

        <div className="flex-grow overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
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