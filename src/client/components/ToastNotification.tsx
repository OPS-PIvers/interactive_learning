import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastNotificationProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Show toast after a small delay for animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss after duration
    const duration = toast.duration || 5000;
    const dismissTimer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.duration]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(toast.id);
    }, 300); // Match animation duration
  };

  const getToastStyles = () => {
    const baseStyles = 'flex items-start gap-3 p-4 rounded-lg shadow-lg backdrop-blur-sm border max-w-md';
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50/90 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50/90 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50/90 border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50/90 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50/90 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const toastElement = (
    <div
      className={`
        fixed top-4 right-4 z-[9999] transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}
        ${isLeaving ? 'scale-95' : 'scale-100'}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={getToastStyles()}>
        {getIcon()}
        <div className="flex-1">
          <div className="font-medium">{toast.title}</div>
          {toast.message && (
            <div className="text-sm opacity-90 mt-1">{toast.message}</div>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline hover:no-underline mt-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(toastElement, document.body);
};

export default ToastNotification;