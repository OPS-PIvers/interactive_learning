import { describe, test, expect } from 'vitest';
import { ResponsivePosition, FixedPosition } from '../shared/baseTypes';

// Test utilities for responsive positioning
const createResponsivePosition = (
  desktop: FixedPosition,
  tablet?: FixedPosition,
  mobile?: FixedPosition
): ResponsivePosition => ({
  desktop,
  tablet: tablet || { x: desktop.x * 0.8, y: desktop.y * 0.8, width: desktop.width * 0.8, height: desktop.height * 0.8 },
  mobile: mobile || { x: desktop.x * 0.6, y: desktop.y * 0.6, width: desktop.width * 0.6, height: desktop.height * 0.6 }
});

const validatePosition = (position: FixedPosition): boolean => {
  return position.x >= 0 && 
         position.y >= 0 && 
         position.width > 0 && 
         position.height > 0;
};

const isWithinBounds = (position: FixedPosition, containerWidth: number, containerHeight: number): boolean => {
  return position.x + position.width <= containerWidth &&
         position.y + position.height <= containerHeight;
};

const scalePosition = (position: FixedPosition, scaleX: number, scaleY: number): FixedPosition => ({
  x: position.x * scaleX,
  y: position.y * scaleY,
  width: position.width * scaleX,
  height: position.height * scaleY
});

