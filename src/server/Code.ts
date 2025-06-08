// src/server/Code.ts - Complete implementation for Google Apps Script

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
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
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

function gs_listProjects(): any[] {
  gs_initializeIfNeeded_();
  const rootFolder = getAppRootFolder();
  const projectFolders = rootFolder.getFolders();
  const projects: any[] = [];

  while (projectFolders.hasNext()) {
    const projectFolder = projectFolders.next();
    const projectFiles = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);

    if (projectFiles.hasNext()) {
      try {
        const storedData = JSON.parse(projectFiles.next().getBlob().getDataAsString());

        let backgroundImageContent = null;
        if (storedData.interactiveData.backgroundImageFileId) {
          try {
            const imgFile = DriveApp.getFileById(storedData.interactiveData.backgroundImageFileId);
            if (imgFile.getMimeType().startsWith('image/')) {
              backgroundImageContent = `data:${imgFile.getMimeType()};base64,${Utilities.base64Encode(imgFile.getBlob().getBytes())}`;
            } else if (imgFile.getMimeType() === MimeType.PLAIN_TEXT || imgFile.getName().endsWith('.link')) {
              backgroundImageContent = imgFile.getBlob().getDataAsString();
            }
          } catch (e) {
            Logger.log(`Error accessing background image for project ${projectFolder.getName()}: ${e.toString()}`);
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
      } catch (e) {
        Logger.log(`Error parsing project data for ${projectFolder.getName()}: ${e.toString()}`);
      }
    }
  }

  Logger.log(`gs_listProjects: Found ${projects.length} projects.`);
  return projects.sort((a, b) => a.title.localeCompare(b.title));
}

function gs_createProjectInternal_(rootFolder: GoogleAppsScript.Drive.Folder, title: string, description: string, interactiveData: any) {
  const projectFolder = rootFolder.createFolder(title.replace(/[^a-zA-Z0-9_ .-]/g, '_') + `_${Utilities.getUuid().substring(0,8)}`);
  const projectId = projectFolder.getId();

  let bgImageFileId = null;
  let actualBackgroundImageSourceForClient = null;

  if (interactiveData && interactiveData.backgroundImage) {
    actualBackgroundImageSourceForClient = interactiveData.backgroundImage;
    if (interactiveData.backgroundImage.startsWith('data:image')) {
      const [header, base64Data] = interactiveData.backgroundImage.split(',');
      const mimeType = header.match(/:(.*?);/)![1];
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
    thumbnailUrl: actualBackgroundImageSourceForClient,
    interactiveData: {
      backgroundImage: actualBackgroundImageSourceForClient,
      hotspots: moduleContent.interactiveData.hotspots,
      timelineEvents: moduleContent.interactiveData.timelineEvents,
    }
  };
}

function gs_createProject(title: string, description: string): any {
  Logger.log(`gs_createProject: Title: ${title}`);
  const rootFolder = getAppRootFolder();
  return gs_createProjectInternal_(rootFolder, title, description, { backgroundImage: null, hotspots: [], timelineEvents: [] });
}

function gs_saveProject(projectObject: any): any {
  Logger.log(`gs_saveProject: Saving project ID ${projectObject.id}`);
  const projectFolder = DriveApp.getFolderById(projectObject.id);
  if (!projectFolder) throw new Error("Project folder not found.");

  let currentModuleDataFiles = projectFolder.getFilesByName(MODULE_DATA_FILE_NAME);
  let currentStoredData: any = { interactiveData: {} };

  if (currentModuleDataFiles.hasNext()) {
    try {
      currentStoredData = JSON.parse(currentModuleDataFiles.next().getBlob().getDataAsString());
    } catch(e) {
      Logger.log(`Error parsing existing module data for ${projectObject.id}, will overwrite: ${e}`);
    }
  }

  let newBgImageFileId = currentStoredData.interactiveData ? currentStoredData.interactiveData.backgroundImageFileId : null;
  let actualBackgroundImageSourceForClient = projectObject.interactiveData.backgroundImage;

  const oldBgImageFileId = newBgImageFileId;

  if (projectObject.interactiveData.backgroundImage) {
    if (oldBgImageFileId) {
      try {
        DriveApp.getFileById(oldBgImageFileId).setTrashed(true);
      } catch(e) {
        Logger.log("Old image/link not found or error trashing: " + e);
      }
    }

    if (projectObject.interactiveData.backgroundImage.startsWith('data:image')) {
      const [header, base64Data] = projectObject.interactiveData.backgroundImage.split(',');
      const mimeType = header.match(/:(.*?);/)![1];
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
      } catch(e) {
        Logger.log("Old image/link not found for deletion: " + e);
      }
    }
    newBgImageFileId = null;
    actualBackgroundImageSourceForClient = null;
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
    thumbnailUrl: actualBackgroundImageSourceForClient,
    interactiveData: {
      backgroundImage: actualBackgroundImageSourceForClient,
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
  } catch (e) {
    Logger.log(`Error deleting project ${projectId}: ${e.toString()}`);
    throw new Error(`Failed to delete project: ${(e as Error).message}`);
  }
}
