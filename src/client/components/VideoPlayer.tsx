import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MediaQuizTrigger } from '../../shared/types';
import { Z_INDEX_TAILWIND } from '../utils/zIndexLevels';
import QuizOverlay from './QuizOverlay';

interface VideoPlayerProps {
  src: string;
  title?: string;
  poster?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  
  // Quiz integration props
  quizTriggers?: MediaQuizTrigger[];
  onQuizTrigger?: (trigger: MediaQuizTrigger) => void;
  onQuizComplete?: (triggerId: string, correct: boolean) => void;
  allowSeeking?: boolean;
  enforceQuizCompletion?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  className = '',
  // Quiz props with defaults
  quizTriggers = [],
  onQuizTrigger,
  onQuizComplete,
  allowSeeking = true,
  enforceQuizCompletion = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Quiz-related state
  const [activeQuizTrigger, setActiveQuizTrigger] = useState<MediaQuizTrigger | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [isQuizActive, setIsQuizActive] = useState(false);
  const lastTriggerTimeRef = useRef<number>(-1);

  // Quiz trigger detection logic
  const checkForQuizTriggers = useCallback((currentTime: number) => {
    const triggerToFire = quizTriggers.find(trigger => {
      const isTimeToTrigger = currentTime >= trigger.timestamp && 
                             currentTime < trigger.timestamp + 0.5;
      const notAlreadyTriggered = !completedQuizzes.has(trigger.id);
      const notRecentlyTriggered = Math.abs(lastTriggerTimeRef.current - trigger.timestamp) > 1;
      
      return isTimeToTrigger && notAlreadyTriggered && notRecentlyTriggered;
    });

    if (triggerToFire) {
      lastTriggerTimeRef.current = triggerToFire.timestamp;
      
      if (triggerToFire.pauseMedia && videoRef.current) {
        videoRef.current.pause();
      }
      
      setActiveQuizTrigger(triggerToFire);
      setIsQuizActive(true);
      onQuizTrigger?.(triggerToFire);
    }
  }, [quizTriggers, completedQuizzes, onQuizTrigger]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Check for quiz triggers
      if (quizTriggers.length > 0 && !isQuizActive) {
        checkForQuizTriggers(video.currentTime);
      }
    };
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, [quizTriggers, completedQuizzes, isQuizActive, checkForQuizTriggers]);

  // Handle seeking restrictions
  const handleSeeked = () => {
    if (!allowSeeking && videoRef.current && enforceQuizCompletion) {
      const video = videoRef.current;
      const seekTime = video.currentTime;
      
      const skippedQuiz = quizTriggers.find(trigger => 
        trigger.timestamp < seekTime && !completedQuizzes.has(trigger.id)
      );
      
      if (skippedQuiz) {
        video.currentTime = Math.max(0, skippedQuiz.timestamp - 1);
      }
    }
  };

  // Quiz completion handler
  const handleQuizComplete = (correct: boolean) => {
    if (activeQuizTrigger) {
      setCompletedQuizzes(prev => new Set([...prev, activeQuizTrigger.id]));
      onQuizComplete?.(activeQuizTrigger.id, correct);
      
      if (activeQuizTrigger.resumeAfterCompletion && videoRef.current) {
        setTimeout(() => {
          videoRef.current?.play();
        }, 500);
      }
      
      setIsQuizActive(false);
      setActiveQuizTrigger(null);
    }
  };

  // Handle fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (videoRef.current) {
        if (!isFullscreen) {
          await videoRef.current.requestFullscreen();
        } else {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.warn('Fullscreen toggle failed:', error);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted}
        onSeeked={handleSeeked}
        className={`w-full h-full object-contain bg-black ${isQuizActive ? 'opacity-75' : ''}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
        onClick={togglePlay}
      />
      
      {/* Custom Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-blue-400 transition-colors"
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
                className="w-16 h-1 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            
            {/* Time Display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
              aria-label="Toggle fullscreen"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Quiz progress indicators on timeline */}
      {quizTriggers.length > 0 && duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-50">
          {quizTriggers.map(trigger => (
            <div
              key={trigger.id}
              className={`absolute top-0 w-1 h-full ${
                completedQuizzes.has(trigger.id) ? 'bg-green-500' : 'bg-yellow-500'
              }`}
              style={{ left: `${(trigger.timestamp / duration) * 100}%` }}
              title={`Quiz at ${Math.floor(trigger.timestamp / 60)}:${String(Math.floor(trigger.timestamp % 60)).padStart(2, '0')}`}
            />
          ))}
        </div>
      )}

      {/* Quiz overlay */}
      {isQuizActive && activeQuizTrigger && (
        <QuizOverlay
          quiz={activeQuizTrigger.quiz}
          onComplete={handleQuizComplete}
          className={`absolute inset-0 ${Z_INDEX_TAILWIND.HOTSPOTS}`}
        />
      )}
      
      {title && (
        <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-sm backdrop-blur-sm">
          {title}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;