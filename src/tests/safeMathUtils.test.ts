// src/tests/safeMathUtils.test.ts
import { 
  safeDivide, 
  safePercentage, 
  safePercentageDelta,
  isValidImageBounds,
  safePositionToPercentage,
  safePercentageToPosition,
  clamp,
  sanitizeHotspotPosition,
  hasValidDimensions
} from '../lib/safeMathUtils';

describe('SafeMathUtils', () => {
  describe('safeDivide', () => {
    test('handles zero divisor', () => {
      expect(safeDivide(10, 0)).toBe(0);
      expect(safeDivide(10, 0, -1)).toBe(-1);
    });

    test('handles invalid numbers', () => {
      expect(safeDivide(Infinity, 10)).toBe(0);
      expect(safeDivide(10, NaN)).toBe(0);
    });

    test('performs normal division', () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(100, 4)).toBe(25);
    });
  });

  describe('safePercentage', () => {
    test('handles zero total', () => {
      expect(safePercentage(50, 0)).toBe(0);
      expect(safePercentage(50, 0, -1)).toBe(-1);
    });

    test('calculates percentage correctly', () => {
      expect(safePercentage(50, 100)).toBe(50);
      expect(safePercentage(25, 100)).toBe(25);
    });

    test('clamps to 0-100 range', () => {
      expect(safePercentage(150, 100)).toBe(100);
      expect(safePercentage(-10, 100)).toBe(0);
    });
  });

  describe('safePercentageDelta', () => {
    test('calculates x-axis delta', () => {
      const bounds = { width: 100, height: 50 };
      expect(safePercentageDelta(10, bounds, 'x')).toBe(10);
    });

    test('calculates y-axis delta', () => {
      const bounds = { width: 100, height: 50 };
      expect(safePercentageDelta(10, bounds, 'y')).toBe(20);
    });

    test('handles zero dimensions', () => {
      const bounds = { width: 0, height: 50 };
      expect(safePercentageDelta(10, bounds, 'x')).toBe(0);
    });
  });

  describe('isValidImageBounds', () => {
    test('validates valid bounds', () => {
      expect(isValidImageBounds({ width: 100, height: 100 })).toBe(true);
      expect(isValidImageBounds({ width: 1, height: 1 })).toBe(true);
    });

    test('rejects invalid bounds', () => {
      expect(isValidImageBounds({ width: 0, height: 100 })).toBe(false);
      expect(isValidImageBounds({ width: 100, height: 0 })).toBe(false);
      expect(isValidImageBounds({ width: -1, height: 100 })).toBe(false);
      expect(isValidImageBounds(null)).toBe(false);
      expect(isValidImageBounds(undefined)).toBe(false);
      expect(isValidImageBounds({ width: Infinity, height: 100 })).toBe(false);
    });
  });

  describe('safePositionToPercentage', () => {
    test('converts position to percentage', () => {
      const position = { x: 50, y: 25 };
      const bounds = { width: 100, height: 50 };
      const result = safePositionToPercentage(position, bounds);
      expect(result).toEqual({ x: 50, y: 50 });
    });

    test('handles invalid bounds', () => {
      const position = { x: 50, y: 25 };
      const invalidBounds = { width: 0, height: 50 };
      const result = safePositionToPercentage(position, invalidBounds);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('safePercentageToPosition', () => {
    test('converts percentage to position', () => {
      const percentage = { x: 50, y: 50 };
      const bounds = { width: 100, height: 50 };
      const result = safePercentageToPosition(percentage, bounds);
      expect(result).toEqual({ x: 50, y: 25 });
    });

    test('handles invalid bounds', () => {
      const percentage = { x: 50, y: 50 };
      const invalidBounds = { width: 0, height: 50 };
      const result = safePercentageToPosition(percentage, invalidBounds);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('clamp', () => {
    test('clamps values within range', () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(150, 0, 100)).toBe(100);
    });
  });

  describe('sanitizeHotspotPosition', () => {
    test('sanitizes valid position', () => {
      const position = { x: 50, y: 75 };
      const result = sanitizeHotspotPosition(position);
      expect(result).toEqual({ x: 50, y: 75 });
    });

    test('clamps out-of-range values', () => {
      const position = { x: 150, y: -10 };
      const result = sanitizeHotspotPosition(position);
      expect(result).toEqual({ x: 100, y: 0 });
    });

    test('handles invalid numbers', () => {
      const position = { x: NaN, y: Infinity };
      const result = sanitizeHotspotPosition(position);
      expect(result).toEqual({ x: 0, y: 0 });
    });
  });

  describe('hasValidDimensions', () => {
    test('validates valid dimensions', () => {
      expect(hasValidDimensions({ width: 100, height: 100 })).toBe(true);
      expect(hasValidDimensions({ width: 1, height: 1 })).toBe(true);
    });

    test('rejects invalid dimensions', () => {
      expect(hasValidDimensions({ width: 0, height: 100 })).toBe(false);
      expect(hasValidDimensions({ width: 100, height: 0 })).toBe(false);
      expect(hasValidDimensions({ width: -1, height: 100 })).toBe(false);
      expect(hasValidDimensions(null)).toBe(false);
      expect(hasValidDimensions(undefined)).toBe(false);
      expect(hasValidDimensions({ width: Infinity, height: 100 })).toBe(false);
      expect(hasValidDimensions({ width: NaN, height: 100 })).toBe(false);
    });
  });

  // Integration test simulating the HotspotViewer drag scenario
  describe('Integration: HotspotViewer drag scenario', () => {
    test('handles normal drag operation', () => {
      const startPosition = { x: 50, y: 50 };
      const dragDelta = { x: 10, y: -5 };
      const imageBounds = { width: 200, height: 100 };

      const deltaXPercent = safePercentageDelta(dragDelta.x, imageBounds, 'x');
      const deltaYPercent = safePercentageDelta(dragDelta.y, imageBounds, 'y');

      const newPosition = {
        x: clamp(startPosition.x + deltaXPercent, 0, 100),
        y: clamp(startPosition.y + deltaYPercent, 0, 100)
      };

      expect(newPosition.x).toBe(55); // 50 + (10/200)*100 = 55
      expect(newPosition.y).toBe(45); // 50 + (-5/100)*100 = 45
    });

    test('handles zero dimension bounds during drag', () => {
      const startPosition = { x: 50, y: 50 };
      const dragDelta = { x: 10, y: -5 };
      const imageBounds = { width: 0, height: 100 }; // Zero width

      // This should not crash and should return safe values
      expect(() => {
        const deltaXPercent = safePercentageDelta(dragDelta.x, imageBounds, 'x');
        const deltaYPercent = safePercentageDelta(dragDelta.y, imageBounds, 'y');

        const newPosition = {
          x: clamp(startPosition.x + deltaXPercent, 0, 100),
          y: clamp(startPosition.y + deltaYPercent, 0, 100)
        };

        // X should remain unchanged due to zero width
        expect(newPosition.x).toBe(50);
        // Y should be calculated normally
        expect(newPosition.y).toBe(45);
      }).not.toThrow();
    });
  });
});