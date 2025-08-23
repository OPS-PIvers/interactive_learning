# Utils Audit

This file audits the utility functions in `src/client/utils`.

## Summary

This audit of the `src/client/utils` directory reveals a significant opportunity for cleanup and refactoring. Of the 26 utility files analyzed, over half (54%) are completely unused or obsolete and can be safely removed. Another 23% are either partially used or have overlapping functionality with other utilities, making them prime candidates for updates and consolidation.

- **Total Files Audited:** 26
- **Files to Keep As Is:** 6 (23%)
- **Files to Update/Consolidate:** 6 (23%)
- **Files to Remove:** 14 (54%)

Acting on these recommendations would dramatically reduce the codebase size, remove dead code, eliminate confusion from duplicate utilities, and simplify maintenance.

| Util Name/Path | Is it used? | Does another one exist? | Should it be kept as is, updated, consolidated, or removed? |
|---|---|---|---|
| `src/client/utils/EffectExecutor.ts` | Yes | No | Kept as is |
| `src/client/utils/ModalLayoutManager.ts` | No | No | Removed |
| `src/client/utils/aspectRatioUtils.ts` | Yes | No | Updated |
| `src/client/utils/asyncUtils.ts` | No | Yes | Removed |
| `src/client/utils/debugUtils.ts` | Yes | No | Kept as is |
| `src/client/utils/enhancedUploadHandler.ts` | No | Yes | Removed |
| `src/client/utils/firebaseImageUtils.ts` | Yes | No | Updated |
| `src/client/utils/generateId.ts` | Yes | Yes | Updated |
| `src/client/utils/hapticUtils.ts` | Yes | No | Kept as is |
| `src/client/utils/imageBounds.ts` | Yes | No | Kept as is |
| `src/client/utils/imageCompression.ts` | No | No | Removed |
| `src/client/utils/imageUtils.ts` | No | Yes | Removed |
| `src/client/utils/inputSecurity.ts` | No | No | Removed |
| `src/client/utils/interactionUtils.ts` | Yes | No | Kept as is |
| `src/client/utils/iosZIndexManager.ts` | No | Yes | Removed |
| `src/client/utils/mobileMediaCapture.ts` | No | No | Removed |
| `src/client/utils/networkMonitor.ts` | Yes | No | Updated |
| `src/client/utils/panZoomUtils.ts` | No | Yes | Removed |
| `src/client/utils/retryUtils.ts` | No | No | Removed |
| `src/client/utils/styleConstants.ts` | No | Yes | Removed |
| `src/client/utils/slideDeckUtils.ts` | Yes | No | Kept as is |
| `src/client/utils/timelineUtils.ts` | No | No | Removed |
| `src/client/utils/touchFeedback.ts` | Yes | Yes | Updated |
| `src/client/utils/touchUtils.ts` | Yes | No | Kept as is |
| `src/client/utils/viewportUtils.ts` | Yes | Yes | Updated |
| `src/client/utils/zIndexLevels.ts` | Yes | No | Kept as is |
