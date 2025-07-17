import React, { useState, useRef, useCallback, useEffect } from 'react';
import { recordVoice } from '../../utils/mobileMediaCapture';

interface MobileVoiceRecorderProps {
  onRecord: (file: File) => void;
}

// Define the type for the recording controls
interface RecordingControls {
  start: () => void;
  stop: () => Promise<File>;
  cancel: () => void;
}


const MobileVoiceRecorder: React.FC<MobileVoiceRecorderProps> = ({ onRecord }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recorderControlsRef = useRef<RecordingControls | null>(null);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderControlsRef.current) {
      recorderControlsRef.current.cancel();
      recorderControlsRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const startRecording = useCallback(async () => {
    // Reset previous recording state
    setRecordedAudio(null);
    setIsPreparing(true);
    try {
      const controls = await recordVoice();
      recorderControlsRef.current = controls;
      controls.start();
      setIsRecording(true);
      setIsPreparing(false);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not start recording. Please ensure you have granted microphone permissions in your browser settings and try again.';
      alert(errorMessage);
      setIsPreparing(false);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (recorderControlsRef.current) {
      const audioFile = await recorderControlsRef.current.stop();
      setRecordedAudio(audioFile);
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  const handleSave = useCallback(() => {
    if (recordedAudio) {
      onRecord(recordedAudio);
    }
    setRecordedAudio(null);
    setRecordingTime(0);
  }, [recordedAudio, onRecord]);

  const handleDiscard = () => {
    setRecordedAudio(null);
    setRecordingTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const renderButtonState = () => {
    if (isPreparing) {
      return (
        <button
          disabled
          className="px-6 py-3 bg-gray-500 text-white rounded-full shadow-md"
          aria-label="Preparing to record"
          aria-describedby="recording-status"
        >
          Preparing...
        </button>
      );
    }

    if (isRecording) {
      return (
        <button
          onClick={stopRecording}
          className="px-6 py-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          aria-label={`Stop recording, current time: ${formatTime(recordingTime)}`}
          aria-describedby="recording-status"
        >
          Stop
        </button>
      );
    }

    if (recordedAudio) {
      return (
        <div className="flex items-center space-x-4">
          <button
            onClick={handleDiscard}
            className="px-6 py-3 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            aria-label={`Discard recording of ${formatTime(recordingTime)}`}
            aria-describedby="recording-status"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label={`Save recording of ${formatTime(recordingTime)}`}
            aria-describedby="recording-status"
          >
            Save
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={startRecording}
        className="px-6 py-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        aria-label="Start recording audio"
        aria-describedby="recording-status"
      >
        Start Recording
      </button>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div 
        id="recording-status"
        className="text-lg font-semibold mb-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {isRecording
          ? `Recording... ${formatTime(recordingTime)}`
          : recordedAudio
          ? `Recorded: ${formatTime(recordingTime)}`
          : 'Ready to Record'}
      </div>
      <div className="flex items-center space-x-4">
        {renderButtonState()}
      </div>
    </div>
  );
};

export default MobileVoiceRecorder;
