// Retry utilities for network operations with exponential backoff
import { firebaseManager } from '../../lib/firebaseConfig';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export interface RetryContext {
  attempt: number;
  lastError?: unknown;
  totalElapsed: number;
  nextDelay: number;
}

/**
 * Get default retry options (unified for all devices)
 */
export function getDefaultRetryOptions(): RetryOptions {
  return {
    maxAttempts: 3, // Unified retry attempts for all devices
    baseDelay: 2000, // Unified base delay
    maxDelay: 30000, // Unified max delay
    backoffFactor: 2,
    jitter: true,
    retryCondition: (error) => {
      // Retry network errors, timeouts, and some Firebase errors
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Don't retry permission errors
        if (message.includes('storage/unauthorized') ||
        message.includes('permission denied') ||
        message.includes('storage/object-not-found') ||
        message.includes('storage/bucket-not-found')) {
          return false;
        }
        return message.includes('network') ||
        message.includes('timeout') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('storage/retry-limit-exceeded') ||
        message.includes('storage/server-file-wrong-size');
      }
      return true; // Retry by default
    }
  };
}

/**
 * Calculate the next delay with exponential backoff and jitter
 */
export function calculateNextDelay(
attempt: number,
baseDelay: number,
maxDelay: number,
backoffFactor: number,
jitter: boolean)
: number {
  const exponentialDelay = baseDelay * Math.pow(backoffFactor, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);

  if (jitter) {
    // Add random jitter to prevent thundering herd
    const jitterFactor = 0.1;
    const jitterAmount = clampedDelay * jitterFactor * (Math.random() - 0.5);
    return Math.max(0, clampedDelay + jitterAmount);
  }

  return clampedDelay;
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
operation: (context: RetryContext) => Promise<T>,
options: Partial<RetryOptions> = {})
: Promise<T> {
  const opts = { ...getDefaultRetryOptions(), ...options };
  const startTime = Date.now();

  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    const context: RetryContext = {
      attempt,
      lastError,
      totalElapsed: Date.now() - startTime,
      nextDelay: attempt < opts.maxAttempts ?
      calculateNextDelay(attempt, opts.baseDelay, opts.maxDelay, opts.backoffFactor, opts.jitter) : 0
    };

    try {
      const result = await operation(context);

      // Success! Log if it took more than one attempt
      if (attempt > 1) {

      }

      return result;
    } catch (error) {
      lastError = error;

      console.warn(`❌ Operation failed on attempt ${attempt}/${opts.maxAttempts}:`, error);

      // Check if we should retry
      if (attempt >= opts.maxAttempts) {
        console.error(`🚨 Operation failed after ${opts.maxAttempts} attempts`);
        throw error;
      }

      // Check retry condition
      if (opts.retryCondition && !opts.retryCondition(error)) {

        throw error;
      }

      // Wait before retrying
      if (context.nextDelay > 0) {

        await sleep(context.nextDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Refresh authentication token if needed
 */
export async function refreshAuthTokenIfNeeded(): Promise<boolean> {
  try {
    // Ensure Firebase is initialized first
    await firebaseManager.initialize();
    const auth = firebaseManager.getAuth();
    if (!auth) {
      console.warn('Auth not available for token refresh');
      return false;
    }
    const user = auth.currentUser;

    if (!user) {
      console.warn('No user available for token refresh');
      return false;
    }

    // Get current token and check if it's close to expiring
    const tokenResult = await user.getIdTokenResult(false);
    const expirationTime = new Date(tokenResult.expirationTime).getTime();
    const currentTime = Date.now();
    const timeUntilExpiry = expirationTime - currentTime;

    // If token expires in less than 5 minutes, refresh it
    if (timeUntilExpiry < 5 * 60 * 1000) {

      await user.getIdToken(true); // Force refresh
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to refresh authentication token:', error);
    return false;
  }
}