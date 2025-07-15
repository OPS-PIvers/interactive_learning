import React from 'react';

export type MobileEditorActiveTab = 'properties' | 'timeline' | 'background';

interface MobileEditorTabsProps {
  activeTab: MobileEditorActiveTab;
  onTabChange: (tab: MobileEditorActiveTab) => void;
}

const MobileEditorTabs: React.FC<MobileEditorTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: MobileEditorActiveTab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'background', label: 'Background' },
  ];

  return (
    <div className="flex bg-slate-800 border-b border-slate-700">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 px-2 sm:px-4 text-center font-medium text-sm sm:text-base transition-colors focus:outline-none
            ${
              activeTab === tab.id
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
            }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default MobileEditorTabs;
