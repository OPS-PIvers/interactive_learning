import { describe, it, expect } from 'vitest';

describe('Cross-Browser Compatibility', () => {

  describe('CSS Features', () => {
    it('supports CSS Grid', () => {
      const testElement = document.createElement('div');
      testElement.style.display = 'grid';

      expect(testElement.style.display).toBe('grid');
    });

    it('supports CSS Flexbox', () => {
      const testElement = document.createElement('div');
      testElement.style.display = 'flex';

      expect(testElement.style.display).toBe('flex');
    });

    it('supports CSS Custom Properties', () => {
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-color', '#ff0000');

      expect(testElement.style.getPropertyValue('--test-color')).toBe('#ff0000');
    });
  });

  describe('JavaScript Features', () => {
    it('supports ES6 features', () => {
      // Arrow functions
      const arrowFunc = () => 'test';
      expect(arrowFunc()).toBe('test');

      // Destructuring
      const obj = { a: 1, b: 2 };
      const { a, b } = obj;
      expect(a).toBe(1);
      expect(b).toBe(2);

      // Template literals
      const name = 'World';
      const greeting = `Hello ${name}`;
      expect(greeting).toBe('Hello World');
    });

    it('supports Promises', async () => {
      const promise = Promise.resolve('test');
      const result = await promise;
      expect(result).toBe('test');
    });

    it('supports async/await', async () => {
      const asyncFunc = async () => {
        return 'async test';
      };

      const result = await asyncFunc();
      expect(result).toBe('async test');
    });
  });

  describe('DOM APIs', () => {
    it('supports Intersection Observer', () => {
      expect(typeof IntersectionObserver).toBe('function');
    });

    it('supports Clipboard API', () => {
      // Note: navigator.clipboard requires HTTPS in browsers
      expect(typeof navigator.clipboard).toBe('object');
    });

    it('supports Custom Events', () => {
      const event = new CustomEvent('test', { detail: { message: 'test' } });
      expect(event.type).toBe('test');
      expect(event.detail.message).toBe('test');
    });
  });

  describe('Canvas Support', () => {
    it('supports 2D Canvas context', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      expect(ctx).toBeInstanceOf(CanvasRenderingContext2D);
    });

    it('supports canvas image manipulation', () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = 100;
        canvas.height = 100;

        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 50, 50);

        const imageData = ctx.getImageData(0, 0, 100, 100);
        expect(imageData.width).toBe(100);
        expect(imageData.height).toBe(100);
      }
    });
  });
});
