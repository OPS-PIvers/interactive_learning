import { useCallback } from 'react';
import appsignal from '../../lib/appsignal';

export const useAppSignal = () => {
  const reportError = useCallback((error: Error, context?: Record<string, string | number>) => {
    appsignal.sendError(error, span => {
      if (context) {
        span.setTags(context);
      }
    });
  }, []);

  const setUser = useCallback((userId: string, userEmail?: string) => {
    appsignal.setUser({
      id: userId,
      email: userEmail,
    });
  }, []);

  const setAction = useCallback((action: string) => {
    appsignal.setAction(action);
  }, []);

  const addBreadcrumb = useCallback((category: string, message: string, metadata?: Record<string, string>) => {
    appsignal.addBreadcrumb({
      category,
      message,
      metadata,
    });
  }, []);

  const createSpan = useCallback((name: string) => {
    return appsignal.createSpan(name);
  }, []);

  return {
    reportError,
    setUser,
    setAction,
    addBreadcrumb,
    createSpan,
  };
};

export default useAppSignal;