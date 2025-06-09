// src/server/Code.ts - Complete implementation for Google Apps Script
import { Project, InteractiveModuleState, StoredInteractiveModuleData } from '../shared/types';

const APP_ROOT_FOLDER_NAME = 'InteractiveLearningModulesApp_Data';
const MODULE_DATA_FILE_NAME = 'module_data.json';
const DEFAULT_BACKGROUND_IMAGE_NAME = 'background_image';

function getAppRootFolder() {
  let folders = DriveApp.getFoldersByName(APP_ROOT_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(APP_ROOT_FOLDER_NAME);
}

// Main function to serve the HTML web app
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Interactive Training Module Creator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// Initialize sample data if needed
function gs_initializeIfNeeded_() {
  const folder = getAppRootFolder();
  const files = folder.getFilesByName('initialized.flag');
  if (!files.hasNext()) {
    // Create sample projects here if needed
    folder.createFile('initialized.flag', 'true');
    Logger.log('Sample data initialized.');
  }
}

function gs_listProjects(): Project[] {
  gs_initializeIfNeeded_();
  const rootFolder = getAppRootFolder();
  const projectFolders = rootFolder.getFolders();
  const projects: Project[] = [];

  while (projectFolders.hasNext()) {
    const projectFolder = projectFolders.next();
    const projectFiles = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);

    if (projectFiles.hasNext()) {
      try {
        const storedData = JSON.parse(projectFiles.next().getBlob().getDataAsString());

        let bgFileId: string | undefined = undefined;
        if (storedData.interactiveData.backgroundImageFileId) {
          try {
            // We might still want to check if the file exists and is accessible,
            // but we won't fetch its content here.
            // This try-catch is now more about validating the ID's existence if desired,
            // or could be removed if we trust the stored ID.
            // For now, let's assume the ID is valid if it exists.
            bgFileId = storedData.interactiveData.backgroundImageFileId;
            // Optional: DriveApp.getFileById(bgFileId); // to verify, but don't process
          } catch (e: unknown) {
            const errorDetails = e instanceof Error ? e.stack : String(e);
            Logger.log(`Error accessing background image file ID ${storedData.interactiveData.backgroundImageFileId} for project ${projectFolder.getName()}: ${errorDetails}`);
          }
        }

        projects.push({
          id: projectFolder.getId(),
          title: storedData.title || projectFolder.getName(),
          description: storedData.description || "",
          thumbnailUrl: undefined, // Client will handle thumbnail generation using file ID
          backgroundImageFileId: bgFileId, // New field for the client
          interactiveData: {
            backgroundImage: undefined, // Client will handle this using file ID
            backgroundImageFileId: bgFileId, // Also pass here for consistency if needed by InteractiveModuleState
            hotspots: storedData.interactiveData.hotspots || [],
            timelineEvents: storedData.interactiveData.timelineEvents || [],
          }
        });
      } catch (e: unknown) {
        const errorDetails = e instanceof Error ? e.stack : String(e);
        Logger.log(`Error parsing project data for ${projectFolder.getName()}: ${errorDetails}`);
      }
    }
  }

  Logger.log(`gs_listProjects: Found ${projects.length} projects.`);
  return projects.sort((a, b) => a.title.localeCompare(b.title));
}

