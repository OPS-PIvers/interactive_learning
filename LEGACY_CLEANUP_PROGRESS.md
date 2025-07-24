# Legacy Event Type Cleanup Progress

## Completed Tasks
- ✅ Removed HIDE_HOTSPOT from InteractionType enum (was incorrectly added, then properly removed)
- ✅ Updated StreamlinedHotspotEditor.tsx to replace legacy references:
  - PULSE_HOTSPOT → SPOTLIGHT
  - HIDE_HOTSPOT → Removed (consolidated into SPOTLIGHT)

## Remaining Legacy References to Clean Up

### High Priority Files (17+ references each):
1. **EditableEventCard.tsx** - Multiple HIGHLIGHT_HOTSPOT references in switch cases
2. **HotspotEditorModal.tsx** - PULSE_HOTSPOT references in event type options
3. **InteractiveViewer.tsx** - PULSE_HOTSPOT and PULSE_HIGHLIGHT references
4. **ImageEditCanvas.tsx** - HIGHLIGHT_HOTSPOT references in switch cases

### Medium Priority Files:
- HotspotEditorToolbar.tsx (PULSE_HOTSPOT references)
- MobileHotspotEditor.tsx (PULSE_HOTSPOT references)
- Desktop/Mobile EventRenderer components (HIDE_HOTSPOT references)
- Mobile EventSettings and EventCard components

### Legacy Type Mapping:
- `PULSE_HOTSPOT` → `SPOTLIGHT`
- `HIGHLIGHT_HOTSPOT` → `SPOTLIGHT`  
- `PULSE_HIGHLIGHT` → `SPOTLIGHT`
- `HIDE_HOTSPOT` → Remove (no direct equivalent)
- `SHOW_HOTSPOT` → Remove or replace with appropriate modern type

### Test Files:
- Multiple test files have hardcoded legacy references that need updating
- Tests in `timelineEventExecution.test.ts` need HIDE_HOTSPOT references removed

## Migration Considerations:
- Migration files (`migration.ts`) correctly handle string literal conversions
- DataMigration.ts has SHOW_HOTSPOT fallback references to review
- All component logic should work with modern InteractionType enum values only

## Next Steps:
1. Update remaining high-priority component files
2. Update test files to use modern event types
3. Run full test suite to validate changes
4. Remove any remaining hardcoded legacy references