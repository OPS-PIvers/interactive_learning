# 🚨 URGENT: Firebase Authentication Fix Implementation Plan

## Problem Summary
The app is showing "Could not load projects: Failed to load project summaries: Missing or insufficient permissions" because:

1. Firestore security rules now require authentication
2. Firebase API methods check for `auth.currentUser` 
3. Main App component tries to load projects before authentication is established

## Critical Fixes Required (Deploy within 2-4 hours)

### 🔥 STEP 1: Deploy Security Rules FIRST (Critical - Do Immediately)

**File**: `firestore.rules` - **REPLACE ENTIRELY with**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidProject() {
      return request.resource.data.keys().hasAll(['title', 'description', 'createdBy']) &&
             request.resource.data.title is string &&
             request.resource.data.description is string &&
             request.resource.data.createdBy is string &&
             request.resource.data.title.size() <= 200 &&
             request.resource.data.description.size() <= 1000;
    }
    
    // Projects collection - require authentication and ownership
    match /projects/{projectId} {
      allow read: if isAuthenticated() && isOwner(resource.data.createdBy);
      
      allow create: if isAuthenticated() && 
                       isOwner(request.resource.data.createdBy) &&
                       isValidProject();
      
      allow update: if isAuthenticated() && 
                       isOwner(resource.data.createdBy) &&
                       isValidProject();
      
      allow delete: if isAuthenticated() && 
                       isOwner(resource.data.createdBy);
      
      // Hotspots subcollection
      match /hotspots/{hotspotId} {
        allow read, write: if isAuthenticated() && 
                             isOwner(get(/databases/$(database)/documents/projects/$(projectId)).data.createdBy);
      }
      
      // Timeline events subcollection  
      match /timeline_events/{eventId} {
        allow read, write: if isAuthenticated() && 
                             isOwner(get(/databases/$(database)/documents/projects/$(projectId)).data.createdBy);
      }
    }
    
    // User profiles collection
    match /users/{userId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Deploy immediately**:
```bash
firebase deploy --only firestore:rules
```

### 🔥 STEP 2: Update Main App Component

**File**: `src/client/components/App.tsx` - **REPLACE ENTIRELY with**:

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { Project, InteractiveModuleState, InteractionType } from '../../shared/types';
import ProjectCard from './ProjectCard';
import Modal from './Modal';
import InteractiveModule from './InteractiveModule';
import AdminToggle from './AdminToggle';
import { AuthProvider, useAuth } from '../../lib/authContext';
import { AuthModal } from './AuthModal';
import { appScriptProxy } from '../lib/googleAppScriptProxy';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { useIsMobile, setDynamicVhProperty } from '../hooks/useIsMobile';

// Header component with authentication
const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Interactive Learning Hub</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700 hidden sm:inline">
                    Welcome, {user.displayName || user.email}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};