function gs_createProjectInternal_(rootFolder: GoogleAppsScript.Drive.Folder, title: string, description: string, interactiveData: Partial<InteractiveModuleState> | null) {
  const folderName = title.replace(/[^a-zA-Z0-9_ .-]/g, '_') + `_${Utilities.getUuid().substring(0,8)}`;
  Logger.log(`gs_createProjectInternal_: Attempting to create project folder: ${folderName}`);
  const projectFolder = rootFolder.createFolder(folderName);
  const projectId = projectFolder.getId();
  Logger.log(`gs_createProjectInternal_: Successfully created project folder: ${folderName} with ID: ${projectId}`);

  try {
    let bgImageFileId: string | undefined = undefined;
    let actualBackgroundImageSourceForClient: string | undefined = undefined;

    if (interactiveData && interactiveData.backgroundImage) {
      actualBackgroundImageSourceForClient = interactiveData.backgroundImage;
      Logger.log(`gs_createProjectInternal_: Handling background image for project ${projectId}`);
      if (interactiveData.backgroundImage.startsWith('data:image')) {
        const [header, base64Data] = interactiveData.backgroundImage.split(',');
        const mimeMatch = header.match(/:(.*?);/);
        if (!mimeMatch || !mimeMatch[1]) {
          const errMsg = `Invalid image data URL: Mime type could not be parsed from header: ${header}`;
          Logger.log(`gs_createProjectInternal_: Error for project ${projectId}: ${errMsg}`);
          throw new Error(errMsg);
        }
        const mimeType = mimeMatch[1];
        const extension = mimeType.split('/')[1] || 'png';
        Logger.log(`gs_createProjectInternal_: Creating image file for project ${projectId} with mime-type: ${mimeType}`);
        const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
        const imageFile = projectFolder.createFile(imageBlob);
        bgImageFileId = imageFile.getId();
        Logger.log(`gs_createProjectInternal_: Successfully created image file for project ${projectId}, file ID: ${bgImageFileId}`);
      } else {
        Logger.log(`gs_createProjectInternal_: Creating image link file for project ${projectId}`);
        const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
        bgImageFileId = linkFile.getId();
        Logger.log(`gs_createProjectInternal_: Successfully created image link file for project ${projectId}, file ID: ${bgImageFileId}`);
      }
    } else {
      Logger.log(`gs_createProjectInternal_: No background image provided for project ${projectId}`);
    }

    const moduleContent = {
      title: title,
      description: description,
      id: projectId,
      interactiveData: {
        backgroundImageFileId: bgImageFileId || undefined, // Ensure undefined if null/empty
        hotspots: (interactiveData && interactiveData.hotspots) ? interactiveData.hotspots : [],
        timelineEvents: (interactiveData && interactiveData.timelineEvents) ? interactiveData.timelineEvents : [],
      }
    };

    Logger.log(`gs_createProjectInternal_: Creating module data file for project ${projectId}: ${MODULE_DATA_FILE_NAME}`);
    projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(moduleContent), MimeType.PLAIN_TEXT);
    Logger.log(`gs_createProjectInternal_: Successfully created module data file for project ${projectId}`);

    return {
      id: projectId,
      title: title,
      description: description,
      thumbnailUrl: actualBackgroundImageSourceForClient || undefined,
      interactiveData: {
        backgroundImage: actualBackgroundImageSourceForClient || undefined,
        hotspots: moduleContent.interactiveData.hotspots,
        timelineEvents: moduleContent.interactiveData.timelineEvents,
      }
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error && error.stack ? error.stack : String(error);
    Logger.log(`Error creating project [${title}] with ID [${projectId}]: ${errorMessage}. Cleaning up created folder.`);
    try {
      projectFolder.setTrashed(true);
      Logger.log(`Successfully trashed folder for project [${title}] with ID [${projectId}].`);
    } catch (cleanupError: unknown) {
      const cleanupErrorMessage = cleanupError instanceof Error && cleanupError.stack ? cleanupError.stack : String(cleanupError);
      Logger.log(`Failed to trash folder for project [${title}] with ID [${projectId}]. Cleanup error: ${cleanupErrorMessage}`);
    }
    throw error; // Re-throw the original error
  }
}

function gs_createProject(title: string, description: string): Project {
  Logger.log(`gs_createProject: Title: ${title}`);
  const rootFolder = getAppRootFolder();
  return gs_createProjectInternal_(rootFolder, title, description, { backgroundImage: undefined, hotspots: [], timelineEvents: [] });
}

