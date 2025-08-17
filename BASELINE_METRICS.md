# Baseline Metrics Report (Phase 0)

This document captures the baseline metrics for the ExpliCoLearning application before the start of the rebuild project, as outlined in Phase 0 of the `IMPROVED_REBUILD_IMPLEMENTATION_PLAN.md`.

**Date of Report:** 2025-08-17

## 1. Codebase & Architecture Metrics

### 1.1. Component Count
- **Total React Components:** 132
  - *Method: Counted `.tsx` files in `src/client/components`.*
  - *Note: This confirms the number cited in the rebuild plan.*

### 1.2. Architectural Patterns
- **Legacy Mobile/Desktop Components:** 0 files found with `Mobile` or `Desktop` naming conventions. The codebase uses `Responsive` components, adhering to the unified architecture naming scheme.
- **Circular Dependencies:** 0 found.
  - *Method: Ran `npm run lint:circular`.*

### 1.3. Type Safety
- **TypeScript Errors:** 0 found.
  - *Method: Ran `npm run typecheck`.*

## 2. Testing Metrics

### 2.1. Test Coverage
- **Statements:** 12.0%
- **Branch:** 51.07%
- **Functions:** 21.21%
- **Lines:** 12.0%
  - *Method: Ran `npm run test:run -- --coverage` after configuring Vitest for coverage reports.*
  - *Note: The rebuild plan's target is >95%.*

## 3. Build & Performance Metrics

### 3.1. Production Bundle Size
- **Total JS Bundle Size:** ~1.37 MB
- **Largest Bundles:**
  - `firebase.js`: 644.69 kB
  - `react.js`: 211.17 kB
  - `editor-core.js`: 126.57 kB
  - `slide-components.js`: 126.34 kB
  - *Method: Ran `npm run build` and summarized the output.*

### 3.2. Build Warnings
- The production build process generated numerous `[unsafe-chain]` warnings from the TDZ Detection tool, indicating potential runtime errors in the existing codebase.

## 4. Automated Audits

### 4.1. Playwright MCP Configuration
- **Status:** ✅ Passed (4/5 checks)
  - *Note: The single failed check was for a VS Code-specific file (`.vscode/mcp.json`) and is not relevant to the application's functionality.*

## 5. User Workflow Analysis

### 5.1. Click & Step Counts
- **Status:** 🔴 **Requires Manual Collection**
- **Finding:** An analysis of the project's `scripts/` directory revealed that there are **no existing end-to-end automated tests** that simulate user interaction for the five key workflows (Create Project, Add Hotspot, Preview, Publish, Share).
- **Action Required:** The baseline click and step counts for these workflows must be established manually by a human tester using a browser. Existing scripts bypass the UI and interact directly with the database or perform simple smoke tests.

---

## Summary of Key Baseline Metrics

| Category | Metric | Value | Target (from Rebuild Plan) |
|---|---|---|---|
| Codebase | Component Count | 132 | ~25-30 |
| Testing | Test Coverage (Lines) | 12.0% | > 95% |
| Performance | JS Bundle Size | ~1.37 MB | < 2.0s LCP (related) |
| Workflows | Click Counts | Manual Collection Needed | 50% Reduction |
| Code Quality | TypeScript Errors | 0 | 0 |
| Code Quality | Circular Dependencies | 0 | 0 |
| Code Quality | Build Warnings | Present (TDZ) | None |
