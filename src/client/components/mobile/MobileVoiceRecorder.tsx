import React, { useState, useRef, useCallback } from 'react';
import { recordVoice } from '../../utils/mobileMediaCapture';

interface MobileVoiceRecorderProps {
  onRecord: (file: File) => void;
}

const MobileVoiceRecorder: React.FC<MobileVoiceRecorderProps> = ({ onRecord }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => prevTime + 1);
    }, 1000);
    // In a real implementation, we would use the MediaRecorder API here.
    // For now, we are using the placeholder from mobileMediaCapture.
    recordVoice().then((file) => {
      if (file) {
        setRecordedAudio(file);
      }
    });
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setRecordingTime(0);
  }, []);

  const handleSave = useCallback(() => {
    if (recordedAudio) {
      onRecord(recordedAudio);
    }
    setRecordedAudio(null);
  }, [recordedAudio, onRecord]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = (time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-lg font-semibold mb-4">
        {isRecording ? `Recording... ${formatTime(recordingTime)}` : 'Ready to Record'}
      </div>
      <div className="flex items-center space-x-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-6 py-3 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-6 py-3 bg-gray-500 text-white rounded-full shadow-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Stop
          </button>
        )}
        {recordedAudio && !isRecording && (
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
        )}
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Note: Voice recording is not fully implemented yet.
      </p>
    </div>
  );
};

export default MobileVoiceRecorder;
