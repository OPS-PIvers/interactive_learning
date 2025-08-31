/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Firebase Configuration
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string; // Optional

  // Firebase Emulator Configuration
  readonly VITE_FIREBASE_AUTH_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_AUTH_EMULATOR_PORT?: string;
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_FIRESTORE_EMULATOR_PORT?: string;
  readonly VITE_FIREBASE_STORAGE_EMULATOR_HOST?: string;
  readonly VITE_FIREBASE_STORAGE_EMULATOR_PORT?: string;

  // Development Auth Bypass
  readonly VITE_DEV_AUTH_BYPASS?: string;
  readonly VITE_DEV_USER_EMAIL?: string;
  readonly VITE_DEV_USER_NAME?: string;

  // Base Vite environment variables
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}