function gs_saveProject(projectObject: Project): Project {
  Logger.log(`gs_saveProject: Saving project ID ${projectObject.id} titled "${projectObject.title}"`);
  const projectFolder = DriveApp.getFolderById(projectObject.id);
  if (!projectFolder) {
    Logger.log(`gs_saveProject: Project folder not found for ID ${projectObject.id}.`);
    throw new Error("Project folder not found.");
  }

  let currentStoredData: Partial<StoredInteractiveModuleData> = {};
  const moduleDataFiles = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
  if (moduleDataFiles.hasNext()) {
    try {
      currentStoredData = JSON.parse(moduleDataFiles.next().getBlob().getDataAsString());
      Logger.log(`gs_saveProject: Successfully parsed existing module data for project ${projectObject.id}`);
    } catch (e: unknown) {
      const errorDetails = e instanceof Error && e.stack ? e.stack : String(e);
      Logger.log(`gs_saveProject: Error parsing existing module data for project ${projectObject.id}, will proceed as if empty. Error: ${errorDetails}`);
    }
  } else {
    Logger.log(`gs_saveProject: No existing module data file found for project ${projectObject.id}.`);
  }

  const oldBgImageFileIdFromStoredData = currentStoredData.backgroundImageFileId;
  let finalBgImageFileIdForJson = oldBgImageFileIdFromStoredData;
  let actualClientFacingBackgroundImageSource = projectObject.interactiveData.backgroundImage;

  let uploadedProvisionalNewBgImageFileId: string | undefined = undefined;
  let imageStateChanged = false; // Tracks if the image reference *should* change

  // Determine if the client is trying to set a new image, or remove an existing one
  if (projectObject.interactiveData.backgroundImage) { // Client sent image data
    // If client sent image data, it implies a change unless this exact image data (once processed to an ID) matches oldBgImageFileIdFromStoredData
    // For simplicity, we'll always re-upload/re-link if client sends image data, and clean up old one later if IDs differ.
    imageStateChanged = true;
    Logger.log(`gs_saveProject: Client provided new image data for project ${projectObject.id}.`);
    if (projectObject.interactiveData.backgroundImage.startsWith('data:image')) {
      Logger.log(`gs_saveProject: New background is a data URL for project ${projectObject.id}. Uploading new file.`);
      const [header, base64Data] = projectObject.interactiveData.backgroundImage.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      if (!mimeMatch || !mimeMatch[1]) {
        const errMsg = `Invalid image data URL: Mime type could not be parsed from header: ${header}`;
        Logger.log(`gs_saveProject: Error for project ${projectObject.id}: ${errMsg}`);
        throw new Error(errMsg);
      }
      const mimeType = mimeMatch[1];
      const extension = mimeType.split('/')[1] || 'png';
      const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
      const imageFile = projectFolder.createFile(imageBlob);
      uploadedProvisionalNewBgImageFileId = imageFile.getId();
      finalBgImageFileIdForJson = uploadedProvisionalNewBgImageFileId; // This will be the new ID in JSON
      Logger.log(`gs_saveProject: Uploaded new image file ${uploadedProvisionalNewBgImageFileId} for project ${projectObject.id}.`);
    } else { // It's a URL
      Logger.log(`gs_saveProject: New background is a URL for project ${projectObject.id}. Creating link file.`);
      const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, projectObject.interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
      uploadedProvisionalNewBgImageFileId = linkFile.getId();
      finalBgImageFileIdForJson = uploadedProvisionalNewBgImageFileId; // This will be the new ID in JSON
      Logger.log(`gs_saveProject: Created new link file ${uploadedProvisionalNewBgImageFileId} for project ${projectObject.id}.`);
    }
  } else { // Client sent no image data (projectObject.interactiveData.backgroundImage is null/undefined)
    if (oldBgImageFileIdFromStoredData) {
      imageStateChanged = true; // Image should be removed
      Logger.log(`gs_saveProject: Client provided no image data, and an old image ${oldBgImageFileIdFromStoredData} exists. It will be removed for project ${projectObject.id}.`);
    } else {
      imageStateChanged = false; // No image before, no image now. Nothing changes.
      Logger.log(`gs_saveProject: Client provided no image data, and no old image existed. No image change for project ${projectObject.id}.`);
    }
    finalBgImageFileIdForJson = undefined; // No image ID in JSON
    actualClientFacingBackgroundImageSource = undefined; // No image for client
  }

  // This structure must match what gs_createProjectInternal_ creates and how currentStoredData is parsed.
  const newModuleContent = {
    title: projectObject.title,
    description: projectObject.description,
    id: projectObject.id, // Project folder ID
    interactiveData: { // This is the part that aligns with StoredInteractiveModuleData's intent
      backgroundImageFileId: finalBgImageFileIdForJson,
      hotspots: projectObject.interactiveData.hotspots || [],
      timelineEvents: projectObject.interactiveData.timelineEvents || [],
    }
  };

  try {
    Logger.log(`gs_saveProject: Attempting to write module_data.json for project ${projectObject.id}. Image File ID for JSON: ${finalBgImageFileIdForJson}`);
    const moduleDataFileIterator = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
    if (moduleDataFileIterator.hasNext()) {
      moduleDataFileIterator.next().setContent(JSON.stringify(newModuleContent));
      Logger.log(`gs_saveProject: Updated existing module_data.json for project ${projectObject.id}.`);
    } else {
      projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(newModuleContent), MimeType.PLAIN_TEXT);
      Logger.log(`gs_saveProject: Created new module_data.json for project ${projectObject.id}.`);
    }

    // Post-JSON write cleanup.
    // This happens only if JSON was successfully written AND the image state was intended to change.
    if (imageStateChanged && oldBgImageFileIdFromStoredData && (oldBgImageFileIdFromStoredData !== finalBgImageFileIdForJson)) {
      Logger.log(`gs_saveProject: JSON for project ${projectObject.id} updated. Old image ${oldBgImageFileIdFromStoredData} needs cleanup because new image ID is ${finalBgImageFileIdForJson}.`);
      try {
        DriveApp.getFileById(oldBgImageFileIdFromStoredData).setTrashed(true);
        Logger.log(`gs_saveProject: Successfully trashed old image file ${oldBgImageFileIdFromStoredData} for project ${projectObject.id}.`);
      } catch (e: unknown) {
        const errorDetails = e instanceof Error && e.stack ? e.stack : String(e);
        Logger.log(`gs_saveProject: Failed to trash old image file ${oldBgImageFileIdFromStoredData} for project ${projectObject.id}. Error: ${errorDetails}`);
        // Non-fatal for the save operation itself, as JSON is consistent.
      }
    } else if (imageStateChanged && oldBgImageFileIdFromStoredData) {
        Logger.log(`gs_saveProject: Image state changed for project ${projectObject.id}, but old image ID ${oldBgImageFileIdFromStoredData} is same as new one ${finalBgImageFileIdForJson}. No trashing needed.`);
    } else if (imageStateChanged) {
        Logger.log(`gs_saveProject: Image state changed for project ${projectObject.id}, but no old image was present. No trashing needed.`);
    } else {
        Logger.log(`gs_saveProject: Image state did not change for project ${projectObject.id}. No trashing needed.`);
    }


    Logger.log(`gs_saveProject: Project ${projectObject.id} successfully saved.`);
    return {
      id: projectObject.id,
      title: newModuleContent.title,
      description: newModuleContent.description,
      thumbnailUrl: actualClientFacingBackgroundImageSource,
      interactiveData: {
        backgroundImage: actualClientFacingBackgroundImageSource,
        hotspots: newModuleContent.interactiveData.hotspots,
        timelineEvents: newModuleContent.interactiveData.timelineEvents,
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error && error.stack ? error.stack : String(error);
    Logger.log(`gs_saveProject: Error writing module_data.json for project ${projectObject.id}. Error: ${errorMessage}`);

    if (uploadedProvisionalNewBgImageFileId) {
      Logger.log(`gs_saveProject: Attempting to trash newly uploaded (but now orphaned) image file ${uploadedProvisionalNewBgImageFileId} for project ${projectObject.id} due to JSON save error.`);
      try {
        DriveApp.getFileById(uploadedProvisionalNewBgImageFileId).setTrashed(true);
        Logger.log(`gs_saveProject: Successfully trashed orphaned new image file ${uploadedProvisionalNewBgImageFileId}.`);
      } catch (cleanupError: unknown) {
        const cleanupErrorMessage = cleanupError instanceof Error && cleanupError.stack ? cleanupError.stack : String(cleanupError);
        Logger.log(`gs_saveProject: Failed to trash orphaned new image file ${uploadedProvisionalNewBgImageFileId}. Cleanup error: ${cleanupErrorMessage}`);
      }
    }
    throw error;
  }
}

function gs_deleteProject(projectId: string): string {
  Logger.log(`gs_deleteProject: Deleting project ID ${projectId}`);
  try {
    const projectFolder = DriveApp.getFolderById(projectId);
    projectFolder.setTrashed(true);
    Logger.log(`Project ${projectId} trashed.`);
    return "Project deleted successfully.";
  } catch (e: unknown) {
    let exceptionMessage = "unknown error";
    let logMessage = "";
    if (e instanceof Error) {
      exceptionMessage = e.stack || e.message; // Use stack if available, else message
      logMessage = e.stack || String(e); // Log stack if available
    } else {
      exceptionMessage = String(e);
      logMessage = String(e);
    }
    Logger.log(`Error deleting project ${projectId}: ${logMessage}`);
    throw new Error(`Failed to delete project: ${exceptionMessage}`); // The exception message for the client can be less verbose
  }
}
