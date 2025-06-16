function doGet(): GoogleAppsScript.HTML.HtmlOutput {
  const htmlTemplate = HtmlService.createTemplateFromFile('index');
  const htmlOutput = htmlTemplate.evaluate();
  
  htmlOutput.setTitle('Interactive Training Modules');
  htmlOutput.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  htmlOutput.addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  
  return htmlOutput;
}

function include(filename: string): string {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Data storage functions for the interactive modules
function getProjects(): any[] {
  try {
    // Check if the main folder exists first
    const folders = DriveApp.getFoldersByName('Interactive Training Modules');
    if (!folders.hasNext()) {
      // Create the main folder if it doesn't exist
      const mainFolder = DriveApp.createFolder('Interactive Training Modules');
      console.log('Created main folder: Interactive Training Modules');
      return []; // Return empty array for new installation
    }
    
    const folder = folders.next();
    const projects: any[] = [];
    
    const projectFolders = folder.getFolders();
    while (projectFolders.hasNext()) {
      const projectFolder = projectFolders.next();
      const projectData = getProjectData(projectFolder.getId());
      if (projectData) {
        projects.push(projectData);
      }
    }
    
    return projects;
  } catch (error) {
    console.error('Error getting projects:', error);
    // Re-throw the error to be handled by the client proxy
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while retrieving projects: ' + String(error));
  }
}

function gs_saveUrlAsLinkFile(projectFolder: GoogleAppsScript.Drive.Folder, url: string, baseFilename: string): string | undefined {
  try {
    const fileName = `${baseFilename}.link`;
    // Check if file with same name exists and delete it
    const existingFiles = projectFolder.getFilesByName(fileName);
    if (existingFiles.hasNext()) {
      existingFiles.next().setTrashed(true);
    }
    const file = projectFolder.createFile(fileName, url, MimeType.PLAIN_TEXT);
    return file.getId();
  } catch (error) {
    console.error('Error saving URL as link file:', error);
    return undefined;
  }
}

function getProjectData(projectId: string): any {
  try {
    const folder = DriveApp.getFolderById(projectId);
    const files = folder.getFilesByName('module_data.json');
    
    if (files.hasNext()) {
      const dataFile = files.next();
      const content = dataFile.getBlob().getDataAsString();
      const projectData = JSON.parse(content);
      
      // Get background image if exists
      let backgroundImage = undefined;
      if (projectData.backgroundImageFileId) {
        try {
          const imageFile = DriveApp.getFileById(projectData.backgroundImageFileId);
          const blob = imageFile.getBlob();
          const base64 = Utilities.base64Encode(blob.getBytes());
          const mimeType = blob.getContentType();
          backgroundImage = `data:${mimeType};base64,${base64}`;
        } catch (imageError) {
          console.error('Error loading background image:', imageError);
        }
      }
      
      return {
        id: projectId,
        title: folder.getName(),
        description: projectData.description || '',
        thumbnailUrl: backgroundImage,
        interactiveData: {
          backgroundImage,
          hotspots: projectData.hotspots || [],
          timelineEvents: projectData.timelineEvents || []
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project data:', error);
    return null;
  }
}

function saveProjectData(projectData: any): any {
  try {
    let folder;
    
    if (projectData.id) {
      // Update existing project
      folder = DriveApp.getFolderById(projectData.id);
    } else {
      // Create new project
      const parentFolder = DriveApp.getFoldersByName('Interactive Training Modules').next();
      folder = parentFolder.createFolder(projectData.title);
    }
    
    // Save module data
    const dataToSave = {
      description: projectData.description,
      hotspots: projectData.interactiveData.hotspots,
      timelineEvents: projectData.interactiveData.timelineEvents,
      backgroundImageFileId: projectData.backgroundImageFileId
    };
    
    const dataContent = JSON.stringify(dataToSave, null, 2);
    
    // Check if module_data.json exists
    const existingFiles = folder.getFilesByName('module_data.json');
    if (existingFiles.hasNext()) {
      // Update existing file
      const existingFile = existingFiles.next();
      existingFile.setContent(dataContent);
    } else {
      // Create new file
      folder.createFile('module_data.json', dataContent);
    }
    
    return {
      success: true,
      id: folder.getId(),
      message: 'Project saved successfully'
    };
  } catch (error) {
    console.error('Error saving project data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function deleteProject(projectId: string): any {
  try {
    const folder = DriveApp.getFolderById(projectId);
    folder.setTrashed(true);
    
    return {
      success: true,
      message: 'Project deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting project:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function saveImageToProject(projectId: string, imageData: string, filename: string): any {
  try {
    const folder = DriveApp.getFolderById(projectId);
    
    // Extract base64 data
    const base64Data = imageData.split(',')[1];
    const mimeType = imageData.split(',')[0].split(':')[1].split(';')[0];
    let extension = '';
    switch (mimeType) {
      case 'image/jpeg':
        extension = '.jpg';
        break;
      case 'image/png':
        extension = '.png';
        break;
      case 'image/gif':
        extension = '.gif';
        break;
      default:
        // Try to get extension from filename if provided and valid, otherwise default to .jpg
        const parts = filename.split('.');
        if (parts.length > 1) {
          const ext = parts.pop();
          if (ext && ['jpg', 'jpeg', 'png', 'gif'].indexOf(ext.toLowerCase()) !== -1) {
            extension = '.' + ext.toLowerCase();
          } else {
            extension = '.jpg'; // default if unrecognized
          }
        } else {
          extension = '.jpg'; // default if no extension
        }
        console.warn(`Uncommon mime type: ${mimeType}, defaulting extension to ${extension} or using provided.`);
    }
    const finalFilename = filename.includes('.') ? filename : `${filename}${extension}`;
    
    // Convert base64 to blob
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, finalFilename);
    
    // Save file to project folder
    const file = folder.createFile(blob);
    
    return {
      success: true,
      fileId: file.getId(),
      message: 'Image saved successfully'
    };
  } catch (error) {
    console.error('Error saving image:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

// Client-callable functions for Google Apps Script proxy
function gs_listProjects(): any[] {
  return getProjects();
}

function gs_createProject(title: string, description: string): any {
  try {
    // Create main folder if it doesn't exist
    let parentFolder;
    const folders = DriveApp.getFoldersByName('Interactive Training Modules');
    if (folders.hasNext()) {
      parentFolder = folders.next();
    } else {
      parentFolder = DriveApp.createFolder('Interactive Training Modules');
    }
    
    // Create project folder
    const projectFolder = parentFolder.createFolder(title);
    const projectId = projectFolder.getId();
    
    // Create initial module data
    const initialData = {
      description: description,
      hotspots: [],
      timelineEvents: [],
      backgroundImageFileId: undefined
    };
    
    const dataContent = JSON.stringify(initialData, null, 2);
    projectFolder.createFile('module_data.json', dataContent);
    
    // Return project data in expected format
    return {
      id: projectId,
      title: title,
      description: description,
      thumbnailUrl: undefined,
      interactiveData: {
        backgroundImage: undefined,
        hotspots: [],
        timelineEvents: []
      }
    };
  } catch (error) {
    console.error('Error creating project:', error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

function gs_saveProject(project: any): any { // Modified return type
  try {
    const folder = DriveApp.getFolderById(project.id);
    let existingBackgroundImageFileId: string | undefined = undefined;
    let moduleData: any = {};

    // Fetch existing project data from module_data.json
    try {
      const files = folder.getFilesByName('module_data.json');
      if (files.hasNext()) {
        const dataFile = files.next();
        const content = dataFile.getBlob().getDataAsString();
        moduleData = JSON.parse(content);
        existingBackgroundImageFileId = moduleData.backgroundImageFileId;
      }
    } catch (e) {
      console.error('Error reading or parsing module_data.json:', e);
      // Proceed as if there's no existing image
    }

    // Handle background image if present
    let backgroundImageFileId = existingBackgroundImageFileId;
    const newImageSource = project.interactiveData.backgroundImage;

    // Case 1: newImageSource is a URL
    if (newImageSource && (newImageSource.startsWith('http://') || newImageSource.startsWith('https://'))) {
      if (existingBackgroundImageFileId) {
        try {
          const existingFile = DriveApp.getFileById(existingBackgroundImageFileId);
          if (existingFile.getName().endsWith('.link')) {
            const oldUrl = existingFile.getBlob().getDataAsString();
            if (oldUrl === newImageSource) {
              // URL is the same, no change needed
            } else {
              existingFile.setTrashed(true);
              backgroundImageFileId = gs_saveUrlAsLinkFile(folder, newImageSource, 'background');
            }
          } else {
            // Old file is not a link file, so delete it and save the new one
            existingFile.setTrashed(true);
            backgroundImageFileId = gs_saveUrlAsLinkFile(folder, newImageSource, 'background');
          }
        } catch (e) {
          console.error('Error processing existing background image (URL):', e);
          // If there was an error (e.g. file not found), try to save the new one
          backgroundImageFileId = gs_saveUrlAsLinkFile(folder, newImageSource, 'background');
        }
      } else {
        backgroundImageFileId = gs_saveUrlAsLinkFile(folder, newImageSource, 'background');
      }
    }
    // Case 2: newImageSource is base64 data
    else if (newImageSource && newImageSource.startsWith('data:')) {
      if (existingBackgroundImageFileId) {
        try {
          DriveApp.getFileById(existingBackgroundImageFileId).setTrashed(true);
        } catch (e) {
          console.error('Error trashing existing background image (base64):', e);
        }
      }
      const imageResult = saveImageToProject(project.id, newImageSource, 'background'); // Filename will be adjusted by saveImageToProject
      if (imageResult.success) {
        backgroundImageFileId = imageResult.fileId;
      } else {
        backgroundImageFileId = undefined; // Or handle error appropriately
      }
    }
    // Case 3: newImageSource is null or undefined (image removed)
    else if (!newImageSource && existingBackgroundImageFileId) {
      try {
        DriveApp.getFileById(existingBackgroundImageFileId).setTrashed(true);
        backgroundImageFileId = undefined;
      } catch (e) {
        console.error('Error trashing existing background image (removed):', e);
        backgroundImageFileId = undefined; // Ensure it's undefined even if deletion failed
      }
    }
    
    // Update project data
    const dataToSave = {
      description: project.description,
      hotspots: project.interactiveData.hotspots,
      timelineEvents: project.interactiveData.timelineEvents,
      backgroundImageFileId: backgroundImageFileId
    };
    
    const dataContent = JSON.stringify(dataToSave, null, 2);
    
    // Update module_data.json
    const existingFiles = folder.getFilesByName('module_data.json');
    if (existingFiles.hasNext()) {
      const existingFile = existingFiles.next();
      existingFile.setContent(dataContent);
    } else {
      folder.createFile('module_data.json', dataContent);
    }
    
    // Update folder name if title changed
    if (folder.getName() !== project.title) {
      folder.setName(project.title);
    }

    // Fetch the complete project data to return, similar to getProjectData
    const updatedProjectData = getProjectData(folder.getId());
    if (updatedProjectData) {
      return updatedProjectData;
    } else {
      console.error(`Failed to retrieve project data for ${folder.getId()} after save.`);
      throw new Error(`Failed to retrieve project data for ${folder.getId()} after save.`);
    }
    
  } catch (error) {
    console.error('Error saving project:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while saving the project: ' + String(error));
  }
}

function gs_deleteProject(projectId: string): { success: boolean; projectId: string } { // Modified return type
  try {
    const folder = DriveApp.getFolderById(projectId);
    folder.setTrashed(true);
    console.log(`Project ${projectId} trashed.`); // Added log for clarity
    return { success: true, projectId: projectId }; // Return success object
  } catch (error) {
    console.error('Error deleting project:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while deleting the project: ' + String(error));
  }
}

// Mock data for development/fallback
function getMockProjects(): any[] {
  return [
    {
      id: 'mock-1',
      title: 'Sample Interactive Module',
      description: 'A demonstration of the interactive learning system',
      thumbnailUrl: undefined,
      interactiveData: {
        backgroundImage: undefined,
        hotspots: [
          {
            id: 'hotspot-1',
            x: 25,
            y: 30,
            title: 'Start Here',
            description: 'This is your first hotspot',
            color: 'bg-blue-500'
          }
        ],
        timelineEvents: [
          {
            id: 'event-1',
            step: 1,
            name: 'Introduction',
            type: 'SHOW_HOTSPOT',
            targetId: 'hotspot-1'
          }
        ]
      }
    }
  ];
}