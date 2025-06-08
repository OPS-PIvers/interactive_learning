
import { Project, InteractiveModuleState, InteractionType } from '../types';

// Initial in-memory database for the mock environment
let mockProjectsDB: Project[] = [
  {
    id: 'mock_proj_flower_01',
    title: "Mock: Exploring Flower Anatomy (All Interactions Demo)",
    description: "Learn about flower parts with all interaction types demonstrated. (Mock Data)",
    thumbnailUrl: 'https://picsum.photos/seed/flower_anatomy_thumb/400/250',
    interactiveData: {
      backgroundImage: 'https://picsum.photos/seed/flower_anatomy_bg_detailed/800/600',
      hotspots: [
        { id: 'mock_h_petal', x: 50, y: 20, title: 'Petal (Mock)', description: 'Petals are often brightly colored to attract pollinators. They form the corolla.', color: 'bg-pink-500' },
        { id: 'mock_h_stamen', x: 40, y: 50, title: 'Stamen (Mock)', description: 'The pollen-producing part of a flower, consisting of an anther and a filament.', color: 'bg-yellow-500' },
        { id: 'mock_h_sepal', x: 60, y: 75, title: 'Sepal (Mock)', description: 'Sepals are leaf-like structures that enclose the developing bud. They form the calyx.', color: 'bg-green-500' },
      ],
      timelineEvents: [
        { id: 'mock_te_01_welcome', step: 1, name: 'Welcome Message', type: InteractionType.SHOW_MESSAGE, message: "Welcome! Let's explore the flower's anatomy." },
        { id: 'mock_te_02_show_petal', step: 2, name: 'Show Petal', type: InteractionType.SHOW_HOTSPOT, targetId: 'mock_h_petal' },
        { id: 'mock_te_03_petal_info', step: 3, name: 'Petal Information', type: InteractionType.SHOW_MESSAGE, message: 'This is a petal. It helps attract pollinators.' },
        { id: 'mock_te_04_panzoom_petal', step: 4, name: 'Zoom to Petal', type: InteractionType.PAN_ZOOM_TO_HOTSPOT, targetId: 'mock_h_petal', zoomFactor: 2.5 },
        { id: 'mock_te_05_highlight_petal', step: 5, name: 'Highlight Petal', type: InteractionType.HIGHLIGHT_HOTSPOT, targetId: 'mock_h_petal', highlightRadius: 50 },
        { id: 'mock_te_06_show_stamen', step: 6, name: 'Show Stamen (Resets View)', type: InteractionType.SHOW_HOTSPOT, targetId: 'mock_h_stamen' },
        { id: 'mock_te_07_stamen_info', step: 7, name: 'Stamen Information', type: InteractionType.SHOW_MESSAGE, message: "Now, let's look at the stamen, the pollen-producing part." },
        { id: 'mock_te_08_pulse_stamen', step: 8, name: 'Pulse Stamen', type: InteractionType.PULSE_HOTSPOT, targetId: 'mock_h_stamen', duration: 3000 },
        { id: 'mock_te_09_show_sepal', step: 9, name: 'Show Sepal', type: InteractionType.SHOW_HOTSPOT, targetId: 'mock_h_sepal' },
        { id: 'mock_te_10_sepal_info', step: 10, name: 'Sepal Information', type: InteractionType.SHOW_MESSAGE, message: 'This is a sepal. It protects the flower bud.' },
        { id: 'mock_te_11_hide_sepal', step: 11, name: 'Hide Sepal', type: InteractionType.HIDE_HOTSPOT, targetId: 'mock_h_sepal' },
        { id: 'mock_te_12_end_message', step: 12, name: 'End Message', type: InteractionType.SHOW_MESSAGE, message: 'The sepal is now hidden. End of tour!' },
      ],
    },
  },
  {
    id: 'mock_proj_world_map_02',
    title: "Mock: World Capitals Quiz",
    description: "Test your knowledge of world capitals. (Mock Data)",
    thumbnailUrl: 'https://picsum.photos/seed/world_map/400/250',
    interactiveData: {
      backgroundImage: 'https://picsum.photos/seed/world_map_bg/800/600',
      hotspots: [
        { id: 'mock_h_paris', x: 48, y: 45, title: 'Paris (Mock)', description: 'Capital of France.', color: 'bg-blue-500' },
      ],
      timelineEvents: [
        { id: 'mock_te_intro_map', step: 1, name: 'Map Intro', type: InteractionType.SHOW_MESSAGE, message: 'Find the capital cities on the map! (Mock)' },
      ],
    },
  },
];

const IS_APPS_SCRIPT_ENVIRONMENT = typeof google !== 'undefined' && typeof google.script !== 'undefined' && typeof google.script.run !== 'undefined';

if (!IS_APPS_SCRIPT_ENVIRONMENT) {
  console.warn(
    "Google Apps Script environment not detected. Using MOCK 'google.script.run' for local development. " +
    "Data will be in-memory and WILL NOT BE PERSISTED. Deploy to Apps Script for real data operations."
  );
}

