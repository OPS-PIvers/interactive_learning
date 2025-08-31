import { describe, it, expect } from 'vitest';
import {
  createDefaultHotspot,
  reorderHotspots,
  validateHotspotPosition
} from '@/client/utils/hotspotUtils';
import { HotspotWalkthrough } from '@/shared/hotspotTypes';

describe('hotspotUtils', () => {
  describe('createDefaultHotspot', () => {
    it('creates hotspot with correct defaults', () => {
      const position = {
        desktop: { x: 100, y: 100, width: 48, height: 48 },
        tablet: { x: 80, y: 80, width: 40, height: 40 },
        mobile: { x: 60, y: 60, width: 32, height: 32 }
      };

      const hotspot = createDefaultHotspot(position, 0);

      expect(hotspot.type).toBe('hotspot');
      expect(hotspot.position).toEqual(position);
      expect(hotspot.sequenceIndex).toBe(0);
      expect(hotspot.content.title).toBe('Step 1');
      expect(hotspot.style.color).toBe('#2d3f89'); // OPS Primary Blue
      expect(hotspot.interaction.effect.type).toBe('spotlight');
    });

    it('generates unique IDs', () => {
      const position = {
        desktop: { x: 0, y: 0, width: 48, height: 48 },
        tablet: { x: 0, y: 0, width: 40, height: 40 },
        mobile: { x: 0, y: 0, width: 32, height: 32 }
      };

      const hotspot1 = createDefaultHotspot(position, 0);
      const hotspot2 = createDefaultHotspot(position, 0);

      expect(hotspot1.id).not.toBe(hotspot2.id);
    });
  });

  describe('reorderHotspots', () => {
    it('reorders hotspots according to new sequence', () => {
      const walkthrough: HotspotWalkthrough = {
        id: 'test',
        title: 'Test',
        description: '',
        backgroundMedia: { type: 'image', url: '', alt: '' },
        hotspots: [
          createDefaultHotspot({ desktop: { x: 0, y: 0, width: 48, height: 48 }, tablet: { x: 0, y: 0, width: 40, height: 40 }, mobile: { x: 0, y: 0, width: 32, height: 32 } }, 0),
          createDefaultHotspot({ desktop: { x: 100, y: 100, width: 48, height: 48 }, tablet: { x: 80, y: 80, width: 40, height: 40 }, mobile: { x: 60, y: 60, width: 32, height: 32 } }, 1),
          createDefaultHotspot({ desktop: { x: 200, y: 200, width: 48, height: 48 }, tablet: { x: 160, y: 160, width: 40, height: 40 }, mobile: { x: 120, y: 120, width: 32, height: 32 } }, 2)
        ],
        sequence: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPublished: false,
        creatorId: 'test'
      };

      // Set initial sequence
      walkthrough.sequence = walkthrough.hotspots.map(h => h.id);

      // Reverse the sequence
      const newSequence = [...walkthrough.sequence].reverse();
      const reordered = reorderHotspots(walkthrough, newSequence);

      expect(reordered.sequence).toEqual(newSequence);
      expect(reordered.hotspots[0].sequenceIndex).toBe(2);
      expect(reordered.hotspots[1].sequenceIndex).toBe(1);
      expect(reordered.hotspots[2].sequenceIndex).toBe(0);
    });
  });

  describe('validateHotspotPosition', () => {
    it('validates position within bounds', () => {
      const position = {
        desktop: { x: 100, y: 100, width: 48, height: 48 },
        tablet: { x: 80, y: 80, width: 40, height: 40 },
        mobile: { x: 60, y: 60, width: 32, height: 32 }
      };

      expect(validateHotspotPosition(position, 800, 600)).toBe(true);
    });

    it('invalidates position outside bounds', () => {
      const position = {
        desktop: { x: 800, y: 600, width: 48, height: 48 },
        tablet: { x: 640, y: 480, width: 40, height: 40 },
        mobile: { x: 480, y: 360, width: 32, height: 32 }
      };

      expect(validateHotspotPosition(position, 800, 600)).toBe(false);
    });
  });
});
