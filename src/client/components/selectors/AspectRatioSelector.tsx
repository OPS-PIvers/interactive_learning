import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getCommonRatios, validateAspectRatio, formatCustomRatio, getAspectRatioDisplayName } from '../../utils/aspectRatioUtils';
import { Z_INDEX_TAILWIND } from '../../utils/zIndexLevels';
import ChevronDownIcon from '../icons/ChevronDownIcon';

interface AspectRatioSelectorProps {
  currentRatio: string;
  onRatioChange: (ratio: string) => void;
  // Responsive design uses CSS breakpoints
  disabled?: boolean;
}

/**
 * AspectRatioSelector - Professional aspect ratio selector for slides
 * 
 * Provides preset ratios (16:9, 4:3, 9:16, etc.) and custom ratio input.
 * Integrates with user's gradient aesthetic and maintains mobile responsiveness.
 */
const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({
  currentRatio,
  onRatioChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customRatioInput, setCustomRatioInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const commonRatios = getCommonRatios();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCustomInput(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setShowCustomInput(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setShowCustomInput(false);
    }
  }, [disabled, isOpen]);

  const handleRatioSelect = useCallback((ratio: string) => {
    onRatioChange(ratio);
    setIsOpen(false);
    setShowCustomInput(false);
  }, [onRatioChange]);

  const handleCustomRatioSubmit = useCallback(() => {
    const input = customRatioInput.trim();
    if (!input) return;

    // Try to parse as width:height format
    if (input.includes(':')) {
      if (validateAspectRatio(input)) {
        handleRatioSelect(input);
        setCustomRatioInput('');
        return;
      }
    }

    // Try to parse as decimal
    const decimal = parseFloat(input);
    if (!isNaN(decimal) && decimal > 0 && decimal <= 10) {
      const customRatio = formatCustomRatio(decimal);
      handleRatioSelect(customRatio);
      setCustomRatioInput('');
      return;
    }

    // Invalid input - show brief error indication
    setCustomRatioInput('');
  }, [customRatioInput, handleRatioSelect]);

  const handleCustomInputKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCustomRatioSubmit();
    } else if (event.key === 'Escape') {
      setShowCustomInput(false);
      setCustomRatioInput('');
    }
  }, [handleCustomRatioSubmit]);

  const displayName = getAspectRatioDisplayName(currentRatio);
  const isCustomRatio = currentRatio.startsWith('custom:') || !commonRatios.some(r => r.value === currentRatio);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-purple-500 ${
          disabled
            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
            : isOpen
            ? 'bg-slate-600 text-white'
            : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
        } px-2 py-1 sm:px-3 sm:py-2`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select aspect ratio"
      >
        <span className="text-xs sm:text-sm">
          <span className="sm:hidden">{currentRatio.split(' ')[0]}</span>
          <span className="hidden sm:inline">{displayName}</span>
        </span>
        <ChevronDownIcon 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div
          className={`origin-top-right absolute ${Z_INDEX_TAILWIND.DROPDOWNS} mt-2 w-64 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none ${
'right-0 w-56 sm:left-0 sm:w-auto sm:right-auto'
          }`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="aspect-ratio-button"
        >
          <div className="py-1" role="none">
            {/* Header */}
            <div className="px-4 py-2 border-b border-slate-700">
              <div className="text-xs font-medium text-slate-300">Aspect Ratio</div>
            </div>

            {/* Common Ratios */}
            {commonRatios.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => handleRatioSelect(ratio.value)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors duration-150 focus:outline-none focus:bg-slate-700 hover:bg-slate-700 ${
                  currentRatio === ratio.value
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border-l-2 border-purple-500'
                    : 'text-slate-300 hover:text-white'
                }`}
                role="menuitem"
                tabIndex={0}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{ratio.label}</div>
                    <div className="text-xs text-slate-400">{ratio.description}</div>
                  </div>
                  {currentRatio === ratio.value && (
                    <div className="text-purple-400">
                      ✓
                    </div>
                  )}
                </div>
              </button>
            ))}

            {/* Custom Ratio Section */}
            <div className="border-t border-slate-700">
              {!showCustomInput ? (
                <button
                  onClick={() => {
                    setShowCustomInput(true);
                    setCustomRatioInput('');
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 focus:outline-none focus:bg-slate-700"
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span>✏️</span>
                    <div>
                      <div className="font-medium">Custom Ratio</div>
                      <div className="text-xs text-slate-400">Enter width:height or decimal</div>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="px-4 py-3">
                  <div className="text-xs font-medium text-slate-300 mb-2">Custom Aspect Ratio</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={customRatioInput}
                      onChange={(e) => setCustomRatioInput(e.target.value)}
                      onKeyDown={handleCustomInputKeyDown}
                      className="flex-1 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="16:9 or 1.78"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomRatioSubmit}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
                    >
                      Set
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Examples: 16:9, 4:3, 1.78, 0.75
                  </div>
                </div>
              )}

              {/* Show custom ratio if currently selected */}
              {isCustomRatio && !showCustomInput && (
                <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-l-2 border-purple-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white text-sm">{displayName}</div>
                      <div className="text-xs text-slate-400">Current custom ratio</div>
                    </div>
                    <div className="text-purple-400">✓</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AspectRatioSelector;