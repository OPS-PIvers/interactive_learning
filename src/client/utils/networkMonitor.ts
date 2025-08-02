// Network monitoring utilities for upload operations

// Get current network connection details
function getNetworkDetails() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  };
}

export interface NetworkState {
  online: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  effectiveType: string;
  downlink: number;
  rtt: number;
  timestamp: number;
}

export type NetworkChangeListener = (state: NetworkState) => void;

class NetworkMonitor {
  private listeners: NetworkChangeListener[] = [];
  private currentState: NetworkState | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;
  private boundUpdateNetworkState: () => void;
  private connection: any = null;

  constructor() {
    this.boundUpdateNetworkState = this.updateNetworkState.bind(this);
    this.initializeNetworkListeners();
  }

  private initializeNetworkListeners() {
    // Listen for online/offline events
    window.addEventListener('online', this.boundUpdateNetworkState);
    window.addEventListener('offline', this.boundUpdateNetworkState);

    // Listen for connection changes (if supported)
    if ('connection' in navigator) {
      this.connection = (navigator as any).connection;
      if (this.connection) {
        this.connection.addEventListener('change', this.boundUpdateNetworkState);
      }
    }
  }

  private cleanupNetworkListeners() {
    // Remove event listeners to prevent memory leaks
    window.removeEventListener('online', this.boundUpdateNetworkState);
    window.removeEventListener('offline', this.boundUpdateNetworkState);

    if (this.connection) {
      this.connection.removeEventListener('change', this.boundUpdateNetworkState);
    }
  }

  private updateNetworkState() {
    const networkDetails = getNetworkDetails();
    const quality = this.determineNetworkQuality(networkDetails);
    
    const newState: NetworkState = {
      online: networkDetails.online,
      quality,
      effectiveType: networkDetails.effectiveType || 'unknown',
      downlink: networkDetails.downlink || 0,
      rtt: networkDetails.rtt || 0,
      timestamp: Date.now()
    };

    const stateChanged = !this.currentState || 
                        this.currentState.online !== newState.online ||
                        this.currentState.quality !== newState.quality;

    this.currentState = newState;

    if (stateChanged) {
      console.log('📡 Network state changed:', newState);
      this.notifyListeners(newState);
    }
  }

  private determineNetworkQuality(networkDetails: any): NetworkState['quality'] {
    if (!networkDetails.online) {
      return 'offline';
    }

    const effectiveType = networkDetails.effectiveType;
    const downlink = networkDetails.downlink || 0;
    const rtt = networkDetails.rtt || 0;

    // Use effective type if available
    if (effectiveType) {
      switch (effectiveType) {
        case '4g':
          return downlink >= 10 && rtt < 100 ? 'excellent' : 'good';
        case '3g':
          return downlink >= 1.5 && rtt < 300 ? 'good' : 'fair';
        case '2g':
          return 'poor';
        case 'slow-2g':
          return 'poor';
        default:
          break;
      }
    }

    // Fallback to downlink and RTT analysis
    if (downlink >= 10 && rtt < 100) {
      return 'excellent';
    } else if (downlink >= 3 && rtt < 200) {
      return 'good';
    } else if (downlink >= 1 && rtt < 500) {
      return 'fair';
    } else if (downlink > 0) {
      return 'poor';
    }

    return 'good'; // Default if no specific indicators
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Network listener error:', error);
      }
    });
  }

  public startMonitoring(intervalMs: number = 5000) {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.updateNetworkState(); // Initial update

    this.monitoringInterval = setInterval(() => {
      this.updateNetworkState();
    }, intervalMs);

    console.log('📡 Network monitoring started');
  }

  public stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('📡 Network monitoring stopped');
  }

  public destroy() {
    // Stop monitoring first
    this.stopMonitoring();
    
    // Clean up event listeners
    this.cleanupNetworkListeners();
    
    // Clear all listeners
    this.listeners = [];
    this.currentState = null;
    
    console.log('📡 Network monitor destroyed');
  }

  public addListener(listener: NetworkChangeListener): () => void {
    this.listeners.push(listener);
    
    // Send current state to new listener
    if (this.currentState) {
      listener(this.currentState);
    }

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getCurrentState(): NetworkState | null {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.currentState?.online ?? navigator.onLine;
  }

  public getQuality(): NetworkState['quality'] {
    return this.currentState?.quality ?? 'good';
  }
}

// Singleton instance
export const networkMonitor = new NetworkMonitor();

/**
 * Hook for monitoring network state during uploads
 * Note: This should be used with React useEffect for proper cleanup
 */
export function useNetworkMonitoring(
  onNetworkChange?: NetworkChangeListener,
  enableMonitoring: boolean = true
): NetworkState | null {
  const currentState = networkMonitor.getCurrentState();

  if (enableMonitoring && onNetworkChange) {
    const unsubscribe = networkMonitor.addListener(onNetworkChange);
    networkMonitor.startMonitoring();
    
    // Return cleanup function that should be called in useEffect cleanup
    // Usage: useEffect(() => { const cleanup = useNetworkMonitoring(...); return cleanup; }, []);
    return currentState;
  }

  return currentState;
}

/**
 * Utility to create a network monitoring subscription with cleanup
 */
export function createNetworkSubscription(
  onNetworkChange: NetworkChangeListener,
  enableMonitoring: boolean = true
): () => void {
  if (!enableMonitoring) {
    return () => {};
  }

  const unsubscribe = networkMonitor.addListener(onNetworkChange);
  networkMonitor.startMonitoring();
  
  return () => {
    unsubscribe();
    networkMonitor.stopMonitoring();
  };
}

/**
 * Wait for network to be available
 */
export function waitForNetwork(maxWaitMs: number = 30000): Promise<NetworkState> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Network wait timeout'));
    }, maxWaitMs);

    const checkNetwork = () => {
      if (networkMonitor.isOnline()) {
        cleanup();
        resolve(networkMonitor.getCurrentState()!);
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      networkMonitor.stopMonitoring();
    };

    // Start monitoring and check immediately
    networkMonitor.startMonitoring(1000); // Check every second
    checkNetwork();

    // Listen for network changes
    const unsubscribe = networkMonitor.addListener((state) => {
      if (state.online) {
        unsubscribe();
        cleanup();
        resolve(state);
      }
    });
  });
}