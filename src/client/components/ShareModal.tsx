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

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 md:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-slate-800 rounded-t-2xl md:rounded-lg shadow-xl w-full md:max-w-4xl md:w-full overflow-y-auto md:overflow-hidden"
        style={getModalStyle()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700 md:p-6">
          <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto md:hidden"></div>
          <h2
            id="desktop-modal-title"
            className="text-xl font-semibold text-white text-center mt-3 md:text-left md:mt-0"
          >
            Share Project
          </h2>
          <p className="text-slate-400 text-sm text-center md:text-left truncate md:mt-1">
            {project.title}
          </p>
          <button
            onClick={onClose}
            className="hidden md:block absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Left Panel - Options (Desktop only) */}
          <div className="hidden md:block md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-slate-700">
            <h3 className="text-lg font-medium text-white mb-4">Customization</h3>
            <div className="space-y-4">
              {/* Theme, Auto Start, Show Branding, Embed Dimensions */}
            </div>
          </div>

          {/* Main Content */}
          <div className="md:w-2/3 p-4 md:p-6 space-y-4">
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
              <label
                htmlFor="publish-toggle"
                className={`flex items-center justify-between ${
                  isToggling ? 'cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span className="font-medium text-white">Publish Module</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    id="publish-toggle"
                    className="sr-only"
                    checked={isPublished}
                    onChange={handlePublishToggle}
                    disabled={isToggling}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors ${
                      isToggling ? 'bg-slate-500 opacity-50' : isPublished ? 'bg-purple-600' : 'bg-slate-600'
                    }`}
                  ></div>
                  <div
                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-all ${
                      isToggling ? 'opacity-50' : isPublished ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>

            {/* Collapsible Options */}
            {isPublished && (
              <div className="space-y-4 pt-2">
                {/* Theme, Auto Start, Show Branding for mobile */}
                <div className="md:hidden">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Theme</label>
                    <select
                      value={shareOptions.theme}
                      onChange={(e) =>
                        setShareOptions((prev) => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))
                      }
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
                      onChange={(e) => setShareOptions((prev) => ({ ...prev, autoStart: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-600 text-purple-600 shadow-sm focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-slate-300">Auto-start interaction</span>
                  </label>
                  {/* Show Branding */}
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={shareOptions.showBranding}
                      onChange={(e) =>
                        setShareOptions((prev) => ({ ...prev, showBranding: e.target.checked }))
                      }
                      className="h-5 w-5 rounded border-slate-600 text-purple-600 shadow-sm focus:ring-purple-500"
                    />
                    <span className="ml-2 text-sm text-slate-300">Show branding</span>
                  </label>
                </div>
                {/* Desktop right panel content */}
                <div className="hidden md:block">
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
                      {/* ... URL content from desktop version */}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* ... Embed content from desktop version */}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Success Message */}
            {copySuccess && (
              <div className="mt-4 p-3 bg-green-800/50 border border-green-600 rounded-md text-center">
                <span className="text-green-300 text-sm">{copySuccess}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 md:p-6 md:bg-slate-750">
          <div className="flex justify-end items-center">
            <button
              onClick={onClose}
              className="w-full md:w-auto bg-slate-600 hover:bg-slate-700 text-white px-4 py-3 md:py-2 rounded-md transition-colors font-semibold md:font-normal"
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