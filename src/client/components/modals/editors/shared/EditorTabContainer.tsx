import React, { useState, ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
}

interface EditorTabContainerProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  onTabChange?: (tabId: string) => void;
  className?: string;
  contentClassName?: string;
}

const EditorTabContainer: React.FC<EditorTabContainerProps> = ({
  tabs,
  defaultActiveTab,
  onTabChange,
  className = '',
  contentClassName = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id || '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              border-b-2 whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-purple-500 text-white'
                : 'border-transparent text-slate-300 hover:text-white'
              }
            `}
          >
            {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`flex-1 overflow-y-auto ${contentClassName}`}>
        {activeTabData && activeTabData.content}
      </div>
    </div>
  );
};

export default EditorTabContainer;
