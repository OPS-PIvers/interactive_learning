# Remaining Audits Priority List

Based on the existing audits (components, hooks, utils, lib, contexts, shared), here are the remaining areas that should be audited in priority order.

## How to Conduct Each Audit

For each audit, follow this process:

1. **Create audit file** - Use the naming pattern `[directory]_audit.md` (e.g., `tests_audit.md`)
2. **Analyze files systematically** - Use `LS` and `Read` tools to examine each file
3. **Document findings** - Use the standard audit table format (see examples below)
4. **Provide recommendations** - Mark files as Keep, Update, Consolidate, or Remove
5. **Include summary** - Add statistics and overall impact assessment
6. **Execute cleanup** - Implement recommended changes where appropriate

## High Priority

### 1. **Scripts Directory Audit** (`/scripts/`)
- **Priority**: High
- **Rationale**: Contains 20+ utility and testing scripts. Many appear to be legacy or development-only scripts that may no longer be needed.
- **Scope**: Automation scripts, testing utilities, MCP integration, Firebase utilities
- **Impact**: Medium-High - affects development workflow and automation

### 2. **Configuration Files Audit** (root level)
- **Priority**: High
- **Rationale**: Configuration files directly impact build, testing, and deployment. Need to ensure they're optimized and not conflicting.
- **Scope**: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `tailwind.config.js`, `eslint.config.js`, `firebase.json`, `firestore.rules`, `storage.rules`
- **Impact**: High - affects build performance and application behavior

## Medium Priority

### 4. **Client Assets Audit** (`src/client/assets/`)
- **Priority**: Medium
- **Rationale**: Assets can accumulate over time. Need to identify unused images and optimize file sizes.
- **Scope**: Image files, CLAUDE.md documentation
- **Impact**: Medium - affects bundle size and load performance

### 5. **Client Styles Audit** (`src/client/styles/`)
- **Priority**: Medium
- **Rationale**: CSS files can contain duplicate or unused styles. Need consolidation analysis.
- **Scope**: Global styles, component-specific CSS, custom scrollbar styles, high-contrast styles
- **Impact**: Medium - affects styling consistency and bundle size

### 6. **Client Constants Audit** (`src/client/constants/`)
- **Priority**: Medium
- **Rationale**: Constants should be centralized and not duplicated across the codebase.
- **Scope**: `interactionConstants.ts` and any other constant definitions
- **Impact**: Medium - affects maintainability

### 7. **Shared Demos Directory Audit** (`src/shared/demos/`)
- **Priority**: Medium
- **Rationale**: Demo data appears scattered across multiple locations. Need consolidation as mentioned in shared audit.
- **Scope**: Demo data files that may duplicate functionality from other demo files
- **Impact**: Medium - affects demo consistency and maintenance

## Lower Priority

### 8. **Documentation Audit** (`docs/`, root-level `.md` files)
- **Priority**: Low-Medium
- **Rationale**: Documentation should be current and accurate. Outdated docs can mislead developers.
- **Scope**: `README.md`, `docs/AGENTS.md`, `docs/GEMINI.md`, and any other documentation
- **Impact**: Low-Medium - affects developer onboarding and maintenance

### 10. **Vite Plugins Audit** (`/vite-plugins/`)
- **Priority**: Low
- **Rationale**: Custom Vite plugins should be reviewed for necessity and performance impact.
- **Scope**: `tdz-detection.js` and any other custom plugins
- **Impact**: Low - affects build process

### 11. **E2E Directory Audit** (`/e2e/`)
- **Priority**: Low
- **Rationale**: End-to-end tests are important but appear to be managed separately from main test suite.
- **Scope**: Playwright or other E2E test configurations and files
- **Impact**: Low - affects integration testing

### 12. **Logs Directory Cleanup** (`/logs/`)
- **Priority**: Very Low
- **Rationale**: Log files should not be committed to repository and directory may contain stale logs.
- **Scope**: Development logs, test outputs, build logs
- **Impact**: Very Low - housekeeping only

## Audit Completion Status

- ✅ Components (`src/client/components/`) - **Complete**
- ✅ Hooks (`src/client/hooks/`) - **Complete**  
- ✅ Utils (`src/client/utils/`) - **Complete** (with significant cleanup done)
- ✅ Lib (`src/lib/`) - **Complete**
- ⚠️ Contexts (`src/client/contexts/`) - **Started** (incomplete analysis)
- ✅ Shared (`src/shared/`) - **Complete** (with consolidation recommendations)
- ✅ Tests (`src/tests/`) - **Complete**
- ⏳ Scripts (`/scripts/`) - **High Priority**
- ⏳ Configuration Files - **High Priority**
- ⏳ Remaining directories - **Medium/Low Priority**

## Next Steps

1. **Follow with Scripts Directory Audit** - Clean up development/automation tools
2. **Configuration Files Review** - Ensure optimal build and deployment settings
3. **Work through medium priority items** - Assets, styles, constants
4. **Complete lower priority audits** - Documentation and configuration cleanup

## Estimated Impact

- **High Priority Audits**: Could reduce codebase size by 15-25% and improve build performance
- **Medium Priority Audits**: Additional 5-10% optimization and better maintainability
- **Low Priority Audits**: Housekeeping and developer experience improvements

This prioritization focuses on areas with the highest impact on code quality, performance, and maintainability while building on the excellent foundation already established by the completed audits.

## Expected Audit Files to Create

Based on this priority list, the following audit files should be created:

### High Priority Files
1. `tests_audit.md` - Comprehensive test coverage and redundancy analysis
2. `scripts_audit.md` - Development and automation scripts review
3. `config_audit.md` - Build and deployment configuration analysis

### Medium Priority Files
4. `assets_audit.md` - Client assets usage and optimization review
5. `styles_audit.md` - CSS consolidation and cleanup analysis
6. `constants_audit.md` - Constants centralization review
7. `demos_audit.md` - Demo data consolidation analysis

### Lower Priority Files
8. `docs_audit.md` - Documentation currency and accuracy review
9. `config_dir_audit.md` - Config directory validation
10. `vite_plugins_audit.md` - Custom Vite plugins necessity review
11. `e2e_audit.md` - End-to-end testing setup review
12. `logs_cleanup.md` - Repository cleanup recommendations

### Completion Target
- **Complete contexts_audit.md** - Finish the started but incomplete analysis

## Audit Table Format Template

Each audit file should use this consistent format:

```markdown
# [Directory Name] Audit

This file audits the [description] in `[path]`.

## Summary

- **Total Files Audited:** X
- **Files Kept As Is:** X (X%)
- **Files Updated:** X (X%)
- **Files Consolidated:** X (X%)
- **Files Removed:** X (X%)

| File Name/Path | Description | Usage Count | Status | Recommendation |
|---|---|---|---|---|
| `path/file.ext` | Brief description | X | Keep/Update/Remove | Rationale |

## Overall Recommendations

1. Key finding
2. Major cleanup opportunity
3. Consolidation suggestion

## Implementation Notes

- Changes made during audit
- Files that require manual intervention
- Dependencies that need updating
```

This ensures consistency with the existing audit files and provides a clear framework for systematic codebase improvement.