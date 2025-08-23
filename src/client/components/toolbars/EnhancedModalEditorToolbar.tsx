import React, { useState } from 'react';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import { Icon } from '../Icon';
import AppearanceSection from './sections/AppearanceSection';
import ControlsSection from './sections/ControlsSection';
import EditingToolsSection from './sections/EditingToolsSection';
import FileOperationsSection from './sections/FileOperationsSection';
import PreviewSection from './sections/PreviewSection';
import ViewOptionsSection from './sections/ViewOptionsSection';

interface EnhancedModalEditorToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onBack: () => void;
  onLivePreview: () => void;
  onReplaceImage: (file: File) => void;
  isAutoProgression: boolean;
  onToggleAutoProgression: (enabled: boolean) => void;
  autoProgressionDuration: number;
  onAutoProgressionDurationChange: (duration: number) => void;
  currentZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomReset?: () => void;
  onCenter?: () => void;
  currentColorScheme: string;
  onColorSchemeChange: (schemeName: string) => void;
  viewerModes: {
    explore?: boolean;
    selfPaced?: boolean;
    timed?: boolean;
  };
  onViewerModeChange: (mode: 'explore' | 'selfPaced' | 'timed', enabled: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
  showSuccessMessage: boolean;
  backgroundImage?: string;
  backgroundType?: 'image' | 'video';
  backgroundVideoType?: 'youtube' | 'mp4' | undefined;
  onBackgroundImageChange: (url: string) => void;
  onBackgroundTypeChange: (type: 'image' | 'video') => void;
  onBackgroundVideoTypeChange: (type: 'youtube' | 'mp4') => void;
}

const EnhancedModalEditorToolbar: React.FC<EnhancedModalEditorToolbarProps> = (props) => {
  const [activeTab, setActiveTab] = useState('general');

  if (!props.isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/50 ${Z_INDEX_TAILWIND.MODAL_BACKDROP} flex items-center justify-center p-4`}
      onClick={props.onClose}
    >
      <div
        className={`bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-2xl max-w-4xl w-full flex flex-col overflow-hidden max-h-[calc(100vh-2rem)] overflow-y-auto ${Z_INDEX_TAILWIND.MODAL_CONTENT}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-700">
          <FileOperationsSection
            projectName={props.projectName}
            onBack={props.onBack}
            onLivePreview={props.onLivePreview}
          />
          <button
            onClick={props.onClose}
            className="text-slate-300 hover:text-white transition-colors min-w-[44px] min-h-[44px] p-2 rounded-lg hover:bg-slate-700 flex items-center justify-center"
            aria-label="Close editor settings modal"
          >
            <Icon name="XMark" className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-700">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 overflow-x-auto scrollbar-hide" aria-label="Editor settings tabs" role="tablist">
            {[
              { id: 'general', name: 'General' },
              { id: 'appearance', name: 'Appearance' },
              { id: 'controls', name: 'Controls' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1 md:gap-2 py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-base transition-colors min-w-[44px] min-h-[44px] whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-300 hover:text-white'
                }`}
                aria-selected={activeTab === tab.id}
                role="tab"
                aria-controls={`${tab.id}-panel`}
              >
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <EditingToolsSection
                backgroundImage={props.backgroundImage || ''}
                backgroundType={props.backgroundType || 'image'}
                backgroundVideoType={props.backgroundVideoType || 'mp4'}
                onBackgroundImageChange={props.onBackgroundImageChange}
                onBackgroundTypeChange={props.onBackgroundTypeChange}
                onBackgroundVideoTypeChange={props.onBackgroundVideoTypeChange}
                onReplaceImage={props.onReplaceImage}
              />
              <ViewOptionsSection
                isAutoProgression={props.isAutoProgression}
                onToggleAutoProgression={props.onToggleAutoProgression}
                autoProgressionDuration={props.autoProgressionDuration}
                onAutoProgressionDurationChange={props.onAutoProgressionDurationChange}
                viewerModes={props.viewerModes}
                onViewerModeChange={props.onViewerModeChange}
              />
            </div>
          )}

          {activeTab === 'appearance' && (
            <AppearanceSection
              currentColorScheme={props.currentColorScheme}
              onColorSchemeChange={props.onColorSchemeChange}
            />
          )}

          {activeTab === 'controls' && (
            <ControlsSection
              currentZoom={props.currentZoom || 1}
              onZoomIn={props.onZoomIn || (() => {})}
              onZoomOut={props.onZoomOut || (() => {})}
              onZoomReset={props.onZoomReset || (() => {})}
              onCenter={props.onCenter || (() => {})}
            />
          )}
        </div>

        <div className="flex items-center justify-between p-6">
          <button
            onClick={props.onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
          <PreviewSection
            onSave={props.onSave}
            isSaving={props.isSaving}
            showSuccessMessage={props.showSuccessMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedModalEditorToolbar;
