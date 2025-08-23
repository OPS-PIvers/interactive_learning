# Audit of `src/shared` Directory

This audit covers the files in the `src/shared` directory to identify their purpose, usage, and potential areas for cleanup and improvement.

---

### 1. `InteractionPresets.ts`

-   **Name/Path:** `src/shared/InteractionPresets.ts`
-   **Purpose:** Defines the 7 canonical interaction types and their settings.
-   **Used:** Yes, in `InteractionEditor.tsx` and `InteractionParameterPreview.tsx`.
-   **Duplicate:** No.
-   **Recommendation:** **Keep.** The file is clean, well-structured, and used appropriately.

---

### 2. `demoModuleData.ts`

-   **Name/Path:** `src/shared/demoModuleData.ts`
-   **Purpose:** Provides data for a demo module.
-   **Used:** Yes, in `App.tsx` for setting up a demo project.
-   **Duplicate:** No, but it's one of three files providing demo data.
-   **Recommendation:** **Consolidate.** This file should be merged with `demoSlideDeckData.ts` and `testDemoSlideDeck.ts` into a single, well-organized location for demo data, for example `src/shared/demos/`.

---

### 3. `demoSlideDeckData.ts`

-   **Name/Path:** `src/shared/demoSlideDeckData.ts`
-   **Purpose:** Exports a function `createDemoSlideDeck` to generate a demo slide deck.
-   **Used:** Yes, in `App.tsx`.
-   **Duplicate:** Yes. A function with the same name, `createDemoSlideDeck`, exists in `src/client/components/slides/DemoSlideDeck.ts`. This is confusing and should be resolved.
-   **Recommendation:** **Consolidate.** Merge with the other demo data files. The naming collision must be resolved. The function in `src/client/components/slides/DemoSlideDeck.ts` seems to be for a newer architecture and this one might be legacy.

---

### 4. `hotspotStylePresets.ts`

-   **Name/Path:** `src/shared/hotspotStylePresets.ts`
-   **Purpose:** Defines style and size presets for hotspots.
-   **Used:** Partially. `getResponsiveHotspotSizeClasses` is used, but `hotspotStylePresets`, `applyStylePreset`, `getHotspotSizeClasses`, and `getHotspotPixelDimensions` appear to be unused.
-   **Duplicate:** Yes, `getHotspotSizeClasses` is a near-identical duplicate of `getResponsiveHotspotSizeClasses`.
-   **Recommendation:** **Update.** Remove all unused exports and the duplicate function `getHotspotSizeClasses`.

---

### 5. `index.ts`

-   **Name/Path:** `src/shared/index.ts`
-   **Purpose:** A barrel file to re-export from other modules in `src/shared`.
-   **Used:** No. Imports are made directly from the files within `src/shared`.
-   **Duplicate:** No.
-   **Recommendation:** **Remove.** The file is unused. Alternatively, update all import paths to use this barrel file.

---

### 6. `interactiveTypes.ts`

-   **Name/Path:** `src/shared/interactiveTypes.ts`
-   **Purpose:** Defines various types related to interactions.
-   **Used:** Partially. Only `ViewerModes` seems to be imported from this file.
-   **Duplicate:** Yes. `PanZoomEvent` is also defined in `types.ts`. The file's purpose overlaps significantly with `types.ts` and `type-defs.ts`.
-   **Recommendation:** **Consolidate/Remove.** This file seems to be a partially adopted attempt to refactor `types.ts`. The used types should be moved to a definitive types file (like `slideTypes.ts`), and this file should be removed to eliminate confusion and duplication.

---

### 7. `migrationUtils.ts`

-   **Name/Path:** `src/shared/migrationUtils.ts`
-   **Purpose:** Provides utility functions to migrate data from a legacy format to the new slide-based format.
-   **Used:** Partially. `ensureProjectCompatibility` is used in `App.tsx`.
-   **Duplicate:** No.
-   **Recommendation:** **Update.** Remove the unused exported functions: `needsMigration` and `getCurrentBackgroundMedia`.

---

### 8. `slideTypes.ts`

-   **Name/Path:** `src/shared/slideTypes.ts`
-   **Purpose:** Contains the type definitions for the new slide-based architecture.
-   **Used:** Yes, heavily used throughout the application.
-   **Duplicate:** No, but it is the successor to `types.ts` and `type-defs.ts`. There is significant conceptual overlap.
-   **Recommendation:** **Keep.** This is a critical, core file for the new architecture. The long-term goal should be to migrate all legacy types to this file.

---

### 9. `testDemoSlideDeck.ts`

-   **Name/Path:** `src/shared/testDemoSlideDeck.ts`
-   **Purpose:** Creates a demo slide deck specifically for Playwright testing.
-   **Used:** Yes, in testing and demo components.
-   **Duplicate:** Yes, this is the third file that provides a demo slide deck.
-   **Recommendation:** **Consolidate.** Merge with `demoModuleData.ts` and `demoSlideDeckData.ts` into a single, well-organized location for demo data.

---

### 10. `themePresets.ts`

-   **Name/Path:** `src/shared/themePresets.ts`
-   **Purpose:** Defines a set of themes for the application.
-   **Used:** Yes, in the `useProjectTheme.tsx` hook.
-   **Duplicate:** No.
-   **Recommendation:** **Keep.** The file is well-structured and used correctly.

---

### 11. `type-defs.ts`

-   **Name/Path:** `src/shared/type-defs.ts`
-   **Purpose:** Contains type definitions for the legacy hotspot-based interaction system.
-   **Used:** Yes, widely used in legacy components.
-   **Duplicate:** Yes, significant overlap with `types.ts` and `slideTypes.ts`.
-   **Recommendation:** **Consolidate/Remove.** This file represents a legacy data model. A long-term effort should be made to migrate components using these types to the new `slideTypes.ts` model, and then this file should be removed.

---

### 12. `types.ts`

-   **Name/Path:** `src/shared/types.ts`
-   **Purpose:** Another collection of legacy type definitions and some utility functions.
-   **Used:** Yes, heavily used.
-   **Duplicate:** Yes, significant overlap with `type-defs.ts` and `slideTypes.ts`. It also contains utility functions (`detectVideoSource`, `extractYouTubeVideoId`) which should be in a `utils` file.
-   **Recommendation:** **Consolidate/Update.** Move the utility functions to a more appropriate location. Migrate the types to `slideTypes.ts` and eventually remove this file.

---

### Overall Summary & Recommendations

The `src/shared` directory is a critical part of the codebase, but it currently suffers from significant duplication and legacy code. There are two competing data models (legacy hotspot-based and new slide-based) living side-by-side, which is the root cause of most of the issues.

**Key recommendations:**
1.  **Consolidate Type Definitions:** There are three files for types (`types.ts`, `type-defs.ts`, `slideTypes.ts`). The codebase should standardize on `slideTypes.ts` and migrate all legacy types. This will be a significant effort but will greatly improve maintainability.
2.  **Consolidate Demo Data:** The three demo data files should be merged into a single, clearly organized location.
3.  **Remove Dead Code:** There are several unused functions and one completely unused file (`index.ts`) that should be removed.
4.  **Separate Concerns:** Utility functions should be moved out of type definition files.
