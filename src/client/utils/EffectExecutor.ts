import { Z_INDEX } from './zIndexLevels';

/**
 * Enhanced EffectExecutor for Phase 3 - Polish & Testing
 * 
 * This version includes advanced memory management, cleanup, and performance monitoring.
 */

export interface SimpleEffect {
  id: string;
  type: 'spotlight' | 'text' | 'tooltip';
  duration?: number;
  parameters: any;
}

interface EffectInstance {
  element: HTMLElement;
  type: string;
  cleanup: () => void;
  createdAt: number;
  animation?: Animation;
  listeners?: { element: HTMLElement, type: string, listener: EventListener }[];
  objectUrls?: string[];
}

export class EffectExecutor {
  private activeEffects = new Map<string, EffectInstance>();
  private container: HTMLElement;
  private cleanupTimers: Set<number> = new Set();
  private memoryUsage: Map<string, number> = new Map();
  private maxActiveEffects: number = 10;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async executeEffect(effect: SimpleEffect): Promise<void> {
    console.log('🎬 Executing effect:', effect.type, 'ID:', effect.id);
    this.cleanupEffect(effect.id);

    try {
      switch (effect.type) {
        case 'spotlight':
          await this.executeSpotlight(effect);
          break;
        case 'text':
          await this.executeShowText(effect);
          break;
        case 'tooltip':
          await this.executeTooltip(effect);
          break;
        default:
          console.warn('Unknown effect type:', effect.type);
      }
      this.enhancedCleanup();
    } catch (error) {
      console.error('Error executing effect:', error);
    }
  }

  private async executeSpotlight(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const shape = params.shape || 'circle';
    const intensity = params.intensity || 70;
    const message = params.message;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(0, 0, 0, ${intensity / 100});
      z-index: ${Z_INDEX.MODAL_BACKDROP}; pointer-events: auto; cursor: pointer;
    `;

    if (shape === 'circle') {
      const spotlightSize = 200;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      overlay.style.background = `
        radial-gradient(circle at ${centerX}px ${centerY}px, 
          transparent ${spotlightSize/2}px, 
          rgba(0, 0, 0, ${intensity / 100}) ${spotlightSize/2 + 50}px)
      `;
    }

    if (message) {
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.style.cssText = `
        position: absolute; top: 60%; left: 50%; transform: translateX(-50%);
        color: white; font-size: 18px; text-align: center; padding: 12px 24px;
        background-color: rgba(0, 0, 0, 0.8); border-radius: 8px; max-width: 300px;
      `;
      overlay.appendChild(messageElement);
    }

    this.container.appendChild(overlay);
    const cleanup = () => this.cleanupEffect(effect.id);
    overlay.addEventListener('click', cleanup);

    this.activeEffects.set(effect.id, {
      element: overlay,
      type: 'spotlight',
      cleanup,
      createdAt: Date.now(),
      listeners: [{ element: overlay, type: 'click', listener: cleanup }]
    });

    const duration = effect.duration || 5000;
    const timerId = window.setTimeout(cleanup, duration);
    this.cleanupTimers.add(timerId);
  }

  private async executeShowText(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const text = params.text || 'Sample text';
    const textElement = document.createElement('div');
    textElement.textContent = text;
    textElement.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background-color: white; border: 2px solid #2d3f89; border-radius: 8px;
      padding: 16px 24px; font-size: 16px; color: #333;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: ${Z_INDEX.MODAL_CONTENT};
      max-width: 400px; text-align: center; cursor: pointer;
    `;
    this.container.appendChild(textElement);

    const cleanup = () => this.cleanupEffect(effect.id);
    textElement.addEventListener('click', cleanup);

    this.activeEffects.set(effect.id, {
      element: textElement,
      type: 'text',
      cleanup,
      createdAt: Date.now(),
      listeners: [{ element: textElement, type: 'click', listener: cleanup }]
    });

    const duration = effect.duration || 3000;
    const timerId = window.setTimeout(cleanup, duration);
    this.cleanupTimers.add(timerId);
  }

