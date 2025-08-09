import { HotspotData } from './types';

/**
 * Coordinate Migration and Validation Utility
 * 
 * This utility provides functions to validate and migrate hotspot coordinates
 * that may have been created with the old inconsistent positioning system.
 * 
 * The new unified system ensures that hotspots appear in identical positions
 * regardless of which platform they were created on or viewed from.
 */

export interface CoordinateValidationResult {
  isValid: boolean;
  issues: string[];
  migrated?: HotspotData;
}

/**
 * Validates hotspot coordinates and returns migration recommendations
 */
export function validateHotspotCoordinates(hotspot: HotspotData): CoordinateValidationResult {
  const issues: string[] = [];
  let isValid = true;
  let migrated: HotspotData | undefined;

  // Check for valid coordinate ranges (0-100%)
  if (hotspot.x < 0 || hotspot.x > 100) {
    issues.push(`X coordinate ${hotspot.x} is outside valid range (0-100%)`);
    isValid = false;
  }

  if (hotspot.y < 0 || hotspot.y > 100) {
    issues.push(`Y coordinate ${hotspot.y} is outside valid range (0-100%)`);
    isValid = false;
  }

  // Check for suspicious coordinates that might indicate old positioning issues
  // Hotspots near the extreme edges might have been created with incorrect positioning
  if (hotspot.y < 5) {
    issues.push(`Y coordinate ${hotspot.y} is very close to top edge - may indicate mobile editor positioning issue`);
  }

  if (hotspot.y > 95) {
    issues.push(`Y coordinate ${hotspot.y} is very close to bottom edge - may need validation`);
  }

  // Check for coordinates that are exactly 0 or 100 (unusual but possible edge case)
  if (hotspot.x === 0 || hotspot.x === 100 || hotspot.y === 0 || hotspot.y === 100) {
    issues.push(`Coordinates are at exact edge (${hotspot.x}, ${hotspot.y}) - validate intended position`);
  }

  // If coordinates are invalid, clamp them to valid ranges
  if (!isValid) {
    migrated = {
      ...hotspot,
      x: Math.max(0, Math.min(100, hotspot.x)),
      y: Math.max(0, Math.min(100, hotspot.y))
    };
  }

  const result: CoordinateValidationResult = {
    isValid,
    issues
  };
  if (migrated) {
    result.migrated = migrated;
  }
  return result;
}

/**
 * Validates an array of hotspots and returns summary report
 */
export function validateProjectHotspots(hotspots: HotspotData[]): {
  totalHotspots: number;
  validHotspots: number;
  invalidHotspots: number;
  suspiciousHotspots: number;
  detailedResults: Array<{hotspot: HotspotData;validation: CoordinateValidationResult;}>;
} {
  const detailedResults = hotspots.map((hotspot) => ({
    hotspot,
    validation: validateHotspotCoordinates(hotspot)
  }));

  const validHotspots = detailedResults.filter((r) => r.validation.isValid && r.validation.issues.length === 0).length;
  const invalidHotspots = detailedResults.filter((r) => !r.validation.isValid).length;
  const suspiciousHotspots = detailedResults.filter((r) => r.validation.isValid && r.validation.issues.length > 0).length;

  return {
    totalHotspots: hotspots.length,
    validHotspots,
    invalidHotspots,
    suspiciousHotspots,
    detailedResults
  };
}

/**
 * Automatically migrates hotspots with invalid coordinates
 */
export function migrateInvalidHotspots(hotspots: HotspotData[]): {
  migrated: HotspotData[];
  changesMade: boolean;
  migrationLog: string[];
} {
  const migrationLog: string[] = [];
  let changesMade = false;

  const migrated = hotspots.map((hotspot) => {
    const validation = validateHotspotCoordinates(hotspot);

    if (!validation.isValid && validation.migrated) {
      migrationLog.push(
        `Migrated hotspot "${hotspot.title}" (${hotspot.id}): ` +
        `(${hotspot.x}, ${hotspot.y}) → (${validation.migrated.x}, ${validation.migrated.y})`
      );
      changesMade = true;
      return validation.migrated;
    }

    return hotspot;
  });

  return {
    migrated,
    changesMade,
    migrationLog
  };
}

/**
 * Utility to log validation results for debugging
 */
export function logCoordinateValidation(hotspots: HotspotData[], _projectName?: string): void {
  const results = validateProjectHotspots(hotspots);







  if (results.invalidHotspots > 0 || results.suspiciousHotspots > 0) {

    results.detailedResults.
    filter((r) => !r.validation.isValid || r.validation.issues.length > 0).
    forEach(({ hotspot: _hotspot, validation }) => {

    });
  }
}