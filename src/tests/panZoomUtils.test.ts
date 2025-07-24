import { calculateCenteringTransform } from '../client/utils/panZoomUtils';

describe('calculateCenteringTransform', () => {
  it('should calculate the correct translation to center a hotspot', () => {
    const containerDims = { width: 1000, height: 800 };
    const imageNaturalDims = { width: 2000, height: 1600 };
    const hotspot = { x: 0.25, y: 0.5 }; // Pixel equivalent: (500, 800)
    const targetScale = 2;

    const expectedTransform = {
      x: (1000 / 2) - (500 * 2), // 500 - 1000 = -500
      y: (800 / 2) - (800 * 2),  // 400 - 1600 = -1200
    };

    const result = calculateCenteringTransform(hotspot, targetScale, imageNaturalDims, containerDims);

    expect(result.x).toBe(expectedTransform.x);
    expect(result.y).toBe(expectedTransform.y);
  });
});
