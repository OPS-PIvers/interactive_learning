// Network monitoring utilities for upload operations

interface NetworkInformation extends EventTarget {
  readonly type?: 'bluetooth' | 'cellular' | 'ethernet' | 'none' | 'wifi' | 'wimax' | 'other' | 'unknown';
  readonly effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  readonly downlinkMax?: number;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  onchange?: EventListener;
}

// Extend Navigator interface for network connection APIs
interface ExtendedNavigator extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

// Get current network connection details
function getNetworkDetails() {
  const extNav = navigator as ExtendedNavigator;
  const connection = extNav.connection || extNav.mozConnection || extNav.webkitConnection;

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
  private currentState: NetworkState;
  private connection?: NetworkInformation;
  // Bound method references for proper event listener cleanup
  private boundUpdateState = this.updateState.bind(this);

  constructor() {
    this.currentState = this.getCurrentNetworkState();
    this.setupListeners();
  }

  private setupListeners() {
    window.addEventListener('online', this.boundUpdateState);
    window.addEventListener('offline', this.boundUpdateState);
    if ('connection' in navigator) {
      this.connection = (navigator as ExtendedNavigator).connection;
      if (this.connection) {
        this.connection.addEventListener('change', this.boundUpdateState);
      }
    }
  }

  private getCurrentNetworkState(): NetworkState {
    const details = getNetworkDetails();
    return {
      ...details,
      quality: this.determineNetworkQuality(details),
      timestamp: Date.now(),
    };
  }

  private determineNetworkQuality(details: ReturnType<typeof getNetworkDetails>): NetworkState['quality'] {
    if (!details.online) return 'offline';
    switch (details.effectiveType) {
      case '4g':
        return details.rtt < 150 ? 'excellent' : 'good';
      case '3g':
        return 'good';
      case '2g':
      case 'slow-2g':
        return 'poor';
      default:
        return 'good';
    }
  }

  private updateState() {
    this.currentState = this.getCurrentNetworkState();
    this.listeners.forEach(listener => listener(this.currentState));
  }

  public addListener(listener: NetworkChangeListener): () => void {
    this.listeners.push(listener);
    // Immediately provide the current state to the new listener
    listener(this.currentState);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getCurrentState(): NetworkState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.currentState.online;
  }

  public getQuality(): NetworkState['quality'] {
    return this.currentState.quality;
  }

  public destroy() {
    window.removeEventListener('online', this.boundUpdateState);
    window.removeEventListener('offline', this.boundUpdateState);
    this.connection?.removeEventListener('change', this.boundUpdateState);
    this.listeners = [];
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
enableMonitoring: boolean = true)
: NetworkState | null {
  const currentState = networkMonitor.getCurrentState();

  if (enableMonitoring && onNetworkChange) {
    const unsubscribe = networkMonitor.addListener(onNetworkChange);
    // Monitoring is always active in the new lightweight implementation

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
enableMonitoring: boolean = true)
: () => void {
  if (!enableMonitoring) {
    return () => {};
  }

  const unsubscribe = networkMonitor.addListener(onNetworkChange);
  // Monitoring is always active in the new lightweight implementation

  return () => {
    unsubscribe();
    // No need to stop monitoring in the new lightweight implementation
  };
}

/**
 * Wait for network to be available
 */
export function waitForNetwork(maxWaitMs: number = 30000): Promise<NetworkState> {
  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout>;
    
    const cleanup = () => {
      clearTimeout(timeout);
      // No need to stop monitoring in the new lightweight implementation
    };

    timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Network wait timeout'));
    }, maxWaitMs);

    const checkNetwork = () => {
      if (networkMonitor.isOnline()) {
        cleanup();
        resolve(networkMonitor.getCurrentState()!);
      }
    };

    // Start monitoring and check immediately
    // Monitoring is always active in the new lightweight implementation
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