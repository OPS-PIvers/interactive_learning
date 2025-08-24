# Lib Audit

This file audits the utility functions in `src/lib`.

| File Name | Description | Usage Count | Usage Location |
|---|---|---|---|
| `authContext.tsx` | Provides authentication context and provider for the app. | 4 | `App.tsx`, `AuthButton.tsx`, `AuthModal.tsx`, `ViewerView.tsx` |
| `dataSanitizer.ts` | Utility class to sanitize data before sending to Firebase. | 1 | `firebaseApi.ts` |
| `firebaseApi.ts` | Encapsulates all Firebase interactions (Firestore, Storage, etc.). | 3 | `ShareModal.tsx`, `firebaseProxy.ts`, `scripts/backup-data.ts` |
| `firebaseConfig.ts` | Configures and initializes Firebase services. | 4 | `authContext.tsx`, `firebaseApi.ts`, `firebaseProxy.ts`, `retryUtils.ts` |
| `firebaseProxy.ts` | Proxies calls to `firebaseApi` to abstract the backend. | 4 | `App.tsx`, `SharedModuleViewer.tsx`, `ViewerView.tsx`, `mobileMediaCapture.ts` |
| `testAuthUtils.ts` | Provides authentication bypass for development and testing. | 2 | `authContext.tsx`, `firebaseApi.ts` |
