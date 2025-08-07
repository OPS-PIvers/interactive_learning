import React, { useState, useRef, useEffect } from 'react';
import { MediaQuizTrigger } from '../../shared/types';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import QuizOverlay from './QuizOverlay';

interface AudioPlayerProps {
  src: string;
  title?: string;
  artist?: string;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
  
  // Quiz integration props
  quizTriggers?: MediaQuizTrigger[];
  onQuizTrigger?: (trigger: MediaQuizTrigger) => void;
  onQuizComplete?: (triggerId: string, correct: boolean) => void;
  allowSeeking?: boolean;
  enforceQuizCompletion?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  artist,
  autoplay = false,
  loop = false,
  className = '',
  // Quiz props with defaults
  quizTriggers = [],
  onQuizTrigger,
  onQuizComplete,
  allowSeeking = true,
  enforceQuizCompletion = false
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Quiz-related state
  const [activeQuizTrigger, setActiveQuizTrigger] = useState<MediaQuizTrigger | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [isQuizActive, setIsQuizActive] = useState(false);
  const lastTriggerTimeRef = useRef<number>(-1);

  // Quiz trigger detection logic
  const checkForQuizTriggers = (currentTime: number) => {
    const triggerToFire = quizTriggers.find(trigger => {
      const isTimeToTrigger = currentTime >= trigger.timestamp && 
                             currentTime < trigger.timestamp + 0.5;
      const notAlreadyTriggered = !completedQuizzes.has(trigger.id);
      const notRecentlyTriggered = Math.abs(lastTriggerTimeRef.current - trigger.timestamp) > 1;
      
      return isTimeToTrigger && notAlreadyTriggered && notRecentlyTriggered;
    });

    if (triggerToFire) {
      lastTriggerTimeRef.current = triggerToFire.timestamp;
      
      if (triggerToFire.pauseMedia && audioRef.current) {
        audioRef.current.pause();
      }
      
      setActiveQuizTrigger(triggerToFire);
      setIsQuizActive(true);
      onQuizTrigger?.(triggerToFire);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Check for quiz triggers
      if (quizTriggers.length > 0 && !isQuizActive) {
        checkForQuizTriggers(audio.currentTime);
      }
    };
    const handleDurationChange = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(audio.volume);
      setIsMuted(audio.muted);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('volumechange', handleVolumeChange);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('volumechange', handleVolumeChange);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [quizTriggers, completedQuizzes, isQuizActive]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 15, duration);
    }
  };

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 15, 0);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle seeking restrictions
  const handleSeeked = () => {
    if (!allowSeeking && audioRef.current && enforceQuizCompletion) {
      const audio = audioRef.current;
      const seekTime = audio.currentTime;
      
      const skippedQuiz = quizTriggers.find(trigger => 
        trigger.timestamp < seekTime && !completedQuizzes.has(trigger.id)
      );
      
      if (skippedQuiz) {
        audio.currentTime = Math.max(0, skippedQuiz.timestamp - 1);
      }
    }
  };

  // Quiz completion handler
  const handleQuizComplete = (correct: boolean) => {
    if (activeQuizTrigger) {
      setCompletedQuizzes(prev => new Set([...prev, activeQuizTrigger.id]));
      onQuizComplete?.(activeQuizTrigger.id, correct);
      
      if (activeQuizTrigger.resumeAfterCompletion && audioRef.current) {
        setTimeout(() => {
          audioRef.current?.play();
        }, 500);
      }
      
      setIsQuizActive(false);
      setActiveQuizTrigger(null);
    }
  };

  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoplay}
        loop={loop}
        preload="metadata"
        onSeeked={handleSeeked}
      />
      
      {/* Track Info */}
      <div className="mb-6 text-center">
        {/* Audio Waveform Visualization (Simplified) */}
        <div className="bg-slate-700 rounded-lg h-24 mb-4 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
          {/* Simplified waveform bars */}
          <div className="flex items-center justify-center space-x-1 h-full">
            {Array.from({ length: 40 }, (_, i) => (
              <div
                key={i}
                className={`bg-slate-400 rounded-full transition-all duration-300 ${
                  i < (progressPercentage / 100) * 40 ? 'bg-blue-400' : ''
                }`}
                style={{
                  width: '3px',
                  height: `${Math.random() * 60 + 20}%`,
                  opacity: isLoading ? 0.3 : 1
                }}
              />
            ))}
          </div>
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-slate-700/80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
            </div>
          )}
        </div>
        
        {(title || artist) && (
          <div className="text-white">
            {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
            {artist && <p className="text-slate-400 text-sm">{artist}</p>}
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
          disabled={isLoading}
        />
        <div className="flex justify-between text-slate-400 text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      
      {/* Control Buttons */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        {/* Skip Backward */}
        <button
          onClick={skipBackward}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          disabled={isLoading}
          aria-label="Skip backward 15 seconds"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 110 14H9a1 1 0 110-2h2a5 5 0 000-10H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">15s</span>
        </button>
        
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 transition-colors disabled:opacity-50 disabled:hover:bg-blue-500"
          disabled={isLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
          ) : isPlaying ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Skip Forward */}
        <button
          onClick={skipForward}
          className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          disabled={isLoading}
          aria-label="Skip forward 15 seconds"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 9H9a7 7 0 100 14h2a1 1 0 110 2H9A9 9 0 119 7h5.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-xs">15s</span>
        </button>
      </div>
      
      {/* Volume Control */}
      <div className="flex items-center space-x-3">
        <button
          onClick={toggleMute}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted || volume === 0 ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.866 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.866l3.517-2.793a1 1 0 011.617.793zM12 6l2 2 2-2 1.414 1.414L15.414 9l2 2L16 12.414l-2-2-2 2L10.586 11l2-2-2-2L12 6z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.866 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.866l3.517-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="flex-1 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
        />
        
        <span className="text-slate-400 text-sm min-w-[3rem]">
          {Math.round((isMuted ? 0 : volume) * 100)}%
        </span>
      </div>
      
      {/* Quiz progress indicators on progress bar */}
      {quizTriggers.length > 0 && duration > 0 && (
        <div className="relative mb-2">
          <div className="absolute top-0 left-0 right-0 h-2 -mt-1">
            {quizTriggers.map(trigger => (
              <div
                key={trigger.id}
                className={`absolute top-0 w-2 h-2 rounded-full ${
                  completedQuizzes.has(trigger.id) ? 'bg-green-500' : 'bg-yellow-500'
                }`}
                style={{ left: `${(trigger.timestamp / duration) * 100}%` }}
                title={`Quiz at ${Math.floor(trigger.timestamp / 60)}:${String(Math.floor(trigger.timestamp % 60)).padStart(2, '0')}`}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Quiz overlay - full screen for audio */}
      {isQuizActive && activeQuizTrigger && (
        <div className={`fixed inset-0 ${Z_INDEX_TAILWIND.MODAL_CONTENT}`}>
          <QuizOverlay
            quiz={activeQuizTrigger.quiz}
            onComplete={handleQuizComplete}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;