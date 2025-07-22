#!/usr/bin/env node

// Script to fix public project access by updating Firestore document via browser automation
import { createBrowser, createPage } from './puppeteer-utils.js';

const TARGET_PROJECT_ID = 'proj_1753151092608_8rgpf';
const LOCAL_SERVER = 'http://localhost:3000';

async function fixPublicProject() {
  console.log('🔥 Starting public project fix for:', TARGET_PROJECT_ID);
  
  let browser;
  
  try {
    // Create browser (headless for CI environment)
    browser = await createBrowser({ headless: true });
    console.log('✓ Browser launched');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // Navigate to the local app
    console.log('🌐 Navigating to local app...');
    await page.goto(LOCAL_SERVER, { waitUntil: 'networkidle2' });
    
    // Wait for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Execute JavaScript to update the project directly using client-side Firebase
    console.log('🔧 Updating project via client-side Firebase...');
    
    const result = await page.evaluate(async (projectId) => {
      // Wait for Firebase to be available
      let retries = 10;
      while (retries > 0 && !window.firebaseManager) {
        await new Promise(resolve => setTimeout(resolve, 500));
        retries--;
      }
      
      if (!window.firebaseManager) {
        throw new Error('Firebase not available on window');
      }
      
      try {
        // Initialize Firebase if needed
        await window.firebaseManager.initialize();
        const db = window.firebaseManager.getFirestore();
        
        // Import Firestore methods
        const { doc, updateDoc, getDoc, serverTimestamp } = window.firebaseModules || {};
        
        if (!doc || !updateDoc || !getDoc) {
          throw new Error('Firestore modules not available');
        }
        
        // Get project reference
        const projectRef = doc(db, 'projects', projectId);
        
        // Check if project exists
        const projectDoc = await getDoc(projectRef);
        
        if (!projectDoc.exists()) {
          return { success: false, error: 'Project not found', projectId };
        }
        
        console.log('Current project data:', projectDoc.data());
        
        // Update the project to make it public
        await updateDoc(projectRef, {
          isPublic: true,
          updatedAt: serverTimestamp()
        });
        
        // Verify the update
        const updatedDoc = await getDoc(projectRef);
        const updatedData = updatedDoc.data();
        
        return { 
          success: true, 
          projectId,
          isPublic: updatedData.isPublic,
          updatedAt: updatedData.updatedAt
        };
        
      } catch (error) {
        return { success: false, error: error.message, projectId };
      }
    }, TARGET_PROJECT_ID);
    
    console.log('\n📋 Update Result:');
    console.log('================');
    
    if (result.success) {
      console.log('✅ Project updated successfully!');
      console.log(`Project ID: ${result.projectId}`);
      console.log(`Is Public: ${result.isPublic}`);
      console.log(`Updated At: ${result.updatedAt}`);
      
      // Test the public URL
      console.log('\n🌐 Testing public access...');
      const publicUrl = `${LOCAL_SERVER}/view/${TARGET_PROJECT_ID}`;
      await page.goto(publicUrl, { waitUntil: 'networkidle2' });
      
      // Take screenshot
      await page.screenshot({ path: 'public-project-test.png' });
      console.log('📸 Screenshot saved as public-project-test.png');
      
      // Check if the project loads without error
      const pageContent = await page.evaluate(() => document.body.textContent);
      
      if (pageContent.includes('Module Unavailable')) {
        console.log('⚠️  Project still shows as unavailable - may need additional fixes');
      } else if (pageContent.includes('Loading')) {
        console.log('🔄 Project is loading - this is expected');
      } else {
        console.log('✅ Project appears to be loading correctly');
      }
      
    } else {
      console.log('❌ Failed to update project:');
      console.log(`Error: ${result.error}`);
      console.log(`Project ID: ${result.projectId}`);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Check if local server is running
console.log('🔍 Checking local development server...');
console.log('Make sure you have run: npm run dev');
console.log('Server should be running on: http://localhost:3000');
console.log('');

// Run the fix
fixPublicProject()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  });