# Lib Audit

This file audits the utility functions in `src/lib`.

| File Name | Description | Usage Count | Usage Location | Recommendation |
|---|---|---|---|---|
| `authContext.tsx` | Provides authentication context and provider for the app. | 4 | `App.tsx`, `AuthButton.tsx`, `AuthModal.tsx`, `ViewerView.tsx` | Keep |
| `dataSanitizer.ts` | Utility class to sanitize data before sending to Firebase. | 1 | `firebaseApi.ts` | Keep |
| `firebaseApi.ts` | Encapsulates all Firebase interactions (Firestore, Storage, etc.). | 2 | `firebaseProxy.ts`, `scripts/backup-data.ts` | Keep |
| `firebaseConfig.ts` | Configures and initializes Firebase services. | 5 | `authContext.tsx`, `firebaseApi.ts`, `firebaseProxy.ts`, `healthMonitor.ts`, `retryUtils.ts` | Keep |
| `firebaseProxy.ts` | Proxies calls to `firebaseApi` to abstract the backend. | 4 | `App.tsx`, `SharedModuleViewer.tsx`, `ViewerView.tsx`, `mobileMediaCapture.ts` | Keep |
| `healthMonitor.ts` | Monitors and validates database consistency. | 0 | - | Remove |
| `safeMathUtils.ts` | Utility functions for safe mathematical operations. | 0 | - | Remove |
| `saveOperationMonitor.ts` | Monitors save operations and collects metrics. | 1 | `healthMonitor.ts` | Remove |
| `testAuthUtils.ts` | Provides authentication bypass for development and testing. | 2 | `authContext.tsx`, `firebaseApi.ts` | Keep |
