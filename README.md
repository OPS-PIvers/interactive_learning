
# Interactive Training Module Creator - Apps Script Web App Guide

This document outlines how to take the refactored React application and deploy it as a Google Apps Script web app. The refactoring primarily involved replacing the local storage-based `googleDriveSimulator` with `lib/googleAppScriptProxy.ts`, which is designed to communicate with server-side Apps Script functions using `google.script.run`.

**Local Development Note:** The `lib/googleAppScriptProxy.ts` now includes a mock for `google.script.run`. This means you can run the application locally (e.g., using `npm run dev` or `yarn dev`) without it crashing due to the `google` object being undefined. The mock simulates the Apps Script backend functions using in-memory data, allowing for UI development and testing. A warning will appear in your browser's console indicating that the mock is active. For real data persistence and backend logic, you must deploy the application to Google Apps Script.

## Core Concepts for Apps Script Deployment

1.  **Client-Server Model:**
    *   **Client (React App):** Your React components run in the user's browser, served by Apps Script's `HtmlService`.
    *   **Server (Apps Script - `Code.gs`):** Google Apps Script functions (`.gs` files) run on Google's servers. They handle data storage (Google Drive via `DriveApp`), API calls (e.g., to Gemini API via `UrlFetchApp`), and other backend logic.
    *   **Communication:** The client calls server-side functions using `google.script.run`.

2.  **Build Process:**
    *   You cannot directly run JSX/TSX or modern ES modules with complex imports in Apps Script's `HtmlService` without a build step.
    *   You need to transpile and bundle your React application into static HTML, JavaScript, and CSS files. Tools like **Vite** or **esbuild** are excellent for this.

3.  **File Structure in Apps Script Project:**
    *   `appsscript.json`: The manifest file (permissions, etc.).
    *   `Code.gs` (or other `.gs` files): Server-side JavaScript (Apps Script).
    *   `index.html` (Apps Script HTML file): The main HTML file for your app's UI.
    *   `JavaScript.html` (optional): An HTML file to hold your bundled JavaScript code.
    *   `CSS.html` (optional): An HTML file to hold your bundled CSS code.

## Steps to Deploy

### 1. Set Up a Build Process (Example using Vite)

If you don't have a build process, Vite is a good option:

*   **Install Vite:**
    ```bash
    npm install --save-dev vite @vitejs/plugin-react
    # or
    yarn add --dev vite @vitejs/plugin-react
    ```

*   **Create `vite.config.js` (or `.ts`):**
    ```javascript
    // vite.config.js
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      build: {
        outDir: 'dist', // Output directory for bundled files
        assetsDir: 'assets', // Subdirectory for JS/CSS assets within outDir
        rollupOptions: {
          output: {
            // Ensure single JS and CSS files for easier Apps Script inclusion
            entryFileNames: `assets/bundle.js`,
            chunkFileNames: `assets/bundle-chunk.js`, // Though we aim for one main bundle
            assetFileNames: (assetInfo) => {
              if (assetInfo.name.endsWith('.css')) {
                return 'assets/styles.css';
              }
              return `assets/[name]-[hash][extname]`;
            },
          },
        },
      },
      // Ensure index.tsx is the entry point if your main.tsx/main.ts is index.tsx
      // For Apps Script, the HTML entry point is less critical from Vite's perspective
      // as Apps Script will serve its own HTML file.
    });
    ```
    *Note: Adjust `entryFileNames`, `chunkFileNames`, and `assetFileNames` to ensure you get predictable output filenames, ideally a single `bundle.js` and `styles.css`.*

*   **Update `package.json` scripts:**
    ```json
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    }
    ```

*   **Build the App:**
    ```bash
    npm run build
    # or
    yarn build
    ```
    This will generate files in the `dist` folder (e.g., `dist/index.html`, `dist/assets/bundle.js`, `dist/assets/styles.css`).

### 2. Create Your Google Apps Script Project

