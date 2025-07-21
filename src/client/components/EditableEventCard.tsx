import React, { useState, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Identifier, XYCoord } from 'dnd-core';
import { TimelineEventData, InteractionType, HotspotData, MediaQuizTrigger } from '../../shared/types';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { EyeIcon } from './icons/EyeIcon';
import { EyeSlashIcon } from './icons/EyeSlashIcon';
import DragHandle from './DragHandle'; // Assuming DragHandle.tsx exists
// import EventTypeSelector from './EventTypeSelector';
import SliderControl from './SliderControl';
import { triggerHapticFeedback } from '../utils/hapticUtils'; // Import haptic utility
import QuizTriggerEditor from './QuizTriggerEditor';
import TextBannerCheckbox from './TextBannerCheckbox';
interface EditableEventCardProps {
  index: number;
  event: TimelineEventData;
  onUpdate: (event: TimelineEventData) => void;
  onDelete: (eventId: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onTogglePreview: () => void;
  onEdit: () => void;
  isPreviewing: boolean;
  // isBeingDragged?: boolean; // This will be determined by the useDrag hook within this component
  allHotspots: HotspotData[];
  isActive?: boolean;
  onJumpToStep?: (step: number) => void;
  className?: string;
}

const EventTypeToggle: React.FC<{ type: InteractionType }> = ({ type }) => {
  const getTypeLabel = () => {
    // ... (same as existing getTypeLabel)
    switch (type) {
      case InteractionType.SPOTLIGHT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return 'spotlight';
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        return 'pan-zoom';
      case InteractionType.SHOW_TEXT:
        return 'text';
      case InteractionType.SHOW_IMAGE_MODAL:
      case InteractionType.SHOW_VIDEO: // Covers SHOW_VIDEO and SHOW_VIDEO_MODAL conceptually for the toggle
      case InteractionType.SHOW_YOUTUBE:
        return 'media';
      case InteractionType.QUIZ:
        return 'question';
      case InteractionType.SHOW_AUDIO_MODAL:
        return 'audio';
      default:
        return type.toLowerCase().replace(/_/g, ' ').replace('hotspot', '').trim();
    }
  };

  return (
    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-purple-600 bg-purple-200 dark:text-purple-300 dark:bg-purple-700">
      {getTypeLabel()}
    </span>
  );
};

const EditableEventCard: React.FC<EditableEventCardProps> = ({
  index,
  event,
  onUpdate,
  onDelete,
  moveCard,
  onTogglePreview,
  onEdit,
  isPreviewing,
  allHotspots,
  isActive = false,
  onJumpToStep,
  className = ''
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(event.name || '');
  const cardRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const quizIdCounter = useRef(0);

  const [{ handlerId }, drop] = useDrop<
    { id: string; index: number; type: string }, // item object type from useDrag
    void,
    { handlerId: Identifier | null }
  >({
    accept: 'EditableEventCard',
    hover(item, monitor) {
      if (!cardRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = cardRef.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;

      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'EditableEventCard',
    item: () => ({ id: event.id, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  // Connect drag source to the handle, preview to the card, drop to the card
  if (dragHandleRef.current) {
    drag(dragHandleRef);
  }
  if (cardRef.current) {
    preview(cardRef);
    drop(cardRef);
  }

  const inputBaseClasses = "w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:ring-purple-500 focus:border-purple-500 text-sm dark:bg-slate-800 dark:border-slate-700 dark:focus:ring-purple-600 dark:focus:border-purple-600";
  const checkboxLabelClasses = "flex items-center space-x-2 cursor-pointer text-sm text-slate-300 dark:text-slate-400";
  const checkboxInputClasses = "form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-offset-slate-900";

  // Quiz trigger helper functions
  const addQuizTrigger = (event: TimelineEventData) => {
    const newTrigger: MediaQuizTrigger = {
      id: `quiz-${++quizIdCounter.current}`,
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

  const renderSettings = () => {
    // ... (all the existing renderSettings logic with updated classes as per previous diff)
    // For brevity, assuming the input styling changes from the previous diff are included here.
    // I will re-paste just one case for an example of the styling.
      switch (event.type) {
      case InteractionType.SPOTLIGHT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
        return (
          <div className="space-y-3 mt-2">
            <div>
              <label htmlFor={`eventShape-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Shape</label>
              <select
                id={`eventShape-${event.id}`}
                value={event.highlightShape || event.shape || 'circle'}
                onChange={(e) => onUpdate({ 
                  ...event, 
                  highlightShape: e.target.value as 'circle' | 'rectangle',
                  shape: e.target.value as 'circle' | 'rectangle'
                })}
                className={inputBaseClasses}
              >
                <option value="circle">Circle</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </div>
            <SliderControl
              label="Opacity / Dimming"
              value={event.opacity || event.dimPercentage ? (event.dimPercentage || 70) / 100 : 0.7}
              min={0}
              max={1}
              step={0.01}
              unit=" (0-1)"
              onChange={(val) => onUpdate({ 
                ...event, 
                opacity: val,
                dimPercentage: val * 100
              })}
            />
            <TextBannerCheckbox
              checked={!!event.showTextBanner}
              onChange={(checked) => onUpdate({ ...event, showTextBanner: checked })}
              id={`showTextBanner-spotlight-${event.id}`}
            />
          </div>
        );
         case InteractionType.PAN_ZOOM:
         case InteractionType.PAN_ZOOM_TO_HOTSPOT:
           return (
             <div className="space-y-3 mt-2">
               <SliderControl
                 label="Zoom Level"
                 value={event.zoom || event.zoomLevel || event.zoomFactor || 2}
                 min={1}
                 max={10}
                 step={0.1}
                 unit="x"
                 onChange={(val) => onUpdate({
                   ...event,
                   zoom: val,
                   zoomLevel: val,
                   zoomFactor: val
                 })}
               />
               <TextBannerCheckbox
                 checked={!!event.showTextBanner}
                 onChange={(checked) => onUpdate({ ...event, showTextBanner: checked })}
                 id={`showTextBanner-panzoom-${event.id}`}
               />
             </div>
           );
         case InteractionType.SHOW_TEXT:
           return (
             <div className="space-y-3 mt-2">
               <div>
                 <label htmlFor={`textContent-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Text Content</label>
                 <textarea
                   id={`textContent-${event.id}`}
                   value={event.textContent || event.content || ''}
                   onChange={(e) => onUpdate({
                     ...event,
                     textContent: e.target.value
                   })}
                   className={`${inputBaseClasses} min-h-[60px]`}
                   placeholder="Enter text content..."
                   rows={3}
                 />
               </div>
             </div>
           );
         case InteractionType.SHOW_IMAGE_MODAL:
           return (
             <div className="space-y-3 mt-2">
               <div>
                 <label htmlFor={`imageUrl-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Image URL</label>
                 <input
                   id={`imageUrl-${event.id}`}
                   type="url"
                   value={event.imageUrl || ''}
                   onChange={(e) => onUpdate({ ...event, imageUrl: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="https://example.com/image.jpg"
                 />
               </div>
               <div>
                 <label htmlFor={`caption-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Caption (Optional)</label>
                 <input
                   id={`caption-${event.id}`}
                   type="text"
                   value={event.caption || ''}
                   onChange={(e) => onUpdate({ ...event, caption: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="Optional: Image caption"
                 />
               </div>
             </div>
           );
         case InteractionType.SHOW_VIDEO:
           return (
             <div className="space-y-3 mt-2">
               <div>
                 <label htmlFor={`videoUrl-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Video URL (e.g., .mp4)</label>
                 <input
                   id={`videoUrl-${event.id}`}
                   type="url"
                   value={event.videoUrl || ''}
                   onChange={(e) => onUpdate({ ...event, videoUrl: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="https://example.com/video.mp4"
                 />
               </div>
               <div>
                 <label htmlFor={`posterUrl-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Poster Image URL (Optional)</label>
                 <input
                   id={`posterUrl-${event.id}`}
                   type="url"
                   value={event.poster || ''}
                   onChange={(e) => onUpdate({ ...event, poster: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="Optional: Poster image URL"
                 />
               </div>
               <div className="flex items-center space-x-4 pt-1">
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.autoplay}
                     onChange={(e) => onUpdate({ ...event, autoplay: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Autoplay</span>
                 </label>
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.loop}
                     onChange={(e) => onUpdate({ ...event, loop: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Loop</span>
                 </label>
               </div>
               
               {/* Quiz Triggers Section */}
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
         case InteractionType.SHOW_AUDIO_MODAL:
           return (
             <div className="space-y-3 mt-2">
               <div>
                 <label htmlFor={`audioUrl-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Audio URL (e.g., .mp3)</label>
                 <input
                   id={`audioUrl-${event.id}`}
                   type="url"
                   value={event.audioUrl || ''}
                   onChange={(e) => onUpdate({ ...event, audioUrl: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="https://example.com/audio.mp3"
                 />
               </div>
               <div>
                 <label htmlFor={`audioTitle-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Track Title (Optional)</label>
                 <input
                   id={`audioTitle-${event.id}`}
                   type="text"
                   value={event.audioTitle || event.textContent || ''}
                   onChange={(e) => onUpdate({ ...event, audioTitle: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="Optional: Track Title"
                 />
               </div>
               <div>
                 <label htmlFor={`audioArtist-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Artist Name (Optional)</label>
                 <input
                   id={`audioArtist-${event.id}`}
                   type="text"
                   value={event.artist || ''}
                   onChange={(e) => onUpdate({ ...event, artist: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="Optional: Artist Name"
                 />
               </div>
               <div className="flex items-center space-x-4 pt-1">
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.autoplay}
                     onChange={(e) => onUpdate({ ...event, autoplay: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Autoplay</span>
                 </label>
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.loop}
                     onChange={(e) => onUpdate({ ...event, loop: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Loop</span>
                 </label>
               </div>
               
               {/* Quiz Triggers Section */}
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
         case InteractionType.SHOW_YOUTUBE:
           return (
             <div className="space-y-3 mt-2">
               <div>
                 <label htmlFor={`youtubeId-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">YouTube Video ID</label>
                 <input
                   id={`youtubeId-${event.id}`}
                   type="text"
                   value={event.youtubeVideoId || ''}
                   onChange={(e) => onUpdate({ ...event, youtubeVideoId: e.target.value })}
                   className={inputBaseClasses}
                   placeholder="e.g. dQw4w9WgXcQ"
                 />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label htmlFor={`youtubeStart-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Start Time (secs)</label>
                   <input
                     id={`youtubeStart-${event.id}`}
                     type="number"
                     value={event.youtubeStartTime === undefined ? '' : event.youtubeStartTime}
                     onChange={(e) => onUpdate({ ...event, youtubeStartTime: e.target.value ? parseInt(e.target.value) : undefined })}
                     className={inputBaseClasses}
                     placeholder="Start (s)"
                   />
                 </div>
                 <div>
                   <label htmlFor={`youtubeEnd-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">End Time (secs)</label>
                   <input
                     id={`youtubeEnd-${event.id}`}
                     type="number"
                     value={event.youtubeEndTime === undefined ? '' : event.youtubeEndTime}
                     onChange={(e) => onUpdate({ ...event, youtubeEndTime: e.target.value ? parseInt(e.target.value) : undefined })}
                     className={inputBaseClasses}
                     placeholder="End (s)"
                   />
                 </div>
               </div>
               <div className="flex items-center space-x-4 pt-1">
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.autoplay}
                     onChange={(e) => onUpdate({ ...event, autoplay: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Autoplay</span>
                 </label>
                 <label className={checkboxLabelClasses}>
                   <input
                     type="checkbox"
                     checked={!!event.loop}
                     onChange={(e) => onUpdate({ ...event, loop: e.target.checked })}
                     className={checkboxInputClasses}
                   />
                   <span>Loop</span>
                 </label>
               </div>
             </div>
           );
    case InteractionType.QUIZ:
        return (
          <div className="space-y-3 mt-2">
            <div>
              <label htmlFor={`quizQuestion-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Question</label>
              <input
                id={`quizQuestion-${event.id}`}
                type="text"
                value={event.quizQuestion || event.question || ''}
                onChange={(e) => onUpdate({
                  ...event,
                  quizQuestion: e.target.value
                })}
                className={inputBaseClasses}
                placeholder="Enter quiz question..."
              />
            </div>
            <div className="space-y-2 mt-1">
              <label className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Options (select correct answer)</label>
              {(event.quizOptions || []).map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`quizCorrectAnswer-${event.id}`}
                    id={`quizOptionCorrect-${event.id}-${idx}`}
                    checked={event.quizCorrectAnswer === idx}
                    onChange={() => onUpdate({ ...event, quizCorrectAnswer: idx })}
                    className="form-radio h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 focus:ring-purple-500 shrink-0 dark:bg-slate-700 dark:border-slate-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(event.quizOptions || [])];
                      newOptions[idx] = e.target.value;
                      onUpdate({ ...event, quizOptions: newOptions });
                    }}
                    className={`${inputBaseClasses} grow`}
                    placeholder={`Option ${idx + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newOptions = [...(event.quizOptions || [])];
                      newOptions.splice(idx, 1);
                      let newCorrectAnswer = event.quizCorrectAnswer;
                      if (newCorrectAnswer === idx) {
                        newCorrectAnswer = undefined;
                      } else if (newCorrectAnswer && newCorrectAnswer > idx) {
                        newCorrectAnswer -= 1;
                      }
                      onUpdate({ ...event, quizOptions: newOptions, quizCorrectAnswer: newCorrectAnswer });
                    }}
                    className="p-1.5 text-red-500 hover:text-red-400 dark:text-red-600 dark:hover:text-red-500 shrink-0 rounded-md hover:bg-slate-700 dark:hover:bg-slate-800"
                    aria-label="Delete option"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newOptions = [...(event.quizOptions || []), 'New Option'];
                  onUpdate({ ...event, quizOptions: newOptions });
                }}
                className="text-sm text-purple-400 hover:text-purple-300 dark:text-purple-500 dark:hover:text-purple-400 mt-1 font-medium"
              >
                + Add Option
              </button>
            </div>
            <div className="mt-1">
              <label htmlFor={`quizTarget-${event.id}`} className="block text-xs font-medium text-slate-300 dark:text-slate-400 mb-1">Target Hotspot (on correct)</label>
              <select
                id={`quizTarget-${event.id}`}
                value={event.targetHotspotId || ''}
                onChange={(e) => onUpdate({ ...event, targetHotspotId: e.target.value || undefined })}
                className={inputBaseClasses}
              >
                <option value="">None</option>
                {allHotspots.filter(h => h.id !== event.targetId).map(h => (
                  <option key={h.id} value={h.id}>{h.title || `Hotspot ${h.id.substring(0,4)}`}</option>
                ))}
              </select>
            </div>
          </div>
        );
      default:
        return (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Configuration for this event type is not yet available.
          </p>
        );
    }
  };

  const cardBaseClasses = `p-3 mb-2 rounded-lg shadow transition-opacity dark:shadow-md`;
  const cardBgColor = isDragging ? 'bg-slate-700 dark:bg-slate-800' : 'bg-slate-600 dark:bg-slate-700/50';
  const cardActiveColor = isActive ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-800 dark:ring-purple-600 dark:ring-offset-slate-900' : '';

  return (
    <div
      ref={cardRef}
      style={{ opacity: isDragging ? 0.4 : 1 }} // More pronounced opacity change
      data-handler-id={handlerId}
      className={`${cardBaseClasses} ${cardBgColor} ${cardActiveColor} ${className}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center flex-grow min-w-0">
          <div ref={dragHandleRef} className="cursor-grab active:cursor-grabbing touch-manipulation p-1 -ml-1"> {/* Added touch-manipulation and padding for better touch */}
            <DragHandle
              className="text-slate-400 dark:text-slate-500" // Ensure DragHandle itself has a base color
              isDragging={isDragging}
            />
          </div>
          <div className="flex-grow min-w-0 ml-1"> {/* Adjusted margin */}
            <div className="flex items-center mb-0.5">
              <EventTypeToggle type={event.type} />
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => {
                    setIsEditingTitle(false);
                    onUpdate({ ...event, name: title });
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { setIsEditingTitle(false); onUpdate({ ...event, name: title });}}}
                  autoFocus
                  className="ml-2 p-1 bg-slate-700 border border-slate-500 rounded-md text-white text-sm font-semibold flex-grow min-w-0 dark:bg-slate-800 dark:border-slate-600"
                />
              ) : (
                <button
                  onClick={() => onJumpToStep && onJumpToStep(event.step)}
                  className="ml-2 text-sm font-semibold text-left text-white dark:text-slate-200 truncate hover:text-purple-300 dark:hover:text-purple-400 transition-colors"
                  title={event.name}
                >
                  {event.name || `Event at step ${event.step}`}
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-0"> {/* Removed margin from step */}
              Step: {event.step}{event.duration ? `, Duration: ${event.duration/1000}s` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-0.5 flex-shrink-0 ml-1"> {/* Reduced space */}
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePreview(); }}
            className="p-1.5 text-slate-400 hover:text-purple-400 rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-purple-500 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle Preview"
          >
            {isPreviewing ? ( <EyeSlashIcon className="w-5 h-5" /> ) : ( <EyeIcon className="w-5 h-5" /> )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Unified handling for event types that have a dedicated settings modal
              if (
                event.type === InteractionType.PLAY_AUDIO ||
                event.type === InteractionType.PLAY_VIDEO ||
                event.type === InteractionType.SPOTLIGHT ||
                event.type === InteractionType.HIGHLIGHT_HOTSPOT
              ) {
                onEdit();
              } else {
                // Fallback to title editing for other types
                setIsEditingTitle(!isEditingTitle);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            aria-label={
              event.type === InteractionType.PLAY_AUDIO ||
              event.type === InteractionType.PLAY_VIDEO ||
              event.type === InteractionType.SPOTLIGHT ||
              event.type === InteractionType.HIGHLIGHT_HOTSPOT
                ? 'Edit Event Settings'
                : 'Edit Title'
            }
          >
            {event.type === InteractionType.PLAY_AUDIO ||
            event.type === InteractionType.PLAY_VIDEO ||
            event.type === InteractionType.SPOTLIGHT ||
            event.type === InteractionType.HIGHLIGHT_HOTSPOT ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            ) : (
              <PencilIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(event.id); }}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-700 dark:text-slate-500 dark:hover:text-red-600 dark:hover:bg-slate-800 transition-colors"
            aria-label="Delete Event"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isEditingTitle ? null : renderSettings()}
    </div>
  );
};

export default EditableEventCard;