const getRunner = () => {
  if (IS_APPS_SCRIPT_ENVIRONMENT) {
    return google.script.run;
  }

  // Mock implementation for local development
  const mockRunner = {
    _successCallback: (...args: any[]) => { console.log("Mock success:", ...args) },
    _failureCallback: (err: Error) => { console.error("Mock failure:", err); },

    withSuccessHandler: function(callback: (result: any, userObject?: any) => void) {
      this._successCallback = callback;
      return this;
    },
    withFailureHandler: function(callback: (error: Error, userObject?: any) => void) {
      this._failureCallback = callback;
      return this;
    },
    withUserObject: function(userObject: any) {
      // Not extensively used in this app's proxy, but good to have for completeness
      this._userObject = userObject;
      return this;
    },

    // Mocked gs_functions
    gs_listProjects: function() {
      console.log("MOCK gs_listProjects called");
      setTimeout(() => {
        try {
          this._successCallback(JSON.parse(JSON.stringify(mockProjectsDB)), this._userObject);
        } catch (e) {
          this._failureCallback(e instanceof Error ? e : new Error(String(e)), this._userObject);
        }
      }, 100 + Math.random() * 200);
    },

    gs_createProject: function(title: string, description: string) {
      console.log(`MOCK gs_createProject called with title: ${title}`);
      setTimeout(() => {
        try {
          const newProject: Project = {
            id: `mock_proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            title,
            description,
            thumbnailUrl: `https://picsum.photos/seed/${Math.random().toString(36).substring(2, 7)}/400/250`,
            interactiveData: {
              backgroundImage: undefined,
              hotspots: [],
              timelineEvents: [],
            },
          };
          mockProjectsDB.push(newProject);
          this._successCallback(JSON.parse(JSON.stringify(newProject)), this._userObject);
        } catch (e) {
          this._failureCallback(e instanceof Error ? e : new Error(String(e)), this._userObject);
        }
      }, 100 + Math.random() * 200);
    },

    gs_saveProject: function(project: Project) {
      console.log(`MOCK gs_saveProject called for project ID: ${project.id}`);
      setTimeout(() => {
        try {
          const index = mockProjectsDB.findIndex(p => p.id === project.id);
          if (index !== -1) {
            // Simulate creation of thumbnail from background image if not present (simple logic)
            const projectCopy = JSON.parse(JSON.stringify(project));
            if (projectCopy.interactiveData.backgroundImage && !projectCopy.thumbnailUrl) {
                projectCopy.thumbnailUrl = projectCopy.interactiveData.backgroundImage;
            }
            mockProjectsDB[index] = projectCopy;
            this._successCallback(undefined, this._userObject); // gs_saveProject often returns void or a success message string
          } else {
            // Optionally, create if not found, or error out.
            // For this mock, let's assume it should exist for save.
             this._failureCallback(new Error(`Mock: Project with ID ${project.id} not found for saving.`), this._userObject);
          }
        } catch (e) {
          this._failureCallback(e instanceof Error ? e : new Error(String(e)), this._userObject);
        }
      }, 100 + Math.random() * 200);
    },

    gs_deleteProject: function(projectId: string) {
      console.log(`MOCK gs_deleteProject called for project ID: ${projectId}`);
      setTimeout(() => {
        try {
          const initialLength = mockProjectsDB.length;
          mockProjectsDB = mockProjectsDB.filter(p => p.id !== projectId);
          if (mockProjectsDB.length < initialLength) {
            this._successCallback(undefined, this._userObject); // gs_deleteProject often returns void or a success message string
          } else {
            this._failureCallback(new Error(`Mock: Project with ID ${projectId} not found for deletion.`), this._userObject);
          }
        } catch (e) {
          this._failureCallback(e instanceof Error ? e : new Error(String(e)), this._userObject);
        }
      }, 100 + Math.random() * 200);
    }
  };
  return mockRunner as unknown as GoogleScriptRun; // Cast to satisfy type system
};

export const appScriptProxy = {
  init: async (): Promise<void> => {
    // This function is called from App.tsx. The IS_APPS_SCRIPT_ENVIRONMENT check and
    // console warning are handled globally in this file when it's imported.
    console.log("appScriptProxy: init invoked.");
    return Promise.resolve();
  },

  listProjects: async (): Promise<Project[]> => {
    console.log("appScriptProxy: Forwarding to (mock or real) gs_listProjects");
    return new Promise((resolve, reject) => {
      getRunner()
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .gs_listProjects();
    });
  },

  createProject: async (title: string, description: string): Promise<Project> => {
    console.log(`appScriptProxy: Forwarding to (mock or real) gs_createProject with title: ${title}`);
    return new Promise((resolve, reject) => {
      getRunner()
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        .gs_createProject(title, description);
    });
  },

  saveProject: async (project: Project): Promise<void> => {
    // Note: The server-side gs_saveProject might return the updated project or just a success status.
    // This proxy matches void for simplicity with current mock setup.
    // If gs_saveProject returns the updated Project, change Promise<void> to Promise<Project>.
    console.log(`appScriptProxy: Forwarding to (mock or real) gs_saveProject for project ID: ${project.id}`);
    return new Promise((resolve, reject) => {
      getRunner()
        .withSuccessHandler((response) => resolve(response)) // Handle potential response from save
        .withFailureHandler(reject)
        .gs_saveProject(project);
    });
  },

  deleteProject: async (projectId: string): Promise<void> => {
    // Similar to save, if gs_deleteProject returns specific data, adjust Promise type.
    console.log(`appScriptProxy: Forwarding to (mock or real) gs_deleteProject for project ID: ${projectId}`);
    return new Promise((resolve, reject) => {
      getRunner()
        .withSuccessHandler((response) => resolve(response))
        .withFailureHandler(reject)
        .gs_deleteProject(projectId);
    });
  },
};
