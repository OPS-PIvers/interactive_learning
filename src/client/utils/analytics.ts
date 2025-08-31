/**
 * Analytics and error reporting utilities
 */

interface AnalyticsEvent {
  name: string;
  category: 'user_action' | 'system' | 'error' | 'performance';
  data?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
}

class Analytics {
  private enabled: boolean;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.enabled = import.meta.env['VITE_ENABLE_ANALYTICS'] === 'true';
    this.sessionId = this.generateSessionId();

    if (this.enabled) {
      this.initializeAnalytics();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAnalytics(): void {
    // Initialize Google Analytics if ID is provided
    const gaId = import.meta.env['VITE_GOOGLE_ANALYTICS_ID'];
    if (gaId) {
      this.initializeGoogleAnalytics(gaId);
    }

    // Initialize other analytics services as needed
  }

  private initializeGoogleAnalytics(trackingId: string): void {
    // Load Google Analytics
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    (window as any).dataLayer = (window as any).dataLayer || [];
    const gtag = (...args: any[]) => {
      (window as any).dataLayer.push(args);
    };

    gtag('js', new Date());
    gtag('config', trackingId, {
      session_id: this.sessionId,
      user_id: this.userId
    });

    (window as any).gtag = gtag;
  }

  setUserId(userId: string): void {
    this.userId = userId;

    if (this.enabled && (window as any).gtag) {
      (window as any).gtag('config', import.meta.env['VITE_GOOGLE_ANALYTICS_ID'], {
        user_id: userId
      });
    }
  }

  trackEvent(event: AnalyticsEvent): void {
    if (!this.enabled) return;

    // Console logging for development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }

    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', event.name, {
        event_category: event.category,
        event_label: event.data?.['label'],
        value: event.data?.['value'],
        custom_parameters: event.data
      });
    }

    // Custom analytics endpoint (if configured)
    this.sendToCustomEndpoint(event);
  }

  trackPerformance(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.trackEvent({
      name: 'performance_metric',
      category: 'performance',
      data: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        timestamp: metric.timestamp
      }
    });
  }

  trackError(error: Error, context?: Record<string, any>): void {
    if (!this.enabled) return;

    this.trackEvent({
      name: 'error',
      category: 'error',
      data: {
        error_message: error.message,
        error_stack: error.stack,
        error_context: context,
        user_agent: navigator.userAgent,
        url: window.location.href
      }
    });
  }

  private sendToCustomEndpoint(event: AnalyticsEvent): void {
    const endpoint = import.meta.env['VITE_ANALYTICS_ENDPOINT'];
    if (!endpoint) return;

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...event,
        session_id: this.sessionId,
        user_id: this.userId,
        timestamp: Date.now(),
        url: window.location.href,
        user_agent: navigator.userAgent
      })
    }).catch(error => {
      console.warn('Failed to send analytics event:', error);
    });
  }
}

// Singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackPageView = (page: string) => {
  analytics.trackEvent({
    name: 'page_view',
    category: 'user_action',
    data: { page }
  });
};

export const trackWalkthroughCreated = () => {
  analytics.trackEvent({
    name: 'walkthrough_created',
    category: 'user_action'
  });
};

export const trackWalkthroughCompleted = (walkthroughId: string, stepCount: number) => {
  analytics.trackEvent({
    name: 'walkthrough_completed',
    category: 'user_action',
    data: {
      walkthrough_id: walkthroughId,
      step_count: stepCount
    }
  });
};

export const trackHotspotClicked = (hotspotId: string, stepIndex: number) => {
  analytics.trackEvent({
    name: 'hotspot_clicked',
    category: 'user_action',
    data: {
      hotspot_id: hotspotId,
      step_index: stepIndex
    }
  });
};
