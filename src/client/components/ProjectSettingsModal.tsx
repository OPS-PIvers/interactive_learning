import React, { useState, useCallback, useRef, useEffect } from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { useIsMobile } from '../hooks/useIsMobile';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId: string;
}

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  preview: {
    gradient: string;
    text: string;
  };
}

const themePresets: ThemeOption[] = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Clean and modern design for business presentations',
    colors: {
      primary: '#3B82F6', // blue-500
      secondary: '#6366F1', // indigo-500  
      accent: '#8B5CF6', // violet-500
      background: '#1E293B' // slate-800
    },
    preview: {
      gradient: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      text: 'text-blue-100'
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    description: 'Bold colors that grab attention and energize viewers',
    colors: {
      primary: '#EF4444', // red-500
      secondary: '#F59E0B', // amber-500
      accent: '#10B981', // emerald-500
      background: '#7C2D12' // red-900
    },
    preview: {
      gradient: 'bg-gradient-to-r from-red-500 to-amber-500',
      text: 'text-red-100'
    }
  },
  {
    id: 'earth',
    name: 'Natural',
    description: 'Earthy tones for organic and calming presentations',
    colors: {
      primary: '#059669', // emerald-600
      secondary: '#92400E', // amber-800
      accent: '#1E40AF', // blue-800
      background: '#0F172A' // slate-900
    },
    preview: {
      gradient: 'bg-gradient-to-r from-emerald-600 to-amber-700',
      text: 'text-emerald-100'
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'High contrast dark theme for modern presentations',
    colors: {
      primary: '#6B7280', // gray-500
      secondary: '#374151', // gray-700
      accent: '#9CA3AF', // gray-400
      background: '#111827' // gray-900
    },
    preview: {
      gradient: 'bg-gradient-to-r from-gray-600 to-gray-800',
      text: 'text-gray-100'
    }
  }
];

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  projectName,
  projectId
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'export'>('general');
  const [selectedTheme, setSelectedTheme] = useState<string>('professional');
  const [projectTitle, setProjectTitle] = useState(projectName);
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  const handleSaveSettings = useCallback(() => {
    // TODO: Implement settings save functionality
    console.log('Saving project settings:', {
      projectId,
      title: projectTitle,
      theme: selectedTheme
    });
    onClose();
  }, [projectId, projectTitle, selectedTheme, onClose]);

  if (!isOpen) return null;

  const currentTheme = themePresets.find(t => t.id === selectedTheme) || themePresets[0];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black bg-opacity-75">
      <div
        ref={modalRef}
        className={`bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
          isMobile ? 'w-full h-full max-h-full' : 'max-w-3xl w-full max-h-[80vh]'
        }`}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Project Settings</h2>
            <p className="text-slate-400 text-sm mt-1">Configure your project preferences</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <nav className="flex px-6">
            {[
              { id: 'general', label: 'General', icon: '⚙️' },
              { id: 'theme', label: 'Theme', icon: '🎨' },
              { id: 'export', label: 'Export', icon: '📤' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-purple-400'
                    : 'text-slate-400 hover:text-white border-transparent hover:border-slate-600'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '400px' }}>
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter project title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project ID
                </label>
                <input
                  type="text"
                  value={projectId}
                  disabled
                  className="w-full p-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
                <p className="text-xs text-slate-500 mt-1">Project ID cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Describe your project..."
                />
              </div>
            </div>
          )}

          {/* Theme Tab */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Choose a Theme</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {themePresets.map((theme) => (
                    <div
                      key={theme.id}
                      className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedTheme === theme.id
                          ? 'border-purple-400 bg-purple-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      {/* Theme Preview */}
                      <div className={`h-16 rounded-lg mb-3 ${theme.preview.gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={`text-sm font-medium ${theme.preview.text}`}>
                            Preview
                          </div>
                        </div>
                        <div className="absolute top-2 left-2">
                          <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                        </div>
                        <div className="absolute top-2 right-2">
                          <div className="w-6 h-2 bg-white/30 rounded"></div>
                        </div>
                      </div>

                      {/* Theme Info */}
                      <div>
                        <h4 className="font-medium text-white mb-1">{theme.name}</h4>
                        <p className="text-xs text-slate-400">{theme.description}</p>
                      </div>

                      {/* Selection Indicator */}
                      {selectedTheme === theme.id && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Customization */}
              <div className="border-t border-slate-700 pt-6">
                <h4 className="font-medium text-white mb-3">Current Theme: {currentTheme.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(currentTheme.colors).map(([key, color]) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-full h-12 rounded-lg border border-slate-600 mb-2"
                        style={{ backgroundColor: color }}
                      ></div>
                      <p className="text-xs text-slate-400 capitalize">{key}</p>
                      <p className="text-xs text-slate-500 font-mono">{color}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Export Options</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                    <h4 className="font-medium text-white mb-2">📊 Export as Presentation</h4>
                    <p className="text-sm text-slate-400 mb-3">Export your slides as a standalone presentation file</p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
                      Download PDF
                    </button>
                  </div>

                  <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                    <h4 className="font-medium text-white mb-2">🌐 Export as Web Page</h4>
                    <p className="text-sm text-slate-400 mb-3">Generate a standalone HTML file with your interactive content</p>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                      Download HTML
                    </button>
                  </div>

                  <div className="p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                    <h4 className="font-medium text-white mb-2">📱 Export for Mobile</h4>
                    <p className="text-sm text-slate-400 mb-3">Optimize for mobile viewing and touch interactions</p>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors">
                      Generate Mobile Package
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;