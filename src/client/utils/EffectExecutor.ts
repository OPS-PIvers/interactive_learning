import { Z_INDEX } from './zIndexLevels';

/**
 * Simplified EffectExecutor for Phase 1 - Foundation Cleanup
 * 
 * This is a streamlined version that supports basic effects needed for hotspot functionality.
 * Supports: spotlight, text, and tooltip effects only.
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
}

export class EffectExecutor {
  private activeEffects = new Map<string, EffectInstance>();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Execute a simple effect
   */
  async executeEffect(effect: SimpleEffect): Promise<void> {
    console.log('🎬 Executing effect:', effect.type, 'ID:', effect.id);

    // Clean up any existing effect with the same ID
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
    } catch (error) {
      console.error('Error executing effect:', error);
    }
  }

  /**
   * Execute spotlight effect - highlights an area with overlay
   */
  private async executeSpotlight(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const shape = params.shape || 'circle';
    const intensity = params.intensity || 70;
    const message = params.message;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, ${intensity / 100});
      z-index: ${Z_INDEX.MODAL_BACKDROP};
      pointer-events: auto;
      cursor: pointer;
    `;

    // Create spotlight area (simplified - just a centered circle)
    if (shape === 'circle') {
      const spotlightSize = 200; // Fixed size for simplicity
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      overlay.style.background = `
        radial-gradient(circle at ${centerX}px ${centerY}px, 
          transparent ${spotlightSize/2}px, 
          rgba(0, 0, 0, ${intensity / 100}) ${spotlightSize/2 + 50}px)
      `;
    }

    // Add message if provided
    if (message) {
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.style.cssText = `
        position: absolute;
        top: 60%;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 18px;
        text-align: center;
        padding: 12px 24px;
        background-color: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        max-width: 300px;
      `;
      overlay.appendChild(messageElement);
    }

    this.container.appendChild(overlay);

    // Auto-dismiss click handler
    const cleanup = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
      this.activeEffects.delete(effect.id);
    };

    overlay.addEventListener('click', cleanup);

    // Store effect instance
    this.activeEffects.set(effect.id, {
      element: overlay,
      type: 'spotlight',
      cleanup
    });

    // Auto-cleanup after duration
    const duration = effect.duration || 5000;
    setTimeout(cleanup, duration);
  }

  /**
   * Execute show text effect
   */
  private async executeShowText(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const text = params.text || 'Sample text';

    const textElement = document.createElement('div');
    textElement.textContent = text;
    textElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      border: 2px solid #2d3f89;
      border-radius: 8px;
      padding: 16px 24px;
      font-size: 16px;
      color: #333;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: ${Z_INDEX.MODAL_CONTENT};
      max-width: 400px;
      text-align: center;
      cursor: pointer;
    `;

    this.container.appendChild(textElement);

    const cleanup = () => {
      if (textElement.parentNode) {
        textElement.parentNode.removeChild(textElement);
      }
      this.activeEffects.delete(effect.id);
    };

    textElement.addEventListener('click', cleanup);

    this.activeEffects.set(effect.id, {
      element: textElement,
      type: 'text',
      cleanup
    });

    // Auto-cleanup after duration
    const duration = effect.duration || 3000;
    setTimeout(cleanup, duration);
  }

  /**
   * Execute tooltip effect
   */
  private async executeTooltip(effect: SimpleEffect): Promise<void> {
    const params = effect.parameters || {};
    const text = params.text || 'Tooltip text';

    const tooltip = document.createElement('div');
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: #333;
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 14px;
      z-index: ${Z_INDEX.TOOLTIP};
      max-width: 200px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    `;

    this.container.appendChild(tooltip);

    const cleanup = () => {
      if (tooltip.parentNode) {
        tooltip.parentNode.removeChild(tooltip);
      }
      this.activeEffects.delete(effect.id);
    };

    tooltip.addEventListener('click', cleanup);

    this.activeEffects.set(effect.id, {
      element: tooltip,
      type: 'tooltip',
      cleanup
    });

    // Auto-cleanup after shorter duration for tooltips
    const duration = effect.duration || 2000;
    setTimeout(cleanup, duration);
  }

  /**
   * Clean up a specific effect
   */
  private cleanupEffect(effectId: string): void {
    const effect = this.activeEffects.get(effectId);
    if (effect) {
      effect.cleanup();
      this.activeEffects.delete(effectId);
    }
  }

  /**
   * Clean up all active effects
   */
  public cleanup(): void {
    for (const [id, effect] of this.activeEffects) {
      effect.cleanup();
    }
    this.activeEffects.clear();
  }
}

export default EffectExecutor;