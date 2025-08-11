# CLAUDE.md - Library (`src/lib`)

This directory contains core library code, including Firebase API wrappers and authentication context.

## Purpose
The code in this directory provides essential services and utilities that are fundamental to the application's operation. It is designed to be reusable and potentially shared between different parts of the application (e.g., client and a potential future server-side environment).

## Key Files
- **`firebaseApi.ts`**: A wrapper around the Firebase SDK that provides a simplified and consistent API for interacting with Firestore and Firebase Storage.
- **`firebaseConfig.ts`**: Contains the Firebase configuration for the project.
- **`authContext.tsx`**: A React context for managing user authentication state.
- **`dataSanitizer.ts`**: Utility functions for sanitizing data before it is sent to the backend.
- **`safeMathUtils.ts`**: Utility functions for performing safe mathematical calculations.

## Architectural Principles
- **Separation of Concerns**: This directory abstracts away the complexities of the Firebase SDK, providing a clean and simple API to the rest of the application.
- **Error Handling**: All functions that interact with external services (like Firebase) must have robust error handling.
- **Security**: The code in this directory is critical for the application's security. Pay close attention to security best practices when modifying these files.
