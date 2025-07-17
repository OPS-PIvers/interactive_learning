import React from 'react';
import { TimelineEventData, InteractionType } from '../../shared/types';

export interface DebugIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  property?: string;
  value?: any;
}

export interface EventDebugInfo {
  event: TimelineEventData;
  containerRef: React.RefObject<HTMLElement> | null;
  component: string;
  timestamp: number;
  issues: DebugIssue[];
}

class MobileEventDebugger {
  private debugEnabled = false;
  private eventLog: EventDebugInfo[] = [];

  enable() {
    this.debugEnabled = true;
    console.log('🐛 Mobile Event Debugger enabled');
  }

  disable() {
    this.debugEnabled = false;
    console.log('🐛 Mobile Event Debugger disabled');
  }

  logEvent(
    event: TimelineEventData,
    containerRef: React.RefObject<HTMLElement> | null,
    component: string
  ): EventDebugInfo {
    const issues = this.diagnoseEvent(event, containerRef);
    
    const debugInfo: EventDebugInfo = {
      event,
      containerRef,
      component,
      timestamp: Date.now(),
      issues
    };

    if (this.debugEnabled) {
      console.group(`🎯 Mobile Event Debug: ${event.type} in ${component}`);
      console.log('Event Data:', event);
      console.log('Container Ref:', containerRef?.current);
      
      if (issues.length > 0) {
        console.warn('Issues detected:', issues);
      } else {
        console.log('✅ No issues detected');
      }
      
      console.groupEnd();
    }

    this.eventLog.push(debugInfo);
    
    // Keep only last 50 events
    if (this.eventLog.length > 50) {
      this.eventLog = this.eventLog.slice(-50);
    }

    return debugInfo;
  }

  diagnoseEvent(
    event: TimelineEventData,
    containerRef: React.RefObject<HTMLElement> | null
  ): DebugIssue[] {
    const issues: DebugIssue[] = [];

    // Check container ref
    if (!containerRef || !containerRef.current) {
      issues.push({
        type: 'error',
        message: 'Container ref is null or undefined',
        property: 'containerRef'
      });
    }

    // Check event type specific properties
    switch (event.type) {
      case InteractionType.SPOTLIGHT:
      case InteractionType.HIGHLIGHT_HOTSPOT:
        this.validateSpotlightEvent(event, issues);
        break;
      
      case InteractionType.PAN_ZOOM:
      case InteractionType.PAN_ZOOM_TO_HOTSPOT:
        this.validatePanZoomEvent(event, issues);
        break;
      
      case InteractionType.PULSE_HOTSPOT:
      case InteractionType.PULSE_HIGHLIGHT:
        this.validatePulseEvent(event, issues);
        break;
    }

    // Check common properties
    if (!event.id) {
      issues.push({
        type: 'error',
        message: 'Event missing required id property',
        property: 'id'
      });
    }

    if (event.duration && (event.duration < 100 || event.duration > 30000)) {
      issues.push({
        type: 'warning',
        message: 'Event duration seems unusual (should be 100-30000ms)',
        property: 'duration',
        value: event.duration
      });
    }

    return issues;
  }

  private validateSpotlightEvent(event: TimelineEventData, issues: DebugIssue[]) {
    // Check for position properties (multiple formats supported)
    const hasPosition = 
      event.spotlightX !== undefined || 
      event.spotlightY !== undefined ||
      event.highlightX !== undefined ||
      event.highlightY !== undefined;

    if (!hasPosition) {
      issues.push({
        type: 'warning',
        message: 'Spotlight event missing position properties',
        property: 'position'
      });
    }

    // Check radius/size properties
    const hasSize = 
      event.highlightRadius !== undefined ||
      event.spotlightRadius !== undefined ||
      event.spotlightWidth !== undefined;

    if (!hasSize) {
      issues.push({
        type: 'info',
        message: 'Spotlight event using default size (no radius/width specified)',
        property: 'size'
      });
    }

    // Check dimming properties
    const hasDim = 
      event.dimPercentage !== undefined ||
      event.spotlightDim !== undefined;

    if (!hasDim) {
      issues.push({
        type: 'info',
        message: 'Spotlight event using default dimming (70%)',
        property: 'dimming'
      });
    }
  }