// Loading component
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main authenticated app content
const AuthenticatedApp: React.FC = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectDetailsLoading, setIsProjectDetailsLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const cleanupVhUpdater = setDynamicVhProperty();
    return () => {
      cleanupVhUpdater();
    };
  }, []);

  // Load projects only when user is authenticated
  const loadProjects = useCallback(async () => {
    if (!user) {
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await appScriptProxy.init();
      const fetchedProjects = await appScriptProxy.listProjects();
      setProjects(fetchedProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(`Could not load projects: ${err.message || 'Please try again later.'}`);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load projects when user authentication state changes
  useEffect(() => {
    if (!loading) {
      loadProjects();
    }
  }, [user, loading, loadProjects]);

  const openProject = useCallback(async (project: Project) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsProjectDetailsLoading(true);
    setError(null);
    try {
      const projectDetails = await appScriptProxy.getProjectDetails(project.id);
      const fullProject: Project = {
        ...project,
        interactiveData: {
          backgroundImage: projectDetails.backgroundImage || null,
          hotspots: projectDetails.hotspots || [],
          timelineEvents: projectDetails.timelineEvents || [],
          imageFitMode: projectDetails.imageFitMode || 'cover',
          viewerModes: projectDetails.viewerModes || { explore: true, selfPaced: true, timed: true }
        }
      };
      setSelectedProject(fullProject);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Failed to open project:", err);
      setError(`Could not open project: ${err.message || 'Please try again later.'}`);
    } finally {
      setIsProjectDetailsLoading(false);
    }
  }, [user]);

  const createNewProject = useCallback(async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const newProject = await appScriptProxy.createProject(
        'New Interactive Project',
        'Click to edit description'
      );
      setSelectedProject(newProject);
      setIsEditingMode(true);
      setIsModalOpen(true);
    } catch (err: any) {
      console.error("Failed to create project:", err);
      setError(`Could not create project: ${err.message || 'Please try again later.'}`);
    }
  }, [user]);

  const handleSaveProject = useCallback(async (project: Project) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      const savedProject = await appScriptProxy.saveProject(project);
      await loadProjects();
      return savedProject;
    } catch (err: any) {
      console.error("Failed to save project:", err);
      setError(`Could not save project: ${err.message || 'Please try again later.'}`);
      throw err;
    }
  }, [user, loadProjects]);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      await appScriptProxy.deleteProject(projectId);
      await loadProjects();
    } catch (err: any) {
      console.error("Failed to delete project:", err);
      setError(`Could not delete project: ${err.message || 'Please try again later.'}`);
    }
  }, [user, loadProjects]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setIsEditingMode(false);
    setError(null);
  }, []);

  // Show loading screen while authentication is being determined
  if (loading) {
    return <LoadingScreen />;
  }

  // Show authentication required screen for non-authenticated users
  if (!user) {
    return (
      <>
        <AppHeader />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-lg">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interactive Learning Hub
              </h1>
              <p className="text-gray-600">
                Create and explore engaging interactive modules.
              </p>
            </div>
            <div className="mb-8">
              <p className="text-gray-700 mb-4">
                Sign in to access your projects and start creating amazing interactive content.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors"
              >
                Get Started - Sign In
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Main authenticated app interface
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            <p className="text-gray-600 mt-1">Create and manage your interactive learning modules</p>
          </div>
          <div className="flex items-center space-x-4">
            <AdminToggle isAdmin={isAdmin} onToggle={setIsAdmin} />
            <button
              onClick={createNewProject}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <PlusCircleIcon className="w-5 h-5" />
              <span>New Project</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <PlusCircleIcon className="w-16 h-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600 mb-6">Create your first interactive learning module to get started.</p>
            <button
              onClick={createNewProject}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => openProject(project)}
                onDelete={isAdmin ? () => handleDeleteProject(project.id) : undefined}
                isLoading={isProjectDetailsLoading}
              />
            ))}
          </div>
        )}
      </main>

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedProject && (
          <InteractiveModule
            project={selectedProject}
            onSave={handleSaveProject}
            isEditingMode={isEditingMode}
            onToggleEditMode={() => setIsEditingMode(!isEditingMode)}
            adminMode={isAdmin}
          />
        )}
      </Modal>
    </div>
  );
};

// Root App component with Auth Provider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

export default App;
```

### 🔥 STEP 3: Update Firebase API Authentication

**File**: `src/lib/firebaseApi.ts` - **ADD these auth checks to existing methods**:

Add these imports at the top:
```typescript
import { auth } from './firebaseConfig';
import { where } from 'firebase/firestore';
```

Update the `listProjects` method:
```typescript
async listProjects(): Promise<Project[]> {
  try {
    // Check authentication first
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to access projects');
    }

    this.logUsage('READ_OPERATIONS', 1);
    const projectsRef = collection(db, 'projects');
    
    // Query only projects created by the current user
    const userProjectsQuery = query(
      projectsRef, 
      where('createdBy', '==', auth.currentUser.uid),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(userProjectsQuery);
    
    const projects: Project[] = snapshot.docs.map((docSnap) => {
      const projectData = docSnap.data();
      return {
        id: docSnap.id,
        title: projectData.title || 'Untitled Project',
        description: projectData.description || '',
        createdBy: projectData.createdBy,
        createdAt: projectData.createdAt?.toDate?.() || new Date(),
        updatedAt: projectData.updatedAt?.toDate?.() || new Date(),
        thumbnailUrl: projectData.thumbnailUrl,
        interactiveData: {
          backgroundImage: projectData.backgroundImage,
          imageFitMode: projectData.imageFitMode || 'cover',
          viewerModes: projectData.viewerModes || { explore: true, selfPaced: true, timed: true },
          hotspots: [], // Will be loaded on demand
          timelineEvents: [] // Will be loaded on demand
        }
      };
    });

    console.log(`Loaded ${projects.length} projects for user ${auth.currentUser.uid}`);
    return projects;

  } catch (error) {
    console.error('Error loading projects:', error);
    throw new Error(`Failed to load projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

Update the `createProject` method by adding auth check at the beginning:
```typescript
async createProject(title: string, description: string): Promise<Project> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to create projects');
    }

    // Continue with existing createProject logic...
    // Make sure to set createdBy: auth.currentUser.uid when saving to Firestore
  }
  // Rest of existing method...
}
```

Update the `saveProject` method by adding auth check and ownership verification:
```typescript
async saveProject(project: Project): Promise<Project> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save projects');
    }

    // For existing projects, verify ownership
    if (project.id !== 'temp') {
      const projectRef = doc(db, 'projects', project.id);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        if (projectData.createdBy !== auth.currentUser.uid) {
          throw new Error('You do not have permission to modify this project');
        }
      }
    }

    // If new project, set createdBy and generate ID
    if (project.id === 'temp') {
      project.id = this.generateProjectId();
      project.createdBy = auth.currentUser.uid;
    }

    // Continue with existing save logic...
  }
  // Rest of existing method...
}
```

### 🔥 STEP 4: Update TypeScript Types

**File**: `src/shared/types.ts` - **ADD to existing Project interface**:

```typescript
export interface Project {
  id: string
  title: string
  description: string
  createdBy: string        // ADD THIS LINE
  createdAt?: Date         // ADD THIS LINE
  updatedAt?: Date         // ADD THIS LINE
  thumbnailUrl?: string
  interactiveData: InteractiveModuleState
}
```

### 🔥 STEP 5: Firebase Console Configuration

**MANUAL STEPS - Do these in Firebase Console**:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: `interactive-learning-278`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable these providers:
   - **Email/Password**: Click "Enable"
   - **Google**: Click "Enable" and add your domain to authorized domains

### 🔥 STEP 6: Deploy All Changes

```bash
# Deploy security rules first
firebase deploy --only firestore:rules

