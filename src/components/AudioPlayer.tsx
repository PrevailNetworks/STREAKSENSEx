import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiLoader } from 'react-icons/fi';
import { formatDateToMMDDYY } from '@/utils/dateUtils'; // We'll create this utility

interface AudioPlayerProps {
  selectedDate: Date;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ selectedDate }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    const fileName = formatDateToMMDDYY(selectedDate);
    const src = `/audio/${fileName}.mp3`;
    setAudioSrc(src);
    setIsLoading(true);
    setError(null);
    setIsPlaying(false); // Reset play state when date changes
    setCurrentTime(0); // Reset current time
    setDuration(0); // Reset duration
  }, [selectedDate]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.volume = isMuted ? 0 : volume;
      // Autoplay is generally not recommended and often blocked
      // If you need autoplay, consider adding a user setting or interaction first
      // audioRef.current.play().catch(e => console.warn("Autoplay prevented:", e));
    }
  }, [audioSrc, volume, isMuted]); // React to audioSrc, volume, and isMuted changes

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
      setError(null);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0); // Optionally reset to beginning
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    if (audioRef.current && audioRef.current.error) {
        console.error("Audio Error Code:", audioRef.current.error.code, "Message:", audioRef.current.error.message);
    } else {
        console.error("Audio Error event:", e);
    }
    setError("Daily overview audio not available.");
    setIsLoading(false);
    setDuration(0);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current || error || isLoading) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        // Handle play promise rejection, which can happen for various reasons
        // including the audio source not being loaded yet or an error occurring.
        console.error("Error attempting to play audio:", e);
        // Call handleAudioError to set error state if not already set by an `onerror` event
        if (!error) {
           handleAudioError(e as unknown as React.SyntheticEvent<HTMLAudioElement, Event>); // Cast for now, or refine error handling
        }
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newTime = Number(event.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    audioRef.current.volume = newVolume;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      setIsMuted(false);
      audioRef.current.volume = volume > 0 ? volume : 0.1; // Restore to previous or small volume
      if (volume === 0) setVolume(0.1); // Ensure volume state reflects unmuted state
    } else {
      setIsMuted(true);
      audioRef.current.volume = 0;
    }
  };


  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[var(--main-bg)] p-3 rounded-lg border border-[var(--border-color)]">
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
        preload="metadata" // Important for getting duration without full load
        src={audioSrc || undefined} // Explicitly set src here
      />
      <div className="flex items-center justify-between">
        <button
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={togglePlayPause}
          disabled={isLoading || !!error || duration === 0}
          className="text-[var(--text-primary)] hover:text-[var(--primary-glow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <FiLoader className="w-5 h-5 animate-spin" /> : (isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5" />)}
        </button>
        <div className="text-xs text-[var(--text-secondary)]">
          {error ? error : `${formatTime(currentTime)} / ${formatTime(duration)}`}
        </div>
        <div className="relative flex items-center">
            <button 
                aria-label={isMuted ? "Unmute" : "Mute"} 
                onClick={toggleMute}
                className="text-[var(--text-secondary)] hover:text-[var(--primary-glow)] transition-colors mr-2"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 300)} // Delay hide
            >
                {isMuted || volume === 0 ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
            </button>
            {showVolumeSlider && (
                 <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2  transform translate-x-[calc(100%_+_8px)] z-10" // Position to the right of the icon
                    onMouseEnter={() => setShowVolumeSlider(true)} 
                    onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 300)}
                 >
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-2 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-glow)]"
                    />
                 </div>
            )}
        </div>
      </div>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={handleProgressChange}
        disabled={isLoading || !!error || duration === 0}
        className="w-full h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer accent-[var(--primary-glow)] mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Audio progress"
      />
    </div>
  );
};
