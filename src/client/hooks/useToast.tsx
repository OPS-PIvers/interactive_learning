import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ToastNotification, { ToastData } from '../components/ui/ToastNotification';
import { generateId } from '../utils/generateId';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: generateId('toast'),
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, ...(message && { message }) });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, ...(message && { message }) });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, ...(message && { message }) });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, ...(message && { message }) });
  }, [showToast]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider 
      value={{ 
        showToast, 
        showSuccess, 
        showError, 
        showWarning, 
        showInfo, 
        dismissToast 
      }}
    >
      {children}
      {toasts.map(toast => (
        <ToastNotification
          key={toast.id}
          toast={toast}
          onDismiss={dismissToast}
        />
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;