# Build and deploy the app
npm run build
firebase deploy --only hosting
```

## Data Migration for Existing Projects

**AFTER** the above fixes are deployed and working, you'll need to migrate existing projects.

**File**: `scripts/migrate-projects.js` - **CREATE THIS FILE**:

```javascript
// Run this to add createdBy field to existing projects
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCkR-xQevjY3DhKgGoYBrzpP8x-nsII-pA",
  authDomain: "interactive-learning-278.firebaseapp.com", 
  projectId: "interactive-learning-278",
  storageBucket: "interactive-learning-278.firebasestorage.app",
  messagingSenderId: "559846873035",
  appId: "1:559846873035:web:f0abe20a8d354b02a9084e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// REPLACE WITH ACTUAL USER UID AFTER CREATING TEST ACCOUNT
const DEFAULT_USER_UID = 'REPLACE_WITH_REAL_USER_UID';

async function migrateProjects() {
  console.log('🔄 Starting project migration...');
  
  try {
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`📊 Found ${projectsSnapshot.size} projects to migrate`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of projectsSnapshot.docs) {
      const projectData = docSnap.data();
      
      if (projectData.createdBy) {
        console.log(`✅ Project ${docSnap.id} already has createdBy field`);
        skipped++;
        continue;
      }

      console.log(`🔄 Migrating project ${docSnap.id}...`);
      
      await updateDoc(doc(db, 'projects', docSnap.id), {
        createdBy: DEFAULT_USER_UID,
        updatedAt: new Date()
      });
      
      migrated++;
    }

    console.log(`\n📈 Migration Complete:`);
    console.log(`  ✅ Migrated: ${migrated} projects`);
    console.log(`  ⏭️  Skipped: ${skipped} projects`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

migrateProjects();
```

## Testing Steps

1. **Deploy the fixes above**
2. **Open app in browser** - should show "Sign In" screen
3. **Create new account** using email/password
4. **Try creating a project** - should work
5. **Sign out and sign back in** - projects should persist

## Troubleshooting

### If still getting permissions error:
- Check that Firestore rules were deployed: `firebase deploy --only firestore:rules`
- Check Firebase Console → Authentication → Sign-in method is enabled
- Check browser dev tools for specific error messages

### If authentication not working:
- Enable Email/Password in Firebase Console
- Add your domain to authorized domains for Google sign-in
- Check Firebase config keys in `firebaseConfig.ts`

## Expected Behavior After Fix

✅ **Unauthenticated users** see sign-in screen  
✅ **Authenticated users** see their own projects only  
✅ **New projects** are automatically owned by creator  
✅ **Existing projects** can be migrated to have owners  
✅ **Security** prevents unauthorized access to data  

## Priority Order

1. **FIRST**: Deploy Firestore rules (prevents data access issues)
2. **SECOND**: Enable authentication in Firebase Console
3. **THIRD**: Deploy code changes
4. **FOURTH**: Test authentication flow
5. **LAST**: Run migration script for existing data

This should resolve the permissions error and establish proper authentication for your app.
