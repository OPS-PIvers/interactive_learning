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

        let backgroundImageContent: string | undefined = undefined;
        if (storedData.interactiveData.backgroundImageFileId) {
          try {
            const imgFile = DriveApp.getFileById(storedData.interactiveData.backgroundImageFileId);
            if (imgFile.getMimeType().startsWith('image/')) {
              backgroundImageContent = `data:${imgFile.getMimeType()};base64,${Utilities.base64Encode(imgFile.getBlob().getBytes())}`;
            } else if (imgFile.getMimeType() === MimeType.PLAIN_TEXT || imgFile.getName().endsWith('.link')) {
              backgroundImageContent = imgFile.getBlob().getDataAsString();
            }
          } catch (e: unknown) {
            Logger.log(`Error accessing background image for project ${projectFolder.getName()}: ${String(e)}`);
          }
        }

        projects.push({
          id: projectFolder.getId(),
          title: storedData.title || projectFolder.getName(),
          description: storedData.description || "",
          thumbnailUrl: backgroundImageContent,
          interactiveData: {
            backgroundImage: backgroundImageContent,
            hotspots: storedData.interactiveData.hotspots || [],
            timelineEvents: storedData.interactiveData.timelineEvents || [],
          }
        });
      } catch (e: unknown) {
        Logger.log(`Error parsing project data for ${projectFolder.getName()}: ${String(e)}`);
      }
    }
  }

  Logger.log(`gs_listProjects: Found ${projects.length} projects.`);
  return projects.sort((a, b) => a.title.localeCompare(b.title));
}

function gs_createProjectInternal_(rootFolder: GoogleAppsScript.Drive.Folder, title: string, description: string, interactiveData: Partial<InteractiveModuleState> | null) {
  const projectFolder = rootFolder.createFolder(title.replace(/[^a-zA-Z0-9_ .-]/g, '_') + `_${Utilities.getUuid().substring(0,8)}`);
  const projectId = projectFolder.getId();

  let bgImageFileId: string | undefined = undefined;
  let actualBackgroundImageSourceForClient: string | undefined = undefined;

  if (interactiveData && interactiveData.backgroundImage) {
    actualBackgroundImageSourceForClient = interactiveData.backgroundImage;
    if (interactiveData.backgroundImage.startsWith('data:image')) {
      const [header, base64Data] = interactiveData.backgroundImage.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      if (!mimeMatch || !mimeMatch[1]) {
        Logger.log(`Error: Could not parse mime type from image data URL header: ${header}`);
        throw new Error('Invalid image data URL: Mime type could not be parsed.');
      }
      const mimeType = mimeMatch[1];
      const extension = mimeType.split('/')[1] || 'png';
      const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
      const imageFile = projectFolder.createFile(imageBlob);
      bgImageFileId = imageFile.getId();
    } else {
      const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
      bgImageFileId = linkFile.getId();
    }
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

  projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(moduleContent), MimeType.PLAIN_TEXT);

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
}

function gs_createProject(title: string, description: string): Project {
  Logger.log(`gs_createProject: Title: ${title}`);
  const rootFolder = getAppRootFolder();
  return gs_createProjectInternal_(rootFolder, title, description, { backgroundImage: undefined, hotspots: [], timelineEvents: [] });
}

function gs_saveProject(projectObject: Project): Project {
  Logger.log(`gs_saveProject: Saving project ID ${projectObject.id}`);
  const projectFolder = DriveApp.getFolderById(projectObject.id);
  if (!projectFolder) throw new Error("Project folder not found.");

  let currentModuleDataFiles = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
  let currentStoredData: Partial<StoredInteractiveModuleData> = {};

  if (currentModuleDataFiles.hasNext()) {
    try {
      currentStoredData = JSON.parse(currentModuleDataFiles.next().getBlob().getDataAsString());
    } catch(e: unknown) {
      Logger.log(`Error parsing existing module data for ${projectObject.id}, will overwrite: ${String(e)}`);
    }
  }

  let newBgImageFileId: string | undefined = currentStoredData.backgroundImageFileId || undefined;
  let actualBackgroundImageSourceForClient: string | undefined = projectObject.interactiveData.backgroundImage || undefined;

  const oldBgImageFileId = newBgImageFileId;

  if (projectObject.interactiveData.backgroundImage) {
    if (oldBgImageFileId) {
      try {
        DriveApp.getFileById(oldBgImageFileId).setTrashed(true);
      } catch(e: unknown) {
        Logger.log("Old image/link not found or error trashing: " + String(e));
      }
    }

    if (projectObject.interactiveData.backgroundImage.startsWith('data:image')) {
      const [header, base64Data] = projectObject.interactiveData.backgroundImage.split(',');
      const mimeMatch = header.match(/:(.*?);/);
      if (!mimeMatch || !mimeMatch[1]) {
        Logger.log(`Error: Could not parse mime type from image data URL header: ${header}`);
        throw new Error('Invalid image data URL: Mime type could not be parsed.');
      }
      const mimeType = mimeMatch[1];
      const extension = mimeType.split('/')[1] || 'png';
      const imageBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, `${DEFAULT_BACKGROUND_IMAGE_NAME}.${extension}`);
      const imageFile = projectFolder.createFile(imageBlob);
      newBgImageFileId = imageFile.getId();
    } else {
      const linkFile = projectFolder.createFile(`${DEFAULT_BACKGROUND_IMAGE_NAME}.link`, projectObject.interactiveData.backgroundImage, MimeType.PLAIN_TEXT);
      newBgImageFileId = linkFile.getId();
    }
  } else {
    if (oldBgImageFileId) {
      try {
        DriveApp.getFileById(oldBgImageFileId).setTrashed(true);
      } catch(e: unknown) {
        Logger.log("Old image/link not found for deletion: " + String(e));
      }
    }
    newBgImageFileId = undefined;
    actualBackgroundImageSourceForClient = undefined;
  }

  const newModuleContent = {
    title: projectObject.title,
    description: projectObject.description,
    id: projectObject.id,
    interactiveData: {
      backgroundImageFileId: newBgImageFileId || undefined,
      hotspots: projectObject.interactiveData.hotspots,
      timelineEvents: projectObject.interactiveData.timelineEvents,
    }
  };

  let files = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
  if (files.hasNext()) {
    files.next().setContent(JSON.stringify(newModuleContent));
  } else {
    projectFolder.createFile(MODULE_DATA_FILE_NAME, JSON.stringify(newModuleContent), MimeType.PLAIN_TEXT);
  }

  Logger.log(`Project ${projectObject.id} saved.`);

  return {
    id: projectObject.id,
    title: projectObject.title,
    description: projectObject.description,
    thumbnailUrl: actualBackgroundImageSourceForClient || undefined,
    interactiveData: {
      backgroundImage: actualBackgroundImageSourceForClient || undefined,
      hotspots: newModuleContent.interactiveData.hotspots,
      timelineEvents: newModuleContent.interactiveData.timelineEvents,
    }
  };
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
    if (e instanceof Error) {
      exceptionMessage = e.message;
    } else {
      exceptionMessage = String(e);
    }
    Logger.log(`Error deleting project ${projectId}: ${String(e)}`);
    throw new Error(`Failed to delete project: ${exceptionMessage}`);
  }
}
