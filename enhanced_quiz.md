# Enhanced Media Quiz Implementation Guide

## Overview
This guide details how to implement timestamp-based quiz integration with media playback in the Interactive Learning Hub. The solution extends existing components and types to avoid redundancy while adding powerful new functionality.

## Core Concept
Instead of separate sequential events, we create **composite media events** that embed quiz triggers at specific timestamps within video/audio playback. When media reaches a quiz timestamp, it automatically pauses and displays the question overlay.

---

## Phase 1: Extend Existing Type Definitions

### 1.1 Update `src/shared/types.ts`

Add these new interfaces to extend existing functionality:

```typescript
// Add after existing interfaces
export interface MediaQuizTrigger {
  id: string;
  timestamp: number; // seconds into media
  pauseMedia: boolean; // auto-pause at this point
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
    showExplanation?: boolean;
  };
  resumeAfterCompletion: boolean; // auto-resume when quiz complete
}

// Extend existing TimelineEventData interface
// ADD these properties to the existing interface (don't replace):
export interface TimelineEventData {
  // ... existing properties ...
  
  // NEW: Enhanced media quiz properties
  quizTriggers?: MediaQuizTrigger[];
  allowSeeking?: boolean; // prevent skipping past incomplete quizzes
  enforceQuizCompletion?: boolean; // must complete all quizzes to continue
  quizMode?: 'overlay' | 'modal' | 'inline'; // how to display quiz
}
```

**Why this approach**: Extends existing types rather than creating new ones, maintaining backward compatibility.

---

## Phase 2: Enhanced Media Player Components

### 2.1 Extend Existing VideoPlayer Component

**File**: `src/client/components/VideoPlayer.tsx`

**Strategy**: Add quiz functionality as optional props to existing component:

```typescript
// ADD these new props to existing VideoPlayerProps interface:
interface VideoPlayerProps {
  // ... existing props ...
  
  // NEW: Quiz integration props
  quizTriggers?: MediaQuizTrigger[];
  onQuizTrigger?: (trigger: MediaQuizTrigger) => void;
  onQuizComplete?: (triggerId: string, correct: boolean) => void;
  allowSeeking?: boolean;
  enforceQuizCompletion?: boolean;
}

// MODIFY existing VideoPlayer component by adding these features:
const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  title,
  poster,
  autoplay = false,
  loop = false,
  muted = false,
  className = '',
  // NEW quiz props with defaults
  quizTriggers = [],
  onQuizTrigger,
  onQuizComplete,
  allowSeeking = true,
  enforceQuizCompletion = false
}) => {
  // ... existing state ...
  
  // NEW: Quiz-related state
  const [activeQuizTrigger, setActiveQuizTrigger] = useState<MediaQuizTrigger | null>(null);
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [isQuizActive, setIsQuizActive] = useState(false);
  const lastTriggerTimeRef = useRef<number>(-1);

  // EXTEND existing timeupdate handler
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // NEW: Check for quiz triggers
      if (quizTriggers.length > 0 && !isQuizActive) {
        checkForQuizTriggers(video.currentTime);
      }
    };

    // ... existing event listeners ...
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      // ... existing cleanup ...
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [quizTriggers, completedQuizzes, isQuizActive]); // Add dependencies

  // NEW: Quiz trigger detection logic
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
      
      if (triggerToFire.pauseMedia && videoRef.current) {
        videoRef.current.pause();
      }
      
      setActiveQuizTrigger(triggerToFire);
      setIsQuizActive(true);
      onQuizTrigger?.(triggerToFire);
    }
  };

  // NEW: Handle seeking restrictions
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

  // NEW: Quiz completion handler
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

  // MODIFY the return JSX to include quiz overlay and progress indicators
  return (
    <div className={`relative ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        loop={loop}
        muted={muted || isMuted}
        onSeeked={handleSeeked} // NEW
        className={`w-full h-full ${isQuizActive ? 'opacity-75' : ''}`} // NEW: dim during quiz
      />
      
      {/* ... existing controls JSX ... */}
      
      {/* NEW: Quiz progress indicators on timeline */}
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

      {/* NEW: Quiz overlay */}
      {isQuizActive && activeQuizTrigger && (
        <QuizOverlay
          quiz={activeQuizTrigger.quiz}
          onComplete={handleQuizComplete}
          className="absolute inset-0 z-20"
        />
      )}
    </div>
  );
};
```

### 2.2 Extend Existing AudioPlayer Component

**File**: `src/client/components/AudioPlayer.tsx`

Apply similar pattern as VideoPlayer but adapted for audio:

```typescript
// Add same quiz props to AudioPlayerProps
// Add same quiz state and logic
// For audio, quiz overlay should be full-screen modal since no video canvas exists
// Audio continues playing unless pauseMedia is true
```

### 2.3 Extend Existing YouTubePlayer Component

**File**: `src/client/components/YouTubePlayer.tsx`

```typescript
// More complex due to YouTube API limitations
// Use YouTube iframe API to monitor time and trigger quizzes
// May need to poll currentTime since timeupdate events are limited
```

---

## Phase 3: Create Quiz Overlay Component

### 3.1 New Component: QuizOverlay

**File**: `src/client/components/QuizOverlay.tsx`

```typescript
import React, { useState } from 'react';
import { MediaQuizTrigger } from '../../shared/types';

