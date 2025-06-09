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
    const folder = DriveApp.getFoldersByName('Interactive Training Modules').next();
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
    // Return mock data for development
    return getMockProjects();
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
      folder.createFile('module_data.json', dataContent, MimeType.PLAIN_TEXT);
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
    
    // Convert base64 to blob
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    
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