  private async executeTooltip(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const text = params.text || 'Tooltip text';
    const tooltip = document.createElement('div');
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed; top: 20px; right: 20px; background-color: #333;
      color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px;
      z-index: ${Z_INDEX.TOOLTIP}; max-width: 200px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); cursor: pointer;
    `;
    this.container.appendChild(tooltip);

    const cleanup = () => this.cleanupEffect(effect.id);
    tooltip.addEventListener('click', cleanup);

    this.activeEffects.set(effect.id, {
      element: tooltip,
      type: 'tooltip',
      cleanup,
      createdAt: Date.now(),
      listeners: [{ element: tooltip, type: 'click', listener: cleanup }]
    });

    const duration = effect.duration || 2000;
    const timerId = window.setTimeout(cleanup, duration);
    this.cleanupTimers.add(timerId);
  }

  private cleanupEffect(effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (!effect) return;

    try {
      // Cancel any ongoing animations
      if (effect.animation) {
        effect.animation.cancel();
      }

      // Remove event listeners
      if (effect.listeners) {
        effect.listeners.forEach(({ element, type, listener }) => {
          element.removeEventListener(type, listener as EventListener);
        });
      }

      // Cleanup DOM elements
      if (effect.element) {
        // Fade out before removal for better UX
        effect.element.style.transition = 'opacity 0.2s ease-out';
        effect.element.style.opacity = '0';

        setTimeout(() => {
          if (effect.element && effect.element.parentNode) {
            effect.element.parentNode.removeChild(effect.element);
          }
        }, 200);
      }

      // Revoke object URLs to prevent memory leaks
      if (effect.objectUrls) {
        effect.objectUrls.forEach(url => {
          URL.revokeObjectURL(url);
        });
      }

      // Custom cleanup
      if (effect.cleanup) {
        effect.cleanup();
      }

    } catch (error) {
      console.warn('Error during effect cleanup:', error);
    } finally {
      this.activeEffects.delete(effectId);
      this.memoryUsage.delete(effectId);
    }
  }

  /**
   * Enhanced cleanup with memory management
   */
  private enhancedCleanup(): void {
    // Clear all timers
    this.cleanupTimers.forEach(timer => {
      clearTimeout(timer);
    });
    this.cleanupTimers.clear();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Limit active effects to prevent memory issues
    if (this.activeEffects.size > this.maxActiveEffects) {
      this.cleanupOldestEffects();
    }
  }

  /**
   * Monitor memory usage of effects
   */
  private monitorMemoryUsage(): void {
    this.activeEffects.forEach((effect, id) => {
      const element = effect.element;
      if (element) {
        // Estimate memory usage based on element size and complexity
        const usage = this.estimateElementMemoryUsage(element);
        this.memoryUsage.set(id, usage);
      }
    });

    // Log memory usage in development
    if (process.env.NODE_ENV === 'development') {
      const totalUsage = Array.from(this.memoryUsage.values()).reduce((sum, usage) => sum + usage, 0);
      console.log(`EffectExecutor Memory Usage: ${(totalUsage / 1024).toFixed(2)}KB`);
    }
  }

  /**
   * Estimate memory usage of a DOM element
   */
  private estimateElementMemoryUsage(element: HTMLElement): number {
    let usage = 0;

    // Base element size
    usage += element.outerHTML.length * 2; // UTF-16 encoding

    // Images and media
    const images = element.querySelectorAll('img, video');
    images.forEach(img => {
      if (img instanceof HTMLImageElement && img.naturalWidth) {
        usage += img.naturalWidth * img.naturalHeight * 4; // RGBA bytes
      }
    });

    // Event listeners (estimate)
    usage += element.querySelectorAll('*').length * 100; // Rough estimate

    return usage;
  }

  /**
   * Cleanup oldest effects when memory limit reached
   */
  private cleanupOldestEffects(): void {
    const effects = Array.from(this.activeEffects.entries());

    // Sort by creation time (oldest first)
    effects.sort((a, b) => {
      const aTime = a[1].createdAt || 0;
      const bTime = b[1].createdAt || 0;
      return aTime - bTime;
    });

    // Clean up oldest effects until under limit
    const toRemove = effects.slice(0, effects.length - this.maxActiveEffects);
    toRemove.forEach(([id]) => {
      this.cleanupEffect(id);
    });
  }

  public cleanup(): void {
    this.activeEffects.forEach((_, id) => this.cleanupEffect(id));
    this.activeEffects.clear();
    this.enhancedCleanup();
  }
}

export default EffectExecutor;