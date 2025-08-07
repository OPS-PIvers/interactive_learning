import { appScriptProxy } from '../../lib/firebaseProxy';
import { compressImage } from './imageCompression';

/**
 * Options for capturing media from the device.
 */
interface MediaCaptureOptions {
  /**
   * The source of the media capture.
   * 'camera' - Use the device's camera.
   * 'gallery' - Use the device's photo gallery.
   */
  source: 'camera' | 'gallery';
  /**
   * The type of media to accept.
   * 'image/*' - Any image file.
   * 'video/*' - Any video file.
   * 'audio/*' - Any audio file.
   */
  accept?: string;
}

/**
 * Opens the device's camera or gallery to capture an image.
 * @param options - The options for capturing media.
 * @returns A promise that resolves with the captured file, or null if no file was selected.
 */
export const captureMedia = async (options: MediaCaptureOptions): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = options.accept || 'image/*';

    if (options.source === 'camera') {
      input.capture = 'environment';
    }

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const compressedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          resolve(compressedFile);
        } catch (error) {
          console.error('Error compressing image:', error);
          // Resolve with the original file if compression fails
          resolve(file);
        }
      } else {
        resolve(null);
      }
    };

    input.click();
  });
};

interface RecordingControls {
  start: () => void;
  stop: () => Promise<File>;
  cancel: () => void;
}

export const recordVoice = async (): Promise<RecordingControls> => {
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (error) {
    console.error('Error accessing microphone:', error);
    throw new Error('Failed to access microphone. Please ensure you have granted microphone permissions in your browser settings.');
  }
  
  const mediaRecorder = new MediaRecorder(stream);
  let audioChunks: Blob[] = [];

  mediaRecorder.ondataavailable = (event) => {
    audioChunks.push(event.data);
  };

  const start = () => {
    audioChunks = [];
    mediaRecorder.start();
  };

  const stop = (): Promise<File> => {
    return new Promise((resolve) => {
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', {
          type: 'audio/wav',
        });
        // Stop all tracks on the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
        resolve(audioFile);
      };
      mediaRecorder.stop();
    });
  };

  const cancel = () => {
    mediaRecorder.stop();
    // Stop all tracks on the stream to release the microphone
    stream.getTracks().forEach((track) => track.stop());
  };

  return { start, stop, cancel };
};

/**
 * A placeholder for uploading a file with progress indication.
 * This will be implemented in a future task.
 * @param file - The file to upload.
 * @param onProgress - A callback function to report upload progress.
 */
export const uploadFileWithProgress = async (
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    const downloadUrl = await appScriptProxy.uploadFile(file, onProgress);
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading file with progress:', error);
    throw error;
  }
};