interface QuizOverlayProps {
  quiz: MediaQuizTrigger['quiz'];
  onComplete: (correct: boolean) => void;
  className?: string;
}

const QuizOverlay: React.FC<QuizOverlayProps> = ({ 
  quiz, 
  onComplete, 
  className = '' 
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    
    const isCorrect = answerIndex === quiz.correctAnswer;
    
    if (quiz.explanation && quiz.showExplanation) {
      setShowExplanation(true);
      setTimeout(() => onComplete(isCorrect), 3000);
    } else {
      setTimeout(() => onComplete(isCorrect), 500);
    }
  };

  return (
    <div className={`bg-black bg-opacity-80 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">?</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Quick Check</h3>
        </div>
        
        <p className="text-gray-800 mb-6">{quiz.question}</p>
        
        <div className="space-y-3">
          {quiz.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              disabled={hasAnswered}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                hasAnswered
                  ? index === quiz.correctAnswer
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : index === selectedAnswer
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-gray-100 border-gray-300 text-gray-600'
                  : 'bg-gray-50 border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-800'
              }`}
            >
              <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>
        
        {showExplanation && quiz.explanation && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Explanation:</strong> {quiz.explanation}
            </p>
          </div>
        )}
        
        {hasAnswered && !showExplanation && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => onComplete(selectedAnswer === quiz.correctAnswer)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizOverlay;
```

---

## Phase 4: Update Event Editors

### 4.1 Extend Existing EditableEventCard Component

**File**: `src/client/components/EditableEventCard.tsx`

Add quiz trigger configuration to existing media event editors:

```typescript
// MODIFY existing cases for SHOW_VIDEO, SHOW_AUDIO_MODAL, PLAY_VIDEO, PLAY_AUDIO
// ADD quiz triggers section after existing media URL configuration

case InteractionType.SHOW_VIDEO:
  return (
    <div className="space-y-3 mt-2">
      {/* ... existing video URL, poster, autoplay, loop fields ... */}
      
      {/* NEW: Quiz Triggers Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <label className="block text-xs font-medium text-slate-300">
            Interactive Quizzes
          </label>
          <button
            onClick={() => addQuizTrigger(event)}
            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
          >
            + Add Quiz
          </button>
        </div>
        
        {event.quizTriggers && event.quizTriggers.length > 0 && (
          <div className="space-y-2">
            {event.quizTriggers.map((trigger, index) => (
              <QuizTriggerEditor
                key={trigger.id}
                trigger={trigger}
                index={index}
                onUpdate={(updatedTrigger) => updateQuizTrigger(event, index, updatedTrigger)}
                onDelete={() => deleteQuizTrigger(event, index)}
              />
            ))}
          </div>
        )}
        
        {event.quizTriggers && event.quizTriggers.length > 0 && (
          <div className="mt-3 space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!event.allowSeeking}
                onChange={(e) => onUpdate({ ...event, allowSeeking: !e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs text-slate-300">Prevent skipping past incomplete quizzes</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={!!event.enforceQuizCompletion}
                onChange={(e) => onUpdate({ ...event, enforceQuizCompletion: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs text-slate-300">Must complete all quizzes to finish</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );

// ADD these helper functions to the component:
const addQuizTrigger = (event: TimelineEventData) => {
  const newTrigger: MediaQuizTrigger = {
    id: `quiz-${Date.now()}`,
    timestamp: 0,
    pauseMedia: true,
    quiz: {
      question: 'Enter your question here',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0
    },
    resumeAfterCompletion: true
  };
  
  const updatedTriggers = [...(event.quizTriggers || []), newTrigger];
  onUpdate({ ...event, quizTriggers: updatedTriggers });
};

const updateQuizTrigger = (event: TimelineEventData, index: number, updatedTrigger: MediaQuizTrigger) => {
  const updatedTriggers = event.quizTriggers?.map((trigger, i) => 
    i === index ? updatedTrigger : trigger
  ) || [];
  onUpdate({ ...event, quizTriggers: updatedTriggers });
};

const deleteQuizTrigger = (event: TimelineEventData, index: number) => {
  const updatedTriggers = event.quizTriggers?.filter((_, i) => i !== index) || [];
  onUpdate({ ...event, quizTriggers: updatedTriggers });
};
```

### 4.2 Create QuizTriggerEditor Component

**File**: `src/client/components/QuizTriggerEditor.tsx`

```typescript
import React, { useState } from 'react';
import { MediaQuizTrigger } from '../../shared/types';

interface QuizTriggerEditorProps {
  trigger: MediaQuizTrigger;
  index: number;
  onUpdate: (trigger: MediaQuizTrigger) => void;
  onDelete: () => void;
}

const QuizTriggerEditor: React.FC<QuizTriggerEditorProps> = ({
  trigger,
  index,
  onUpdate,
  onDelete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateQuiz = (updates: Partial<MediaQuizTrigger['quiz']>) => {
    onUpdate({
      ...trigger,
      quiz: { ...trigger.quiz, ...updates }
    });
  };

  const addOption = () => {
    const newOptions = [...trigger.quiz.options, `Option ${trigger.quiz.options.length + 1}`];
    updateQuiz({ options: newOptions });
  };

  const removeOption = (optionIndex: number) => {
    if (trigger.quiz.options.length <= 2) return; // Minimum 2 options
    
    const newOptions = trigger.quiz.options.filter((_, i) => i !== optionIndex);
    const newCorrectAnswer = trigger.quiz.correctAnswer >= optionIndex && trigger.quiz.correctAnswer > 0
      ? trigger.quiz.correctAnswer - 1
      : trigger.quiz.correctAnswer;
    
    updateQuiz({ options: newOptions, correctAnswer: newCorrectAnswer });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-gray-300 rounded p-3 bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Quiz {index + 1}</span>
          <span className="text-xs text-gray-600">
            at {formatTime(trigger.timestamp)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Timestamp */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Timestamp (seconds)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={trigger.timestamp}
              onChange={(e) => onUpdate({ ...trigger, timestamp: parseFloat(e.target.value) || 0 })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>

          {/* Question */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Question
            </label>
            <textarea
              value={trigger.quiz.question}
              onChange={(e) => updateQuiz({ question: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              rows={2}
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-700">
                Answer Options
              </label>
              <button
                onClick={addOption}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                + Option
              </button>
            </div>
            {trigger.quiz.options.map((option, optionIndex) => (
              <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                <input
                  type="radio"
                  name={`correct-${trigger.id}`}
                  checked={trigger.quiz.correctAnswer === optionIndex}
                  onChange={() => updateQuiz({ correctAnswer: optionIndex })}
                  className="text-green-600"
                />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...trigger.quiz.options];
                    newOptions[optionIndex] = e.target.value;
                    updateQuiz({ options: newOptions });
                  }}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                {trigger.quiz.options.length > 2 && (
                  <button
                    onClick={() => removeOption(optionIndex)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={trigger.pauseMedia}
                onChange={(e) => onUpdate({ ...trigger, pauseMedia: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs">Pause media at this point</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={trigger.resumeAfterCompletion}
                onChange={(e) => onUpdate({ ...trigger, resumeAfterCompletion: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs">Auto-resume after quiz completion</span>
            </label>
          </div>

          {/* Optional Explanation */}
          <div>
            <label className="flex items-center mb-1">
              <input
                type="checkbox"
                checked={!!trigger.quiz.showExplanation}
                onChange={(e) => updateQuiz({ showExplanation: e.target.checked })}
                className="mr-2"
              />
              <span className="text-xs font-medium text-gray-700">Show explanation after answer</span>
            </label>
            {trigger.quiz.showExplanation && (
              <textarea
                value={trigger.quiz.explanation || ''}
                onChange={(e) => updateQuiz({ explanation: e.target.value })}
                placeholder="Explain the correct answer..."
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                rows={2}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizTriggerEditor;
```

---

## Phase 5: Update InteractiveModule

### 5.1 Modify Event Execution

**File**: `src/client/components/InteractiveModule.tsx`

Update the `executeTimelineEvent` function to handle quiz-enabled media:

```typescript
// FIND the existing executeTimelineEvent function and MODIFY these cases:

const executeTimelineEvent = (event: TimelineEventData) => {
  // ... existing code ...

  switch (event.type) {
    // MODIFY existing video cases
    case InteractionType.SHOW_VIDEO:
    case InteractionType.PLAY_VIDEO:
      setMediaModal({
        isOpen: true,
        type: 'video',
        title: event.name,
        data: {
          src: event.videoUrl || event.mediaUrl,
          poster: event.poster,
          autoplay: event.autoplay,
          loop: event.loop,
          // NEW: Pass quiz data to media modal
          quizTriggers: event.quizTriggers,
          allowSeeking: event.allowSeeking,
          enforceQuizCompletion: event.enforceQuizCompletion,
          onQuizTrigger: (trigger: MediaQuizTrigger) => {
            console.log('Quiz triggered:', trigger);
          },
          onQuizComplete: (triggerId: string, correct: boolean) => {
            console.log('Quiz completed:', triggerId, correct);
            // TODO: Track quiz results for progress/scoring
          }
        }
      });
      break;

    // MODIFY existing audio cases  
    case InteractionType.SHOW_AUDIO_MODAL:
    case InteractionType.PLAY_AUDIO:
      setMediaModal({
        isOpen: true,
        type: 'audio',
        title: event.name,
        data: {
          src: event.audioUrl || event.mediaUrl,
          title: event.title,
          artist: event.artist,
          autoplay: event.autoplay,
          loop: event.loop,
          // NEW: Pass quiz data to media modal
          quizTriggers: event.quizTriggers,
          allowSeeking: event.allowSeeking,
          enforceQuizCompletion: event.enforceQuizCompletion,
          onQuizTrigger: (trigger: MediaQuizTrigger) => {
            console.log('Quiz triggered:', trigger);
          },
          onQuizComplete: (triggerId: string, correct: boolean) => {
            console.log('Quiz completed:', triggerId, correct);
          }
        }
      });
      break;

    // ... other existing cases remain unchanged ...
  }
};
```

### 5.2 Update MediaModal Component

**File**: `src/client/components/MediaModal.tsx`

Pass quiz props to player components:

```typescript
// MODIFY the media modal to pass quiz props to players

{mediaModal.type === 'video' && mediaModal.data && (
  <VideoPlayer
    src={mediaModal.data.src}
    title={mediaModal.title}
    poster={mediaModal.data.poster}
    autoplay={mediaModal.data.autoplay}
    loop={mediaModal.data.loop}
    // NEW: Pass quiz props
    quizTriggers={mediaModal.data.quizTriggers}
    onQuizTrigger={mediaModal.data.onQuizTrigger}
    onQuizComplete={mediaModal.data.onQuizComplete}
    allowSeeking={mediaModal.data.allowSeeking}
    enforceQuizCompletion={mediaModal.data.enforceQuizCompletion}
    className="w-full h-full"
  />
)}

{mediaModal.type === 'audio' && mediaModal.data && (
  <div className="p-4 flex items-center justify-center min-h-0 flex-1">
    <AudioPlayer
      src={mediaModal.data.src}
      title={mediaModal.data.title}
      artist={mediaModal.data.artist}
      autoplay={mediaModal.data.autoplay}
      loop={mediaModal.data.loop}
      // NEW: Pass quiz props
      quizTriggers={mediaModal.data.quizTriggers}
      onQuizTrigger={mediaModal.data.onQuizTrigger}
      onQuizComplete={mediaModal.data.onQuizComplete}
      allowSeeking={mediaModal.data.allowSeeking}
      enforceQuizCompletion={mediaModal.data.enforceQuizCompletion}
      className="w-full max-w-lg"
    />
  </div>
)}
```

---

## Phase 6: Mobile Integration

### 6.1 Update Mobile Components

**File**: `src/client/components/mobile/MobileMediaModal.tsx`

Ensure mobile media players support quiz overlays:

```typescript
// ADD quiz support to mobile media players
// Quiz overlays should be full-screen on mobile
// Touch-friendly quiz interface with larger buttons
// Haptic feedback on quiz interactions (if supported)
```

---

## Phase 7: Testing Strategy

### 7.1 Test Cases to Implement

1. **Basic Functionality**
   - Quiz triggers at correct timestamps
   - Media pauses when `pauseMedia: true`
   - Media resumes when `resumeAfterCompletion: true`
   - Quiz overlay displays correctly

2. **Edge Cases**
   - Multiple quizzes close together in time
   - User seeks backwards to completed quiz
   - User seeks forward past incomplete quiz (when `enforceQuizCompletion: true`)
   - Media ends before quiz completion

3. **Mobile Specific**
   - Quiz overlay responsive on small screens
   - Touch interactions work correctly
   - Media controls remain accessible during quiz

### 7.2 Implementation Order

1. ✅ **Start here**: Update type definitions
2. ✅ **Next**: Extend VideoPlayer component with basic quiz functionality
3. ✅ **Then**: Create QuizOverlay component
4. ✅ **After**: Update EditableEventCard with quiz trigger editor
5. ✅ **Finally**: Test and refine mobile experience

---

## Phase 8: Advanced Features (Future)

### 8.1 Analytics & Progress Tracking

```typescript
// Track quiz performance
interface QuizResults {
  triggerId: string;
  correct: boolean;
  timeToAnswer: number;
  attempts: number;
}

// Integration with learning analytics
const trackQuizCompletion = (results: QuizResults) => {
  // Send to analytics service
  // Update user progress
  // Store for reporting
};
```

### 8.2 Advanced Quiz Types

- Multiple choice with multiple correct answers
- True/false questions
- Text input answers
- Image-based questions
- Branching scenarios based on answers

### 8.3 AI-Generated Quizzes

- Automatically generate quiz questions from video transcripts
- Adaptive difficulty based on user performance
- Context-aware questions based on visual content

---

## Implementation Checklist

- [ ] Update `src/shared/types.ts` with new interfaces
- [ ] Extend `VideoPlayer.tsx` with quiz functionality  
- [ ] Create `QuizOverlay.tsx` component
- [ ] Extend `AudioPlayer.tsx` with quiz functionality
- [ ] Create `QuizTriggerEditor.tsx` component
- [ ] Update `EditableEventCard.tsx` with quiz editors
- [ ] Modify `InteractiveModule.tsx` event execution
- [ ] Update `MediaModal.tsx` to pass quiz props
- [ ] Test basic video + quiz functionality
- [ ] Test basic audio + quiz functionality
- [ ] Update mobile components for quiz support
- [ ] Test mobile quiz experience
- [ ] Add YouTube player quiz support (optional)
- [ ] Implement progress tracking (optional)
- [ ] Add analytics integration (optional)

---

## Notes for Claude Code Implementation

1. **Backward Compatibility**: All existing media events continue to work unchanged. Quiz features are additive.

2. **Performance**: Quiz checking only occurs during media playback, minimal performance impact.

3. **Extensibility**: The MediaQuizTrigger interface can be extended for future quiz types without breaking changes.

4. **Mobile First**: Quiz overlays are designed to work seamlessly on both desktop and mobile.

5. **Accessibility**: Quiz components should include proper ARIA labels and keyboard navigation.

6. **Error Handling**: Graceful degradation if quiz data is malformed or missing.

This implementation provides a robust, integrated solution for media-synchronized quizzes while maintaining the existing codebase structure and avoiding unnecessary complexity.