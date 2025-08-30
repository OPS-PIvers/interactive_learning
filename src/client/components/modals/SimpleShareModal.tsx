import React, { useState, useCallback } from 'react';
import { HotspotWalkthrough } from '../../../shared/hotspotTypes';
import ResponsiveModal from '../responsive/ResponsiveModal';

interface SimpleShareModalProps {
  walkthrough: HotspotWalkthrough;
  isOpen: boolean;
  onClose: () => void;
}

export default function SimpleShareModal({
  walkthrough,
  isOpen,
  onClose
}: SimpleShareModalProps) {
  
  const [copied, setCopied] = useState(false);
  
  const shareUrl = `${window.location.origin}/view/${walkthrough.id}`;
  
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);
  
  const generateQRCode = useCallback(() => {
    // Simple QR code generation using a service
    // In production, use a proper QR code library
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;
  }, [shareUrl]);
  
  const handleTwitterShare = () => {
    const text = `Check out this interactive walkthrough: ${walkthrough.title}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };
  
  return (
    <ResponsiveModal
      type="share"
      isOpen={isOpen}
      onClose={onClose}
      title="Share Walkthrough"
      size="small"
    >
      <div className="space-y-6">
        {/* Walkthrough Info */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {walkthrough.title}
          </h3>
          {walkthrough.description && (
            <p className="text-gray-600 mt-1">
              {walkthrough.description}
            </p>
          )}
        </div>
        
        {/* Share URL */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Share Link
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCopyUrl}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        {/* QR Code */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            QR Code
          </label>
          <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
            <img
              src={generateQRCode()}
              alt="QR Code"
              className="w-32 h-32"
              loading="lazy"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Scan with a phone camera to open the walkthrough
          </p>
        </div>
        
        {/* Sharing Options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleTwitterShare}
            className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            Twitter
          </button>
          
          <button
            onClick={handleLinkedInShare}
            className="flex items-center justify-center px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            LinkedIn
          </button>
        </div>
        
        {/* Close Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Done
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}