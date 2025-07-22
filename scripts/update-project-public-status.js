#!/usr/bin/env node

// Admin script to update project public status in Firestore
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'interactive-learning-278';
let TARGET_PROJECT_ID = 'proj_1753151092608_8rgpf';

async function updateProjectPublicStatus() {
  console.log('🔥 Starting Firebase Admin update for project:', TARGET_PROJECT_ID);
  
  try {
    // Initialize Firebase Admin SDK
    // For production, you'd use service account key:
    // const serviceAccount = require('../path/to/serviceAccountKey.json');
    // initializeApp({
    //   credential: cert(serviceAccount),
    //   projectId: PROJECT_ID
    // });
    
    // For development with application default credentials or emulator
    initializeApp({
      projectId: PROJECT_ID
    });
    
    const db = getFirestore();
    console.log('✓ Firebase Admin initialized');
    
    // Get reference to the specific project document
    const projectRef = db.collection('projects').doc(TARGET_PROJECT_ID);
    
    // Check if project exists first
    const projectDoc = await projectRef.get();
    
    if (!projectDoc.exists) {
      console.error('❌ Project not found:', TARGET_PROJECT_ID);
      console.log('Available projects in collection:');
      
      // List a few project IDs to help debug
      const projectsSnapshot = await db.collection('projects').limit(10).get();
      projectsSnapshot.forEach(doc => {
        console.log(`  - ${doc.id}`);
      });
      
      return;
    }
    
    console.log('✓ Project found');
    console.log('Current project data:', projectDoc.data());
    
    // Update the project to make it public
    await projectRef.update({
      isPublic: true,
      updatedAt: new Date()
    });
    
    console.log('✓ Project updated successfully!');
    console.log(`Project ${TARGET_PROJECT_ID} is now public`);
    
    // Verify the update
    const updatedDoc = await projectRef.get();
    const updatedData = updatedDoc.data();
    console.log('Updated isPublic status:', updatedData.isPublic);
    
    // Also log the public view URL
    console.log('\n🌐 Public view URL:');
    console.log(`https://interactive-learning-278.web.app/view/${TARGET_PROJECT_ID}`);
    
  } catch (error) {
    console.error('💥 Error updating project:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔑 Permission denied. This could mean:');
      console.log('1. You need to authenticate with Firebase (run: firebase login)');
      console.log('2. You need a service account key for production');
      console.log('3. Firebase emulator needs to be running for local development');
      console.log('\nFor local development, try running:');
      console.log('  firebase emulators:start --only firestore');
    } else if (error.code === 'not-found') {
      console.log('\n📋 Project not found. Check the project ID is correct.');
    }
    
    throw error;
  }
}

// Handle command line arguments
if (process.argv.length > 2) {
  const customProjectId = process.argv[2];
  console.log(`Using custom project ID: ${customProjectId}`);
  TARGET_PROJECT_ID = customProjectId;
}

// Run the update
updateProjectPublicStatus()
  .then(() => {
    console.log('\n✅ Update completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  });