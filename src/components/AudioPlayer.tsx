import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiLoader } from 'react-icons/fi';
import { formatDateToMMDDYY } from '@/utils/dateUtils';

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
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [selectedDate]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      audioRef.current.src = audioSrc;
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.load(); // Explicitly tell the browser to load the new source
    }
  }, [audioSrc, volume, isMuted]);

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
    setCurrentTime(0);
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    let message = "Daily overview audio not available.";
    if (audioRef.current && audioRef.current.error) {
        console.error("Audio Element Error Code:", audioRef.current.error.code, "Message:", audioRef.current.error.message);
        switch(audioRef.current.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
                message = "Audio playback aborted.";
                break;
            case MediaError.MEDIA_ERR_NETWORK:
                message = "Network error prevented audio playback.";
                break;
            case MediaError.MEDIA_ERR_DECODE:
                message = "Error decoding audio file.";
                break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                message = "Audio format not supported or file unavailable.";
                break;
            default:
                message = "An unknown audio error occurred.";
        }
    } else {
        console.error("Audio Error event:", e);
    }
    setError(message);
    setIsLoading(false);
    setDuration(0);
    setCurrentTime(0);
  };

  const handlePlayPromiseError = (playError: any) => {
    console.error("Error attempting to play audio (Promise Rejection):", playError);
    // Set error only if not already set by an `onerror` event from the audio tag
    if (!error) { 
        setError("Failed to start audio playback.");
    }
    setIsPlaying(false);
    setIsLoading(false); 
  };

  const togglePlayPause = () => {
    if (!audioRef.current || error || isLoading) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          // If a previous error existed (e.g. from file not found initially, then it was found), clear it on successful play
          if (error) setError(null); 
        })
        .catch(handlePlayPromiseError);
    }
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
      audioRef.current.volume = volume > 0 ? volume : 0.1;
      if (volume === 0) setVolume(0.1);
    } else {
      setIsMuted(true);
      audioRef.current.volume = 0;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time === Infinity || time < 0) return '0:00';
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
        preload="metadata"
        // src attribute is set in useEffect
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
        <div className="text-xs text-[var(--text-secondary)] min-w-[80px] text-center">
          {error && !isLoading ? error : `${formatTime(currentTime)} / ${formatTime(duration)}`}
        </div>
        <div className="relative flex items-center">
            <button 
                aria-label={isMuted ? "Unmute" : "Mute"} 
                onClick={toggleMute}
                className="text-[var(--text-secondary)] hover:text-[var(--primary-glow)] transition-colors mr-2"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setTimeout(() => setShowVolumeSlider(false), 300)}
            >
                {isMuted || volume === 0 ? <FiVolumeX className="w-4 h-4" /> : <FiVolume2 className="w-4 h-4" />}
            </button>
            {showVolumeSlider && (
                 <div 
                    className="absolute right-0 top-1/2 -translate-y-1/2 transform translate-x-[calc(100%_+_8px)] z-10"
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
                        aria-label="Volume"
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
