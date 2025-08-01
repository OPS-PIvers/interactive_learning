import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Project } from '../../shared/types';
import QRCode from 'qrcode';
import { firebaseAPI } from '../../lib/firebaseApi';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { useLayoutConstraints } from '../hooks/useLayoutConstraints';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

interface ShareOptions {
  theme: 'light' | 'dark';
  showBranding: boolean;
  autoStart: boolean;
  width: string;
  height: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, project }) => {
  const [shareOptions, setShareOptions] = useState<ShareOptions>({
    theme: 'dark',
    showBranding: true,
    autoStart: false,
    width: '800',
    height: '600'
  });
  const [activeTab, setActiveTab] = useState<'url' | 'embed'>('url');
  const [copySuccess, setCopySuccess] = useState<string>('');
  const [isPublished, setIsPublished] = useState(project.isPublished || false);
  const [isToggling, setIsToggling] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const urlInputRef = useRef<HTMLInputElement>(null);
  const embedInputRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const { isMobile } = useDeviceDetection();
  const { constraints } = useLayoutConstraints({ preventToolbarOverlap: true });
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle body scroll lock and focus management
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      document.body.classList.add('modal-open');
      modalRef.current?.focus();
      return () => {
        document.body.classList.remove('modal-open');
        previouslyFocusedElement.current?.focus();
      };
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const handlePublishToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isToggling) return; // Prevent multiple concurrent requests
    
    const newPublishedStatus = e.target.checked;
    setIsToggling(true);
    
    try {
      await firebaseAPI.updateProjectPublishedStatus(project.id, newPublishedStatus);
      setIsPublished(newPublishedStatus);
      setCopySuccess(`Module is now ${newPublishedStatus ? 'published' : 'private'}`);
    } catch (error) {
      console.error('Failed to update published status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide specific error messages based on error type
      if (errorMessage.includes('permission')) {
        setCopySuccess('Permission denied: You cannot modify this project');
      } else if (errorMessage.includes('not found')) {
        setCopySuccess('Project not found');
      } else if (errorMessage.includes('authenticated')) {
        setCopySuccess('Authentication required');
      } else {
        setCopySuccess('Failed to update status');
      }
      
      // Don't change the checkbox state - let it reflect the current state
    } finally {
      setIsToggling(false);
    }
  };

  // Generate the shareable URL
  const generateShareUrl = useCallback(() => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    
    if (shareOptions.theme !== 'dark') {
      params.append('theme', shareOptions.theme);
    }
    if (!shareOptions.showBranding) {
      params.append('branding', 'false');
    }
    if (shareOptions.autoStart) {
      params.append('autostart', 'true');
    }
    
    const queryString = params.toString();
    return `${baseUrl}/shared/${project.id}${queryString ? `?${queryString}` : ''}`;
  }, [project.id, shareOptions]);

  // Generate embed code
  const generateEmbedCode = useCallback(() => {
    const shareUrl = generateShareUrl();
    const embedParams = new URLSearchParams(new URL(shareUrl).search);
    embedParams.append('embed', 'true');
    
    const embedUrl = `${window.location.origin}/shared/${project.id}?${embedParams.toString()}`;
    
    return `<iframe 
  src="${embedUrl}"
  width="${shareOptions.width}"
  height="${shareOptions.height}"
  frameborder="0"
  allowfullscreen
  title="${project.title} - Interactive Learning Module"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
</iframe>`;
  }, [generateShareUrl, project.id, project.title, shareOptions]);

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    try {
      const shareUrl = generateShareUrl();
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937', // slate-800
          light: '#ffffff'
        }
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }, [generateShareUrl]);

  // Update QR code when share options change
  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, shareOptions, generateQRCode]);

  // Copy to clipboard with feedback
  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(`${type} copied to clipboard!`);
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  }, []);

  // Select all text when input is focused
  const handleInputFocus = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.target.select();
  }, []);

  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => setCopySuccess(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  if (!isOpen) return null;

  const shareUrl = generateShareUrl();
  const embedCode = generateEmbedCode();

  // Unified modal sizing for consistent behavior across all screen sizes
  const getModalStyle = () => {
    const toolbarHeight = constraints.toolbarHeight; // Always account for toolbar
    const baseHeight = isMobile ? '70vh' : '75vh'; // Reduced heights to prevent toolbar overlap
    
    const height = `calc(${baseHeight} - ${toolbarHeight}px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))`;
    
    return {
      height,
      maxHeight: height
    };
  };

  if (isMobile) {
    return (
        <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex flex-col justify-end z-50" 
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-modal-title"
      >
        <div 
          ref={modalRef}
          tabIndex={-1}
          className="bg-slate-800 rounded-t-2xl shadow-xl w-full overflow-y-auto"
          style={getModalStyle()} 
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto"></div>
            <h2 id="mobile-modal-title" className="text-xl font-semibold text-white text-center mt-3">Share Project</h2>
            <p className="text-slate-400 text-sm text-center truncate">{project.title}</p>
          </div>

           {/* Mobile Content */}
           <div className="p-4 space-y-4">
            {/* Share URL */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Shareable URL</label>
              <div className="flex">
                <input
                  ref={urlInputRef}
                  type="text"
                  value={shareUrl}
                  onFocus={handleInputFocus}
                  readOnly
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-l-md px-3 py-2 text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(shareUrl, 'URL')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md transition-colors text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="border-t border-slate-700 pt-4">
              <label htmlFor="publish-toggle-mobile" className={`flex items-center justify-between ${isToggling ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <span className="font-medium text-white">Publish Module</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="publish-toggle-mobile"
                    className="sr-only"
                    checked={isPublished}
                    onChange={handlePublishToggle}
                    disabled={isToggling}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${isToggling ? 'bg-slate-500 opacity-50' : isPublished ? 'bg-purple-600' : 'bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all ${isToggling ? 'opacity-50' : isPublished ? 'transform translate-x-6' : ''}`}></div>
                </div>
              </label>
            </div>

            {/* Collapsible Options */}
            {isPublished && (
              <div className="space-y-4 pt-2">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                  <select
                    value={shareOptions.theme}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                    className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                {/* Auto Start */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareOptions.autoStart}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, autoStart: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-600 text-purple-600 shadow-sm focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-slate-300">Auto-start interaction</span>
                </label>
                {/* Show Branding */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareOptions.showBranding}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, showBranding: e.target.checked }))}
                    className="h-5 w-5 rounded border-slate-600 text-purple-600 shadow-sm focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-slate-300">Show branding</span>
                </label>
              </div>
            )}
            {/* Success Message */}
            {copySuccess && (
              <div className="mt-4 p-3 bg-green-800/50 border border-green-600 rounded-md text-center">
                <span className="text-green-300 text-sm">{copySuccess}</span>
              </div>
            )}
          </div>
          {/* Close Button */}
          <div className="p-4 border-t border-slate-700">
              <button
                onClick={onClose}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 rounded-md transition-colors font-semibold"
              >
                Done
              </button>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-modal-title"
    >
      <div 
        ref={!isMobile ? modalRef : undefined}
        tabIndex={-1}
        className="bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full overflow-hidden"
        style={getModalStyle()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 id="desktop-modal-title" className="text-xl font-semibold text-white">Share Project</h2>
            <p className="text-slate-400 text-sm mt-1">{project.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left Panel - Options */}
          <div className="lg:w-1/3 p-6 border-b lg:border-b-0 lg:border-r border-slate-700">
            <h3 className="text-lg font-medium text-white mb-4">Customization</h3>
            
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                <select
                  value={shareOptions.theme}
                  onChange={(e) => setShareOptions(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              {/* Auto Start */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareOptions.autoStart}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, autoStart: e.target.checked }))}
                    className="rounded border-slate-600 text-purple-600 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-slate-300">Auto-start interaction</span>
                </label>
              </div>

              {/* Show Branding */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={shareOptions.showBranding}
                    onChange={(e) => setShareOptions(prev => ({ ...prev, showBranding: e.target.checked }))}
                    className="rounded border-slate-600 text-purple-600 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-slate-300">Show branding</span>
                </label>
              </div>

              {/* Embed Dimensions */}
              {activeTab === 'embed' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Width (px)</label>
                    <input
                      type="text"
                      value={shareOptions.width}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, width: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                      placeholder="800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Height (px)</label>
                    <input
                      type="text"
                      value={shareOptions.height}
                      onChange={(e) => setShareOptions(prev => ({ ...prev, height: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                      placeholder="600"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Panel - Share Options */}
          <div className="lg:w-2/3 p-6">
            {/* Publish Toggle */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Publish Module</h3>
              <label htmlFor="publish-toggle-desktop" className={`flex items-center ${isToggling ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="publish-toggle-desktop"
                    className="sr-only"
                    checked={isPublished}
                    onChange={handlePublishToggle}
                    disabled={isToggling}
                  />
                  <div className={`block w-14 h-8 rounded-full transition-colors ${isToggling ? 'bg-slate-500 opacity-50' : isPublished ? 'bg-purple-600' : 'bg-slate-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all ${isToggling ? 'opacity-50' : isPublished ? 'transform translate-x-6' : ''}`}></div>
                </div>
                <div className="ml-3 text-slate-300 text-sm font-medium">
                  {isToggling ? 'Updating...' : isPublished ? 'Published' : 'Private'}
                </div>
              </label>
            </div>

            {isPublished && (
              <>
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-700 mb-6">
                  <button
                    onClick={() => setActiveTab('url')}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'url'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Direct Link
              </button>
              <button
                onClick={() => setActiveTab('embed')}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'embed'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                Embed Code
              </button>
            </div>

            {/* Content */}
            {activeTab === 'url' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Shareable URL
                  </label>
                  <div className="flex">
                    <input
                      ref={urlInputRef}
                      type="text"
                      value={shareUrl}
                      onFocus={handleInputFocus}
                      readOnly
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-l-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={() => copyToClipboard(shareUrl, 'URL')}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Preview */}
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">Preview</h4>
                    <div className="bg-slate-800 rounded-md p-3 text-sm text-slate-300">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-slate-500 text-xs ml-2 truncate">{shareUrl}</span>
                      </div>
                      <div className="border-t border-slate-600 pt-2">
                        <div className="text-purple-400 font-medium">{project.title}</div>
                        <div className="text-slate-400 text-xs">{project.description || 'Interactive Learning Module'}</div>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-slate-700 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-2">QR Code</h4>
                    <div className="flex flex-col items-center">
                      {qrCodeDataUrl ? (
                        <>
                          <img 
                            src={qrCodeDataUrl} 
                            alt="QR Code for sharing" 
                            className="rounded-lg border border-slate-600"
                          />
                          <p className="text-slate-400 text-xs mt-2 text-center">
                            Scan with mobile device to open
                          </p>
                        </>
                      ) : (
                        <div className="w-48 h-48 bg-slate-800 rounded-lg flex items-center justify-center">
                          <div className="text-slate-400 text-sm">Generating QR code...</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Embed Code
                  </label>
                  <div className="relative">
                    <textarea
                      ref={embedInputRef}
                      value={embedCode}
                      onFocus={handleInputFocus}
                      readOnly
                      rows={8}
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-purple-500 focus:border-purple-500 text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(embedCode, 'Embed code')}
                      className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Usage Instructions</h4>
                  <div className="text-sm text-slate-300 space-y-2">
                    <p>• Copy the embed code above and paste it into your website's HTML</p>
                    <p>• The iframe will be responsive within the specified dimensions</p>
                    <p>• Users can interact with the module directly within the embed</p>
                    <p>• Customize dimensions and options using the controls on the left</p>
                  </div>
                </div>
              </div>
            )}
              </>
            )}

            {/* Success Message */}
            {copySuccess && (
              <div className="mt-4 p-3 bg-green-800/50 border border-green-600 rounded-md">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-300 text-sm">{copySuccess}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-750">
          <div className="flex justify-end items-center">
            <button
              onClick={onClose}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;