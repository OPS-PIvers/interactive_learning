import { SlideEffect, SpotlightParameters, ShowTextParameters, PlayVideoParameters, PlayAudioParameters, QuizParameters, PanZoomParameters, TooltipParameters } from '../../shared/slideTypes';
import { Z_INDEX } from './zIndexLevels';

/**
 * EffectExecutor - Executes slide effects and manages their lifecycle
 * 
 * This class is responsible for actually executing effects when interactions are triggered.
 * Based on the working patterns from the explico repository.
 */
export class EffectExecutor {
  private activeEffects = new Map<string, EffectInstance>();
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Execute a slide effect
   */
  async executeEffect(effect: SlideEffect): Promise<void> {
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
        case 'video':
          await this.executePlayVideo(effect);
          break;
        case 'audio':
          await this.executePlayAudio(effect);
          break;
        case 'quiz':
          await this.executeQuiz(effect);
          break;
        case 'pan_zoom':
          await this.executePanZoom(effect);
          break;
        default:
          console.warn('⚠️ Unknown effect type:', effect.type);
      }
    } catch (error) {
      console.error('❌ Error executing effect:', effect.type, error);
    }
  }

  /**
   * Spotlight effect - highlights a specific area
   */
  private async executeSpotlight(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as SpotlightParameters;
    
    // Create spotlight overlay
    const overlay = document.createElement('div');
    overlay.className = 'spotlight-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: ${Z_INDEX.OVERLAY_CONTENT};
      pointer-events: none;
    `;

    // Create spotlight hole
    const spotlightX = params.position.x;
    const spotlightY = params.position.y;
    const spotlightW = params.position.width;
    const spotlightH = params.position.height;

    if (params.shape === 'circle') {
      const radius = Math.max(spotlightW, spotlightH) / 2;
      overlay.style.clipPath = `circle(${radius}px at ${spotlightX + spotlightW/2}px ${spotlightY + spotlightH/2}px)`;
    } else {
      overlay.style.clipPath = `polygon(
        0% 0%, 0% 100%, ${spotlightX}px 100%, ${spotlightX}px ${spotlightY}px,
        ${spotlightX + spotlightW}px ${spotlightY}px, ${spotlightX + spotlightW}px ${spotlightY + spotlightH}px,
        ${spotlightX}px ${spotlightY + spotlightH}px, ${spotlightX}px 100%, 100% 100%, 100% 0%
      )`;
    }

    this.container.appendChild(overlay);

    // Add message if provided
    if (params.message) {
      const messageEl = document.createElement('div');
      messageEl.className = 'spotlight-message';
      messageEl.textContent = params.message;
      messageEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: ${Z_INDEX.OVERLAY_CONTENT + 1};
        max-width: 300px;
        text-align: center;
      `;
      overlay.appendChild(messageEl);
    }

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: overlay,
      type: 'spotlight',
      cleanup: () => overlay.remove()
    });

    // Auto-remove after duration
    if (effect.duration > 0) {
      setTimeout(() => this.cleanupEffect(effect.id), effect.duration);
    }
  }

  /**
   * Show text effect - displays text content
   */
  private async executeShowText(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as ShowTextParameters;
    
    const textEl = document.createElement('div');
    textEl.className = 'slide-text-effect';
    textEl.innerHTML = params.text;
    
    textEl.style.cssText = `
      position: fixed;
      left: ${params.position?.x || 20}px;
      top: ${params.position?.y || 20}px;
      width: ${params.position?.width || 300}px;
      background: ${params.style.backgroundColor || 'rgba(0,0,0,0.8)'};
      color: ${params.style.color};
      font-size: ${params.style.fontSize}px;
      font-family: ${params.style.fontFamily || 'system-ui'};
      font-weight: ${params.style.fontWeight || 'normal'};
      padding: ${params.style.padding || 16}px;
      border-radius: ${params.style.borderRadius || 8}px;
      z-index: ${Z_INDEX.MODAL_CONTENT};
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    this.container.appendChild(textEl);

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: textEl,
      type: 'text',
      cleanup: () => textEl.remove()
    });

    // Auto-remove after duration
    if (effect.duration > 0) {
      setTimeout(() => this.cleanupEffect(effect.id), effect.duration);
    }
  }

  /**
   * Tooltip effect - shows a small tooltip
   */
  private async executeTooltip(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as TooltipParameters;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'slide-tooltip';
    tooltip.textContent = params.text;
    
    tooltip.style.cssText = `
      position: fixed;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
      z-index: ${Z_INDEX.TOOLTIPS};
      max-width: ${params.maxWidth || 250}px;
      word-wrap: break-word;
    `;

    // Position tooltip (simplified positioning)
    tooltip.style.left = '50%';
    tooltip.style.top = '20px';
    tooltip.style.transform = 'translateX(-50%)';

    this.container.appendChild(tooltip);

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: tooltip,
      type: 'tooltip',
      cleanup: () => tooltip.remove()
    });

    // Auto-remove after duration or default 3 seconds
    setTimeout(() => this.cleanupEffect(effect.id), params.duration || 3000);
  }

  /**
   * Play video effect
   */
  private async executePlayVideo(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as PlayVideoParameters;
    
    const videoContainer = document.createElement('div');
    videoContainer.className = 'slide-video-player';
    videoContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: ${Z_INDEX.MODAL_CONTENT};
      background: black;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;

    const video = document.createElement('video');
    video.controls = params.showControls;
    video.autoplay = params.autoplay;
    video.loop = params.loop || false;
    video.muted = params.muted || false;
    video.style.cssText = 'width: 100%; height: 100%; max-width: 80vw; max-height: 80vh;';

    if (params.videoSource === 'youtube' && params.youtubeVideoId) {
      // Create YouTube iframe instead
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube.com/embed/${params.youtubeVideoId}${params.youtubeStartTime ? `?start=${params.youtubeStartTime}` : ''}`;
      iframe.style.cssText = 'width: 560px; height: 315px; border: none;';
      videoContainer.appendChild(iframe);
    } else if (params.videoUrl) {
      video.src = params.videoUrl;
      videoContainer.appendChild(video);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      border: none;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 20px;
      z-index: 1;
    `;
    closeBtn.onclick = () => this.cleanupEffect(effect.id);
    videoContainer.appendChild(closeBtn);

    this.container.appendChild(videoContainer);

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: videoContainer,
      type: 'video',
      cleanup: () => {
        video.pause();
        videoContainer.remove();
      }
    });
  }

  /**
   * Play audio effect
   */
  private async executePlayAudio(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as PlayAudioParameters;
    
    const audio = document.createElement('audio');
    audio.src = params.audioUrl;
    audio.volume = params.volume || 1.0;
    audio.loop = params.loop || false;

    if (params.autoplay) {
      try {
        await audio.play();
      } catch (error) {
        console.warn('Audio autoplay failed:', error);
      }
    }

    // Create mini player if controls are shown
    if (params.showControls) {
      const player = document.createElement('div');
      player.className = 'slide-audio-player';
      player.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0,0,0,0.9);
        color: white;
        padding: 12px;
        border-radius: 8px;
        z-index: ${Z_INDEX.MODAL_CONTENT};
        min-width: 200px;
      `;

      const playBtn = document.createElement('button');
      playBtn.textContent = '▶️';
      playBtn.onclick = () => audio.paused ? audio.play() : audio.pause();
      
      player.appendChild(playBtn);
      player.appendChild(audio);
      this.container.appendChild(player);

      // Store for cleanup
      this.activeEffects.set(effect.id, {
        element: player,
        type: 'audio',
        cleanup: () => {
          audio.pause();
          player.remove();
        }
      });
    } else {
      // Background audio
      this.activeEffects.set(effect.id, {
        element: audio,
        type: 'audio',
        cleanup: () => audio.pause()
      });
    }
  }

  /**
   * Quiz effect - shows a quiz question
   */
  private async executeQuiz(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as QuizParameters;
    
    const quizContainer = document.createElement('div');
    quizContainer.className = 'slide-quiz';
    quizContainer.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: ${Z_INDEX.MODAL_CONTENT};
      max-width: 400px;
      width: 90%;
    `;

    const question = document.createElement('h3');
    question.textContent = params.question;
    question.style.marginBottom = '16px';
    quizContainer.appendChild(question);

    if (params.questionType === 'multiple-choice' && params.choices) {
      params.choices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.style.cssText = `
          display: block;
          width: 100%;
          padding: 12px;
          margin: 8px 0;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
        `;
        
        button.onclick = () => {
          const isCorrect = choice === params.correctAnswer || index === params.correctAnswer;
          button.style.background = isCorrect ? '#22c55e' : '#ef4444';
          button.style.color = 'white';
          
          if (params.explanation) {
            const explanation = document.createElement('p');
            explanation.textContent = params.explanation;
            explanation.style.cssText = 'margin-top: 16px; padding: 12px; background: #f3f4f6; border-radius: 6px;';
            quizContainer.appendChild(explanation);
          }
          
          // Auto-close after showing result
          setTimeout(() => this.cleanupEffect(effect.id), 3000);
        };
        
        quizContainer.appendChild(button);
      });
    }

    this.container.appendChild(quizContainer);

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: quizContainer,
      type: 'quiz',
      cleanup: () => quizContainer.remove()
    });
  }

  /**
   * Pan and zoom effect
   */
  private async executePanZoom(effect: SlideEffect): Promise<void> {
    const params = effect.parameters as PanZoomParameters;
    
    // Find the slide container to transform
    const slideContainer = this.container.querySelector('.slide-container') as HTMLElement;
    if (!slideContainer) {
      console.warn('No slide container found for pan/zoom effect');
      return;
    }

    const targetX = params.targetPosition.x;
    const targetY = params.targetPosition.y;
    const scale = params.zoomLevel;

    // Apply transform
    slideContainer.style.transform = `translate(${-targetX}px, ${-targetY}px) scale(${scale})`;
    slideContainer.style.transformOrigin = 'top left';
    slideContainer.style.transition = `transform ${params.duration}ms ${params.easing || 'ease-in-out'}`;

    // Store for cleanup
    this.activeEffects.set(effect.id, {
      element: slideContainer,
      type: 'pan_zoom',
      cleanup: () => {
        slideContainer.style.transform = 'none';
        slideContainer.style.transformOrigin = '';
        slideContainer.style.transition = '';
      }
    });

    // Auto-return to original if specified
    if (params.returnToOriginal && params.returnDelay) {
      setTimeout(() => this.cleanupEffect(effect.id), params.returnDelay);
    }
  }

  /**
   * Clean up a specific effect
   */
  private cleanupEffect(effectId: string): void {
    const effectInstance = this.activeEffects.get(effectId);
    if (effectInstance) {
      effectInstance.cleanup();
      this.activeEffects.delete(effectId);
      console.log('🧹 Cleaned up effect:', effectId);
    }
  }

  /**
   * Clean up all active effects
   */
  public cleanupAllEffects(): void {
    for (const [effectId] of this.activeEffects) {
      this.cleanupEffect(effectId);
    }
    console.log('🧹 Cleaned up all effects');
  }

  /**
   * Get currently active effects
   */
  public getActiveEffects(): string[] {
    return Array.from(this.activeEffects.keys());
  }
}

/**
 * Interface for tracking active effect instances
 */
interface EffectInstance {
  element: HTMLElement | HTMLAudioElement;
  type: string;
  cleanup: () => void;
}