  private validatePanZoomEvent(event: TimelineEventData, issues: DebugIssue[]) {
    // Check for target position
    const hasTarget = 
      event.targetX !== undefined ||
      event.targetY !== undefined ||
      event.panX !== undefined ||
      event.panY !== undefined ||
      event.spotlightX !== undefined ||
      event.spotlightY !== undefined;

    if (!hasTarget) {
      issues.push({
        type: 'warning',
        message: 'Pan/zoom event missing target position',
        property: 'target'
      });
    }

    // Check for zoom level
    const hasZoom = 
      event.zoomLevel !== undefined ||
      event.zoomFactor !== undefined ||
      event.zoom !== undefined;

    if (!hasZoom) {
      issues.push({
        type: 'info',
        message: 'Pan/zoom event using default zoom level (2x)',
        property: 'zoom'
      });
    }

    // Validate zoom level range
    const zoomLevel = event.zoomLevel || event.zoomFactor || event.zoom || 2;
    if (zoomLevel < 1 || zoomLevel > 5) {
      issues.push({
        type: 'warning',
        message: 'Zoom level outside recommended range (1-5)',
        property: 'zoom',
        value: zoomLevel
      });
    }
  }

  private validatePulseEvent(event: TimelineEventData, issues: DebugIssue[]) {
    // Pulse events typically use hotspot position
    if (!event.targetId) {
      issues.push({
        type: 'warning',
        message: 'Pulse event missing targetId (hotspot reference)',
        property: 'targetId'
      });
    }
  }

  generateTestEvents(): TimelineEventData[] {
    return [
      {
        id: 'test-spotlight-1',
        type: InteractionType.SPOTLIGHT,
        step: 1,
        spotlightX: 50,
        spotlightY: 50,
        spotlightDim: 70,
        duration: 3000,
        message: 'Test spotlight event'
      },
      {
        id: 'test-panzoom-1',
        type: InteractionType.PAN_ZOOM,
        step: 1,
        targetX: 25,
        targetY: 25,
        zoomLevel: 2,
        duration: 2000,
        message: 'Test pan/zoom event'
      },
      {
        id: 'test-highlight-1',
        type: InteractionType.HIGHLIGHT_HOTSPOT,
        step: 1,
        highlightX: 75,
        highlightY: 25,
        highlightRadius: 80,
        duration: 2500,
        targetId: 'test-hotspot'
      }
    ];
  }

  getEventLog(): EventDebugInfo[] {
    return [...this.eventLog];
  }

  clearLog() {
    this.eventLog = [];
    console.log('🐛 Mobile Event Debug log cleared');
  }

  exportDebugReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: this.eventLog.length,
      events: this.eventLog.map(info => ({
        component: info.component,
        eventType: info.event.type,
        eventId: info.event.id,
        timestamp: info.timestamp,
        issues: info.issues,
        hasContainer: !!info.containerRef?.current
      }))
    };

    return JSON.stringify(report, null, 2);
  }
}

// Singleton instance
export const mobileEventDebugger = new MobileEventDebugger();

// React hook for easy integration
export function useMobileEventDebug(enabled = false) {
  React.useEffect(() => {
    if (enabled) {
      mobileEventDebugger.enable();
    } else {
      mobileEventDebugger.disable();
    }
  }, [enabled]);

  return {
    logEvent: mobileEventDebugger.logEvent.bind(mobileEventDebugger),
    diagnose: mobileEventDebugger.diagnoseEvent.bind(mobileEventDebugger),
    generateTestEvents: mobileEventDebugger.generateTestEvents.bind(mobileEventDebugger),
    getLog: mobileEventDebugger.getEventLog.bind(mobileEventDebugger),
    clearLog: mobileEventDebugger.clearLog.bind(mobileEventDebugger),
    exportReport: mobileEventDebugger.exportDebugReport.bind(mobileEventDebugger)
  };
}

// Helper for console debugging
export function debugMobileEvent(
  event: TimelineEventData,
  containerRef: React.RefObject<HTMLElement> | null,
  component = 'Unknown'
) {
  return mobileEventDebugger.logEvent(event, containerRef, component);
}

// Visual debugging helper for development
export function addVisualDebugOverlay(containerElement: HTMLElement) {
  const overlay = document.createElement('div');
  overlay.id = 'mobile-debug-overlay';
  overlay.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
    border: 2px dashed rgba(255, 0, 0, 0.5);
    background: rgba(255, 255, 0, 0.1);
  `;
  
  const label = document.createElement('div');
  label.textContent = 'DEBUG: Mobile Event Container';
  label.style.cssText = `
    position: absolute;
    top: 5px;
    left: 5px;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    padding: 2px 5px;
    font-size: 10px;
    font-family: monospace;
  `;
  
  overlay.appendChild(label);
  containerElement.appendChild(overlay);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
  }, 5000);
}