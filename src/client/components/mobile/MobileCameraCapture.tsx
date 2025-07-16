import React, { useState, useCallback } from 'react';
import { captureMedia } from '../../utils/mobileMediaCapture';

interface MobileCameraCaptureProps {
  onCapture: (file: File) => void;
}

const MobileCameraCapture: React.FC<MobileCameraCaptureProps> = ({ onCapture }) => {
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleCaptureClick = useCallback(async () => {
    const file = await captureMedia({ source: 'camera', accept: 'image/*' });
    if (file) {
      setCapturedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleConfirmClick = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
      setCapturedImage(null);
      setPreviewUrl(null);
    }
  }, [capturedImage, onCapture]);

  const handleRetakeClick = useCallback(() => {
    setCapturedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    handleCaptureClick();
  }, [previewUrl, handleCaptureClick]);

  if (previewUrl && capturedImage) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-4">
        <img src={previewUrl} alt="Captured preview" className="max-w-full rounded-lg shadow-md" />
        <div className="flex justify-around w-full mt-4">
          <button
            onClick={handleRetakeClick}
            className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400"
          >
            Retake
          </button>
          <button
            onClick={handleConfirmClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Confirm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center p-4">
      <button
        onClick={handleCaptureClick}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Capture Image
      </button>
    </div>
  );
};

export default MobileCameraCapture;
