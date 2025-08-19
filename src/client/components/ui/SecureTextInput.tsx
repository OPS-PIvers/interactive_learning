/**
 * Secure Text Input Component
 * 
 * Enhanced text input with XSS prevention and validation.
 * Part of Phase 2 security hardening implementation.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { validateTextInput, sanitizeUserContent } from '../../utils/inputSecurity';

interface SecureTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  autoSanitize?: boolean;
  showCharCount?: boolean;
  'data-testid'?: string;
}

export const SecureTextInput: React.FC<SecureTextInputProps> = ({
  value,
  onChange,
  placeholder = '',
  maxLength = 1000,
  className = '',
  disabled = false,
  required = false,
  autoSanitize = true,
  showCharCount = false,
  'data-testid': testId
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Memoized validation result
  const validation = useMemo(() => {
    return validateTextInput(value, maxLength);
  }, [value, maxLength]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    
    // Validate input
    const validation = validateTextInput(inputValue, maxLength);
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'Invalid input');
      return;
    }

    setValidationError(null);

    // Apply sanitization if enabled
    const finalValue = autoSanitize ? validation.sanitized : inputValue;
    onChange(finalValue);
  }, [maxLength, autoSanitize, onChange]);

  const hasError = !validation.isValid || validationError;
  const isAtLimit = value.length >= maxLength;

  return (
    <div className="secure-text-input">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          data-testid={testId}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm text-sm
            focus:outline-none focus:ring-2 focus:ring-offset-2
            ${hasError 
              ? 'border-red-300 focus:border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:border-indigo-300 focus:ring-indigo-500'
            }
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
            ${isAtLimit ? 'border-yellow-300' : ''}
            ${className}
          `}
        />
        
        {/* Character count indicator */}
        {showCharCount && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <span className={`text-xs ${isAtLimit ? 'text-yellow-600' : 'text-gray-400'}`}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>

      {/* Validation error display */}
      {hasError && (
        <div className="mt-1 text-sm text-red-600">
          {validationError || validation.error}
        </div>
      )}

      {/* Security indicator */}
      {autoSanitize && (
        <div className="mt-1 text-xs text-gray-500">
          <span className="inline-flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
            Input is automatically sanitized
          </span>
        </div>
      )}
    </div>
  );
};