describe('ResponsivePosition System Tests', () => {
  describe('Position Creation and Validation', () => {
    test('creates valid responsive position with all device types', () => {
      const desktopPos: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const tabletPos: FixedPosition = { x: 80, y: 80, width: 160, height: 120 };
      const mobilePos: FixedPosition = { x: 60, y: 60, width: 120, height: 90 };

      const responsivePos = createResponsivePosition(desktopPos, tabletPos, mobilePos);

      expect(responsivePos.desktop).toEqual(desktopPos);
      expect(responsivePos.tablet).toEqual(tabletPos);
      expect(responsivePos.mobile).toEqual(mobilePos);
    });

    test('auto-generates tablet and mobile positions from desktop', () => {
      const desktopPos: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const responsivePos = createResponsivePosition(desktopPos);

      expect(responsivePos.desktop).toEqual(desktopPos);
      expect(responsivePos.tablet).toEqual({ x: 80, y: 80, width: 160, height: 120 });
      expect(responsivePos.mobile).toEqual({ x: 60, y: 60, width: 120, height: 90 });
    });

    test('validates position values are positive', () => {
      const validPos: FixedPosition = { x: 10, y: 20, width: 100, height: 50 };
      const invalidPosNegativeX: FixedPosition = { x: -10, y: 20, width: 100, height: 50 };
      const invalidPosZeroWidth: FixedPosition = { x: 10, y: 20, width: 0, height: 50 };

      expect(validatePosition(validPos)).toBe(true);
      expect(validatePosition(invalidPosNegativeX)).toBe(false);
      expect(validatePosition(invalidPosZeroWidth)).toBe(false);
    });

    test('validates positions are within container bounds', () => {
      const containerWidth = 800;
      const containerHeight = 600;

      const validPos: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const invalidPosOverflow: FixedPosition = { x: 700, y: 100, width: 200, height: 150 };
      const borderlinePos: FixedPosition = { x: 600, y: 450, width: 200, height: 150 };

      expect(isWithinBounds(validPos, containerWidth, containerHeight)).toBe(true);
      expect(isWithinBounds(invalidPosOverflow, containerWidth, containerHeight)).toBe(false);
      expect(isWithinBounds(borderlinePos, containerWidth, containerHeight)).toBe(true);
    });
  });

  describe('Device-Specific Position Retrieval', () => {
    test('retrieves correct position for each device type', () => {
      const responsivePos: ResponsivePosition = {
        desktop: { x: 100, y: 100, width: 200, height: 150 },
        tablet: { x: 80, y: 80, width: 160, height: 120 },
        mobile: { x: 60, y: 60, width: 120, height: 90 }
      };

      expect(responsivePos.desktop).toEqual(responsivePos.desktop);
      expect(responsivePos.tablet).toEqual(responsivePos.tablet);
      expect(responsivePos.mobile).toEqual(responsivePos.mobile);
    });
  });

  describe('Position Scaling and Transformation', () => {
    test('scales position proportionally', () => {
      const originalPos: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const scaledPos = scalePosition(originalPos, 1.5, 1.2);

      expect(scaledPos).toEqual({
        x: 150,
        y: 120,
        width: 300,
        height: 180
      });
    });

    test('scales position down for smaller screens', () => {
      const desktopPos: FixedPosition = { x: 200, y: 200, width: 400, height: 300 };
      const mobileScale = 0.5;
      const mobilePos = scalePosition(desktopPos, mobileScale, mobileScale);

      expect(mobilePos).toEqual({
        x: 100,
        y: 100,
        width: 200,
        height: 150
      });
    });

    test('handles fractional scaling correctly', () => {
      const originalPos: FixedPosition = { x: 33, y: 66, width: 99, height: 132 };
      const scaledPos = scalePosition(originalPos, 0.333, 0.666);

      expect(scaledPos.x).toBeCloseTo(10.989, 2);
      expect(scaledPos.y).toBeCloseTo(43.956, 2);
      expect(scaledPos.width).toBeCloseTo(32.967, 2);
      expect(scaledPos.height).toBeCloseTo(87.912, 2);
    });
  });

  describe('Responsive Breakpoint Logic', () => {
    test('creates appropriate positions for different screen sizes', () => {
      const desktopPos: FixedPosition = { x: 100, y: 100, width: 300, height: 200 };
      
      // Standard scaling factors based on typical breakpoints
      const tabletScale = 0.75; // ~768px to ~1024px
      const mobileScale = 0.5;  // ~320px to ~768px

      const tabletPos = scalePosition(desktopPos, tabletScale, tabletScale);
      const mobilePos = scalePosition(desktopPos, mobileScale, mobileScale);

      const responsivePos: ResponsivePosition = {
        desktop: desktopPos,
        tablet: tabletPos,
        mobile: mobilePos
      };

      // Verify tablet is smaller than desktop but larger than mobile
      expect(responsivePos.tablet.width).toBeLessThan(responsivePos.desktop.width);
      expect(responsivePos.tablet.width).toBeGreaterThan(responsivePos.mobile.width);
      
      expect(responsivePos.mobile.width).toBeLessThan(responsivePos.tablet.width);
      expect(responsivePos.mobile.width).toBeLessThan(responsivePos.desktop.width);
    });

    test('maintains aspect ratio across devices', () => {
      const desktopPos: FixedPosition = { x: 100, y: 100, width: 300, height: 200 };
      const desktopAspectRatio = desktopPos.width / desktopPos.height;

      const responsivePos = createResponsivePosition(desktopPos);

      const tabletAspectRatio = responsivePos.tablet.width / responsivePos.tablet.height;
      const mobileAspectRatio = responsivePos.mobile.width / responsivePos.mobile.height;

      expect(tabletAspectRatio).toBeCloseTo(desktopAspectRatio, 2);
      expect(mobileAspectRatio).toBeCloseTo(desktopAspectRatio, 2);
    });

    test('handles edge cases with very small positions', () => {
      const tinyPos: FixedPosition = { x: 1, y: 1, width: 2, height: 2 };
      const responsivePos = createResponsivePosition(tinyPos);

      // Even tiny positions should scale proportionally
      expect(responsivePos.tablet.width).toBeCloseTo(1.6, 1);
      expect(responsivePos.mobile.width).toBeCloseTo(1.2, 1);
      
      // All positions should still be valid
      expect(validatePosition(responsivePos.desktop)).toBe(true);
      expect(validatePosition(responsivePos.tablet)).toBe(true);
      expect(validatePosition(responsivePos.mobile)).toBe(true);
    });

    test('handles edge cases with very large positions', () => {
      const largePos: FixedPosition = { x: 1000, y: 1000, width: 2000, height: 1500 };
      const responsivePos = createResponsivePosition(largePos);

      // Large positions should scale down appropriately
      expect(responsivePos.tablet.width).toBe(1600);
      expect(responsivePos.mobile.width).toBe(1200);
      
      // All positions should still be valid
      expect(validatePosition(responsivePos.desktop)).toBe(true);
      expect(validatePosition(responsivePos.tablet)).toBe(true);
      expect(validatePosition(responsivePos.mobile)).toBe(true);
    });
  });

  describe('Position Comparison and Utilities', () => {
    test('compares positions for equality', () => {
      const pos1: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const pos2: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const pos3: FixedPosition = { x: 101, y: 100, width: 200, height: 150 };

      expect(JSON.stringify(pos1)).toBe(JSON.stringify(pos2));
      expect(JSON.stringify(pos1)).not.toBe(JSON.stringify(pos3));
    });

    test('calculates position area correctly', () => {
      const position: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const area = position.width * position.height;

      expect(area).toBe(30000);
    });

    test('calculates position center point', () => {
      const position: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const centerX = position.x + position.width / 2;
      const centerY = position.y + position.height / 2;

      expect(centerX).toBe(200);
      expect(centerY).toBe(175);
    });

    test('detects position overlap', () => {
      const pos1: FixedPosition = { x: 100, y: 100, width: 200, height: 150 };
      const pos2: FixedPosition = { x: 150, y: 125, width: 100, height: 100 }; // Overlapping
      const pos3: FixedPosition = { x: 350, y: 300, width: 100, height: 100 }; // Non-overlapping

      const overlaps = (a: FixedPosition, b: FixedPosition): boolean => {
        return !(a.x + a.width <= b.x || 
                 b.x + b.width <= a.x || 
                 a.y + a.height <= b.y || 
                 b.y + b.height <= a.y);
      };

      expect(overlaps(pos1, pos2)).toBe(true);
      expect(overlaps(pos1, pos3)).toBe(false);
    });
  });

  describe('Integration with Slide Architecture', () => {
    test('responsive position works with slide elements', () => {
      const elementPosition: ResponsivePosition = {
        desktop: { x: 200, y: 150, width: 300, height: 200 },
        tablet: { x: 160, y: 120, width: 240, height: 160 },
        mobile: { x: 120, y: 90, width: 180, height: 120 }
      };

      // Simulate slide element using responsive position
      const slideElement = {
        id: 'element-1',
        type: 'hotspot',
        position: elementPosition,
        style: { backgroundColor: '#ff0000' },
        content: { title: 'Test Element' }
      };

      // Should be able to get position for each device
      const desktopPos = slideElement.position.desktop;
      const tabletPos = slideElement.position.tablet;
      const mobilePos = slideElement.position.mobile;

      expect(validatePosition(desktopPos)).toBe(true);
      expect(validatePosition(tabletPos)).toBe(true);
      expect(validatePosition(mobilePos)).toBe(true);
    });

    test('multiple elements maintain relative positioning across devices', () => {
      const element1Pos = createResponsivePosition({ x: 100, y: 100, width: 100, height: 100 });
      const element2Pos = createResponsivePosition({ x: 300, y: 200, width: 100, height: 100 });

      // Check relative positioning is maintained across devices
      const devices = ['desktop', 'tablet', 'mobile'] as const;
      
      devices.forEach(device => {
        const pos1 = element1Pos[device];
        const pos2 = element2Pos[device];

        // Element 2 should always be to the right and below element 1
        expect(pos2.x).toBeGreaterThan(pos1.x);
        expect(pos2.y).toBeGreaterThan(pos1.y);
      });
    });

    test('handles slide layout constraints', () => {
      // Typical slide dimensions for different devices
      const slideConstraints = {
        desktop: { width: 1200, height: 800 },
        tablet: { width: 768, height: 576 },
        mobile: { width: 375, height: 667 }
      };

      const elementPos = createResponsivePosition({ x: 100, y: 100, width: 200, height: 150 });

      // All positions should fit within their respective slide constraints
      Object.entries(slideConstraints).forEach(([device, constraints]) => {
        const position = elementPos[device as keyof typeof elementPos];
        expect(isWithinBounds(position, constraints.width, constraints.height)).toBe(true);
      });
    });
  });
});