Go to [script.google.com](https://script.google.com) and create a new project.

*   **`appsscript.json` (Manifest):**
    Open View > Show manifest file (`appsscript.json`). Update it:
    ```json
    {
      "timeZone": "America/New_York", // Adjust to your timezone
      "dependencies": {},
      "exceptionLogging": "STACKDRIVER",
      "runtimeVersion": "V8",
      "webapp": {
        "access": "MYSELF", // Or "DOMAIN" or "ANYONE" / "ANYONE_ANONYMOUS"
        "executeAs": "USER_ACCESSING" // Or "USER_DEPLOYING"
      },
      "oauthScopes": [
        "https://www.googleapis.com/auth/script.external_request", // For UrlFetchApp (e.g., Gemini API)
        "https://www.googleapis.com/auth/drive.file", // To create/manage files in Drive (restrict if possible)
        "https://www.googleapis.com/auth/userinfo.email", // Basic profile info
        "https://www.googleapis.com/auth/script.storage", // For PropertiesService
        "https://www.googleapis.com/auth/script.container.ui" // If interacting with parent Docs/Sheets etc.
      ]
    }
    ```
    *Important: Only include `oauthScopes` you actually need. `drive.file` is broad; narrow it if your app only works within a specific folder created by the app itself.*

*   **`Code.gs` (Server-Side Logic):**
    This file will contain your `doGet()` function to serve the HTML and the server-side counterparts to the `appScriptProxy` calls.

    ```javascript
    // Code.gs

    const APP_ROOT_FOLDER_NAME = 'InteractiveLearningModulesApp_Data';
    const MODULE_DATA_FILE_NAME = 'module_data.json';
    const DEFAULT_BACKGROUND_IMAGE_NAME = 'background_image';

    function getAppRootFolder() {
      let Rfolders = DriveApp.getFoldersByName(APP_ROOT_FOLDER_NAME);
      if (Rfolders.hasNext()) {
        return Rfolders.next();
      }
      return DriveApp.createFolder(APP_ROOT_FOLDER_NAME);
    }

    // --- Main function to serve HTML ---
    function doGet(e) {
      return HtmlService.createHtmlOutputFromFile('index')
        .setTitle('Interactive Training Module Creator')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Important for embedding or full-page view
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    }

    // --- Proxy Functions (called by google.script.run from client) ---

    // Example: Initialize (e.g., create sample data if it doesn't exist)
    // Called by appScriptProxy.init(), though client-side init is a no-op now.
    // This server-side init logic could be merged into gs_listProjects if preferred.
    function gs_initializeIfNeeded_() { // Private helper
      const folder = getAppRootFolder();
      const files = folder.getFilesByName('initialized.flag');
      if (!files.hasNext()) {
        // Create sample projects or other initial setup here
        // For example, to create the "Flower Anatomy" sample:
        /*
        const sampleFlowerHotspots = [
          { id: 's1_h_petal', x: 50, y: 20, title: 'Petal', description: 'Petals are often brightly colored...', color: 'bg-pink-400' },
          // ... more hotspots
        ];
        const sampleFlowerTimeline = [
          { id: 's1_te1', step: 1, name: 'Welcome', type: 'SHOW_MESSAGE', message: "Welcome! Let's explore..." },
          // ... more timeline events
        ];
        const flowerProjectData = {
            id: 'sample_proj_flower_01',
            title: "Exploring Flower Anatomy",
            description: "Learn about the different parts of a typical flower.",
            interactiveData: {
                backgroundImage: 'https://picsum.photos/seed/flowerpower/800/600', // URL for sample
                hotspots: sampleFlowerHotspots,
                timelineEvents: sampleFlowerTimeline,
            },
            thumbnailUrl: 'https://picsum.photos/seed/flowerpower/800/600'
        };
        gs_createProjectInternal_(folder, flowerProjectData.title, flowerProjectData.description, flowerProjectData.interactiveData);
        */
        // folder.createFile('initialized.flag', 'true');
        Logger.log('Sample data initialized (simulated).');
      }
    }


    function gs_listProjects() {
      // gs_initializeIfNeeded_(); // Optional: ensure samples exist on first list
      const rootFolder = getAppRootFolder();
      const projectFolders = rootFolder.getFolders();
      const projects = [];

      while (projectFolders.hasNext()) {
        const projectFolder = projectFolders.next();
        const projectFile = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
        
        if (projectFile.hasNext()) {
          try {
            const storedData = JSON.parse(projectFile.next().getBlob().getDataAsString());
            // The 'project' object stored in module_data.json should contain title, description, id.
            // And interactiveData with backgroundImageFileId, hotspots, timelineEvents.

            let backgroundImageContent = null;
            if (storedData.interactiveData.backgroundImageFileId) {
                try {
                    const imgFile = DriveApp.getFileById(storedData.interactiveData.backgroundImageFileId);
                    if (imgFile.getMimeType().startsWith('image/')) {
                        backgroundImageContent = `data:${imgFile.getMimeType()};base64,${Utilities.base64Encode(imgFile.getBlob().getBytes())}`;
                    } else if (imgFile.getMimeType() === MimeType.PLAIN_TEXT || imgFile.getName().endsWith('.link')) { // Assuming URL stored in text file
                        backgroundImageContent = imgFile.getBlob().getDataAsString();
                    }
                } catch (e) {
                    Logger.log(`Error accessing background image for project ${projectFolder.getName()}: ${e.toString()}`);
                    // Potentially, the file ID is stale or permissions changed.
                    // backgroundImageContent remains null.
                }
            }
            
            projects.push({
              id: projectFolder.getId(), // Use folder ID as project ID
              title: storedData.title || projectFolder.getName(),
              description: storedData.description || "",
              thumbnailUrl: backgroundImageContent, // Use full image as thumbnail for now
              interactiveData: {
                backgroundImage: backgroundImageContent,
                hotspots: storedData.interactiveData.hotspots || [],
                timelineEvents: storedData.interactiveData.timelineEvents || [],
              }
            });
          } catch (e) {
            Logger.log(`Error parsing project data for ${projectFolder.getName()}: ${e.toString()}`);
          }
        }
      }
      Logger.log(`gs_listProjects: Found ${projects.length} projects.`);
      return projects.sort((a,b) => a.title.localeCompare(b.title));
    }

    function gs_createProjectInternal_(rootFolder, title, description, interactiveData) {
      const projectFolder = rootFolder.createFolder(title.replace(/[^a-zA-Z0-9_ .-]/g, '_') + `_${Utilities.getUuid().substring(0,8)}`);
      const projectId = projectFolder.getId();
      
      let bgImageFileId = null;
      let actualBackgroundImageSourceForClient = null; // This will be the base64 or URL passed in
      
      if (interactiveData && interactiveData.backgroundImage) {
        actualBackgroundImageSourceForClient = interactiveData.backgroundImage;
        if (interactiveData.backgroundImage.startsWith('data:image')) {
          const [header, base64Data] = interactiveData.backgroundImage.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          const extension = mimeType.split('/')[1] || 'png';
          const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
          const imageFile = projectFolder.createFile(imageBlob);
          bgImageFileId = imageFile.getId();
        } else { // Assume it's a URL
          const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
          bgImageFileId = linkFile.getId();
        }
      }

      const moduleContent = {
        title: title,
        description: description,
        id: projectId, // Storing project ID also in the JSON for convenience
        interactiveData: {
          backgroundImageFileId: bgImageFileId,
          hotspots: (interactiveData && interactiveData.hotspots) ? interactiveData.hotspots : [],
          timelineEvents: (interactiveData && interactiveData.timelineEvents) ? interactiveData.timelineEvents : [],
        }
      };
      projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(moduleContent), MimeType.PLAIN_TEXT);

      return {
        id: projectId,
        title: title,
        description: description,
        thumbnailUrl: actualBackgroundImageSourceForClient, // send back the original image source for immediate use
        interactiveData: {
            backgroundImage: actualBackgroundImageSourceForClient,
            hotspots: moduleContent.interactiveData.hotspots,
            timelineEvents: moduleContent.interactiveData.timelineEvents,
        }
      };
    }


    function gs_createProject(title, description) {
      Logger.log(`gs_createProject: Title: ${title}`);
      const rootFolder = getAppRootFolder();
      // Pass null for interactiveData initially for a new empty project
      return gs_createProjectInternal_(rootFolder, title, description, { backgroundImage: null, hotspots: [], timelineEvents: [] });
    }

    function gs_saveProject(projectObject) {
      // projectObject is the Project type from types.ts
      Logger.log(`gs_saveProject: Saving project ID ${projectObject.id}`);
      const projectFolder = DriveApp.getFolderById(projectObject.id);
      if (!projectFolder) throw new Error("Project folder not found.");

      let currentModuleDataFile = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
      let currentStoredData = { interactiveData: {} }; // Default structure
      if (currentModuleDataFile.hasNext()){
          try {
            currentStoredData = JSON.parse(currentModuleDataFile.next().getBlob().getDataAsString());
          } catch(e) {
            Logger.log(`Error parsing existing module data for ${projectObject.id}, will overwrite: ${e}`);
          }
      }
      
      let newBgImageFileId = currentStoredData.interactiveData ? currentStoredData.interactiveData.backgroundImageFileId : null;
      let actualBackgroundImageSourceForClient = projectObject.interactiveData.backgroundImage; // What the client sent

      // Delete old image/link file if a new one is provided or if the image is removed
      const oldBgImageFileId = newBgImageFileId;

      if (projectObject.interactiveData.backgroundImage) { // If a new image source is provided
        if (oldBgImageFileId) { 
          // Check if it's different enough to warrant replacement (e.g., if it's a new base64 or a new URL)
          // For simplicity, always try to trash old if new one is coming.
          // More complex: compare if new URL is same as old URL stored in link file.
          try { DriveApp.getFileById(oldBgImageFileId).setTrashed(true); } catch(e){ Logger.log("Old image/link not found or error trashing: "+e)} 
        }
        
        if (projectObject.interactiveData.backgroundImage.startsWith('data:image')) { 
          const [header, base64Data] = projectObject.interactiveData.backgroundImage.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          const extension = mimeType.split('/')[1] || 'png';
          const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
          const imageFile = projectFolder.createFile(imageBlob);
          newBgImageFileId = imageFile.getId();
        } else { // It's a URL
           const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, projectObject.interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
           newBgImageFileId = linkFile.getId();
        }
      } else { // No image provided (backgroundImage is undefined or null)
        if (oldBgImageFileId) { try { DriveApp.getFileById(oldBgImageFileId).setTrashed(true); } catch(e){ Logger.log("Old image/link not found for deletion: "+e)} }
        newBgImageFileId = null;
        actualBackgroundImageSourceForClient = null; // Ensure client gets null if image removed
      }

      const newModuleContent = {
        title: projectObject.title,
        description: projectObject.description,
        id: projectObject.id,
        interactiveData: {
          backgroundImageFileId: newBgImageFileId,
          hotspots: projectObject.interactiveData.hotspots,
          timelineEvents: projectObject.interactiveData.timelineEvents,
        }
      };

      // Overwrite or create module_data.json
      let files = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
      if (files.hasNext()) {
        files.next().setContent(JSON.stringify(newModuleContent));
      } else {
        projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(newModuleContent), MimeType.PLAIN_TEXT);
      }
      Logger.log(`Project ${projectObject.id} saved.`);
      
      // Return an object that matches the Project structure the client expects,
      // including the actual background image data (base64 or URL) that was processed.
      return {
        id: projectObject.id,
        title: projectObject.title,
        description: projectObject.description,
        thumbnailUrl: actualBackgroundImageSourceForClient, // Use the processed image for thumbnail
        interactiveData: {
            backgroundImage: actualBackgroundImageSourceForClient,
            hotspots: newModuleContent.interactiveData.hotspots,
            timelineEvents: newModuleContent.interactiveData.timelineEvents,
        }
      };
    }

    function gs_deleteProject(projectId) {
      Logger.log(`gs_deleteProject: Deleting project ID ${projectId}`);
      try {
        const projectFolder = DriveApp.getFolderById(projectId);
        projectFolder.setTrashed(true); // Move to trash
        Logger.log(`Project ${projectId} trashed.`);
        return "Project deleted successfully.";
      } catch (e) {
        Logger.log(`Error deleting project ${projectId}: ${e.toString()}`);
        throw new Error(`Failed to delete project: ${e.message}`);
      }
    }

    // If implementing Gemini:
    // function gs_callGeminiAPI(promptText) {
    //   const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    //   if (!apiKey) throw new Error("API Key not configured.");
    //   const model = 'gemini-2.5-flash-preview-04-17'; // Or your preferred model
    //   const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    //   const payload = { contents: [{ parts: [{ text: promptText }] }] };
    //   const options = {
    //     method: 'post',
    //     contentType: 'application/json',
    //     payload: JSON.stringify(payload),
    //     muteHttpExceptions: true,
    //   };
    //   const response = UrlFetchApp.fetch(url, options);
    //   const responseCode = response.getResponseCode();
    //   const responseBody = response.getContentText();
    //   if (responseCode === 200) {
    //     const jsonResponse = JSON.parse(responseBody);
    //     // Extract text according to Gemini API guidelines
    //     // GenerateContentResponse -> .text property
    //     // Simplified: assuming structure candidates[0].content.parts[0].text
    //     // **IMPORTANT**: Follow current Gemini API guidelines for parsing.
    //     // The correct way is usually response.text after parsing if the overall response is GenerateContentResponse
    //     // For the raw HTTP call, the structure is specific to the REST API:
    //     if (jsonResponse.candidates && jsonResponse.candidates.length > 0 &&
    //         jsonResponse.candidates[0].content && jsonResponse.candidates[0].content.parts &&
    //         jsonResponse.candidates[0].content.parts.length > 0 && jsonResponse.candidates[0].content.parts[0].text) {
    //       return jsonResponse.candidates[0].content.parts[0].text;
    //     } else {
    //       Logger.log("Unexpected Gemini API response structure: " + responseBody);
    //       throw new Error("Could not parse text from Gemini API response.");
    //     }
    //   } else {
    //     Logger.log(`Gemini API Error: ${responseCode} - ${responseBody}`);
    //     throw new Error(`Gemini API request failed: ${responseBody}`);
    //   }
    // }
    ```
    *Important: The `gs_saveProject` and `gs_listProjects` functions above dealing with image files are examples. You'll need to robustly handle storing either base64 image data directly in Drive files (can be slow for large images) or by uploading to a specific folder and storing file IDs.* The example uses Drive file IDs for images. Storing URLs for sample images is also a good approach.

*   **`index.html` (Apps Script HTML file):**
    Create an HTML file named `index.html` in your Apps Script project.
    Copy the content of your *built* `dist/index.html` into this file.
    Then, modify it to include your bundled JS and CSS using scriptlets:

    ```html
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Interactive Training Modules</title>
      <script src="https://cdn.tailwindcss.com"></script> <!-- Keep or bundle Tailwind -->
      <style>
        /* Global styles from your original index.html */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
        .subtle-pulse-animation { animation: subtle-pulse-keyframes 2s infinite ease-in-out; }
        @keyframes subtle-pulse-keyframes { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
      </style>
      <?!= HtmlService.createHtmlOutputFromFile('CSS').getContent(); ?>
    </head>
    <body class="bg-slate-100">
      <div id="root"></div>
      <?!= HtmlService.createHtmlOutputFromFile('JavaScript').getContent(); ?>
    </body>
    </html>
    ```

*   **`JavaScript.html` (Apps Script HTML file):**
    Create an HTML file named `JavaScript.html`. Copy the entire content of your bundled `dist/assets/bundle.js` into this file, wrapped in `<script>` tags:
    ```html
    <script>
      // Paste content of dist/assets/bundle.js here
    </script>
    ```

*   **`CSS.html` (Apps Script HTML file):**
    Create an HTML file named `CSS.html`. Copy the entire content of your bundled `dist/assets/styles.css` into this file, wrapped in `<style>` tags:
    ```html
    <style>
      /* Paste content of dist/assets/styles.css here */
    </style>
    ```

### 3. API Key Management (If using Gemini)

*   **Store API Key:** In the Apps Script editor, go to Project Settings (gear icon) > Script Properties. Add a property named `GEMINI_API_KEY` and paste your API key as its value.
*   **Access in `Code.gs`:** Your server-side function (`gs_callGeminiAPI` in the example) will retrieve it using `PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');`. **Never expose the API key to the client-side code.**

### 4. Deploy the Web App

*   In the Apps Script editor, click "Deploy" > "New deployment".
*   Select type "Web app".
*   Configure:
    *   **Description:** (Optional)
    *   **Execute as:** `Me (your-email@example.com)` or `User accessing the web app`.
    *   **Who has access:** `Anyone` (for public access), `Anyone within [Your Domain]` (for domain users), or `Only myself`. If choosing `Anyone`, it might become `Anyone with Google Account` or `Anyone, even anonymous` depending on other settings.
*   Click "Deploy".
*   Authorize the script's permissions when prompted.
*   You'll get a Web app URL. This is the URL to your deployed application.

## Development Workflow

1.  Develop your React app locally (`npm run dev` or `yarn dev`). The new mock in `lib/googleAppScriptProxy.ts` will allow the app to run without errors related to `google.script.run` not being defined.
2.  When ready to update the Apps Script web app:
    *   Build the React app (`npm run build` or `yarn build`).
    *   Copy the content of `dist/assets/bundle.js` into your Apps Script `JavaScript.html`.
    *   Copy the content of `dist/assets/styles.css` into your Apps Script `CSS.html`.
    *   Update any server-side logic in `Code.gs` if needed.
    *   Deploy a new version: "Deploy" > "Manage deployments", select your deployment, click the pencil (edit) icon, and choose "New version".

This process allows you to leverage modern frontend development tools while using Google Apps Script as a powerful serverless backend.
Remember to consult the official Google Apps Script documentation for `HtmlService`, `DriveApp`, and `UrlFetchApp` for more details.
