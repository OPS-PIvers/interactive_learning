# Constants Audit

This file audits the constants defined in `src/client/constants/`.

## Summary

- **Total Files Audited:** 1
- **Files Kept As Is:** 0 (0%)
- **Files Updated:** 0 (0%)
- **Files Consolidated:** 0 (0%)
- **Files Removed:** 1 (100%)

| File Name/Path | Description | Usage Count | Status | Recommendation |
|---|---|---|---|---|
| `src/client/constants/interactionConstants.ts` | Defines UI interaction constants like z-indexes, zoom limits, and animation timings. | 0 | Remove | This file is entirely unused and appears to be legacy code. All constants defined within are not referenced anywhere in the codebase. A more modern and comprehensive z-index management system exists at `src/client/utils/zIndexLevels.ts`. |

## Overall Recommendations

1. **Remove the entire file** `src/client/constants/interactionConstants.ts`. It is unused legacy code.
2. **Consolidate any future constants** into appropriate existing files or create new, more specific constant files as needed, rather than a single monolithic file.

## Implementation Notes

- The file `src/client/constants/interactionConstants.ts` can be safely deleted.
- No other changes are required.
- The `Z_INDEX` constants that were in this file have been superseded by the far more robust system in `src/client/utils/zIndexLevels.ts`.
