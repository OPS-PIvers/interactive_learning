#!/usr/bin/env node

// Script to create a demo public project for testing
import { createBrowser, createPage } from './puppeteer-utils.js';

const DEMO_PROJECT_DATA = {
  id: 'demo_public_project_123',
  title: 'Demo Interactive Module',
  description: 'A demo module for testing public viewing functionality',
  isPublic: true,
  createdBy: 'demo-user',
  createdAt: new Date(),
  updatedAt: new Date(),
  backgroundImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop',
  imageFitMode: 'cover',
  viewerModes: {
    explore: true,
    selfPaced: true,
    timed: false
  },
  hotspots: [
    {
      id: 'hotspot-1',
      x: 30,
      y: 40,
      title: 'Welcome Point',
      description: 'This is a demo hotspot to test the viewer',
      color: 'bg-blue-500',
      size: 'medium'
    },
    {
      id: 'hotspot-2', 
      x: 70,
      y: 60,
      title: 'Info Point',
      description: 'Another demo hotspot with information',
      color: 'bg-green-500',
      size: 'medium'
    }
  ],
  timelineEvents: [
    {
      id: 'event-1',
      step: 1,
      name: 'Welcome Event',
      type: 'SHOW_TEXT',
      textContent: 'Welcome to this interactive demo module!',
      duration: 3000,
      hotspotId: 'hotspot-1'
    },
    {
      id: 'event-2',
      step: 2,
      name: 'Information Event',
      type: 'SHOW_TEXT', 
      textContent: 'This demonstrates how interactive hotspots work.',
      duration: 3000,
      hotspotId: 'hotspot-2'
    }
  ]
};

import { spawn } from 'child_process';

async function createDemoProject() {
  console.log('🎯 Creating demo public project...');
  
  let browser;
  let devServer;
  
  try {
    // Start the dev server
    devServer = spawn('npm', ['run', 'dev']);
    devServer.stdout.on('data', (data) => {
      console.log(`Dev server: ${data}`);
    });
    devServer.stderr.on('data', (data) => {
      console.error(`Dev server error: ${data}`);
    });

    // Wait for the dev server to be ready and get the port
    const url = await new Promise((resolve, reject) => {
      const onData = (data) => {
        const urlMatch = data.toString().match(/http:\/\/localhost:(\d+)/);
        if (urlMatch) {
          cleanup();
          resolve(urlMatch[0]);
        }
      };

      const onError = (data) => {
        cleanup();
        reject(new Error(`Dev server error: ${data}`));
      };

      const cleanup = () => {
        devServer.stdout.removeListener('data', onData);
        devServer.stderr.removeListener('data', onError);
      };

      devServer.stdout.on('data', onData);
      devServer.stderr.on('data', onError);
    });

    // Create browser
    browser = await createBrowser({ headless: true });
    console.log('✓ Browser launched');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Navigate to local development server
    console.log('🌐 Navigating to local app...');
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for Firebase to initialize
    await page.waitForFunction(() => window.firebaseManager, { timeout: 120000 });
    
    // Execute JavaScript to create the demo project
    console.log('📝 Creating demo project via browser...');
    
    const result = await page.evaluate(async (projectData) => {
      try {
        const db = window.firebaseManager.getFirestore();
        
        // Import Firestore methods
        const { doc, setDoc, collection } = window.firebaseModules || {};
        
        if (!doc || !setDoc || !collection) {
          throw new Error('Firestore modules not available');
        }
        
        // Create the main project document
        const projectRef = doc(db, 'projects', projectData.id);
        
        // Prepare project data for Firestore
        const firestoreProject = {
          title: projectData.title,
          description: projectData.description,
          isPublic: projectData.isPublic,
          createdBy: projectData.createdBy,
          createdAt: projectData.createdAt,
          updatedAt: projectData.updatedAt,
          backgroundImage: projectData.backgroundImage,
          imageFitMode: projectData.imageFitMode,
          viewerModes: projectData.viewerModes
        };
        
        await setDoc(projectRef, firestoreProject);
        console.log('✓ Main project document created');
        
        // Create hotspots subcollection
        for (const hotspot of projectData.hotspots) {
          const hotspotRef = doc(db, 'projects', projectData.id, 'hotspots', hotspot.id);
          await setDoc(hotspotRef, hotspot);
        }
        console.log(`✓ Created ${projectData.hotspots.length} hotspots`);
        
        // Create timeline events subcollection
        for (const event of projectData.timelineEvents) {
          const eventRef = doc(db, 'projects', projectData.id, 'timeline_events', event.id);
          await setDoc(eventRef, event);
        }
        console.log(`✓ Created ${projectData.timelineEvents.length} timeline events`);
        
        return { 
          success: true, 
          projectId: projectData.id,
          message: 'Demo project created successfully'
        };
        
      } catch (error) {
        return { 
          success: false, 
          error: error.message,
          stack: error.stack
        };
      }
    }, DEMO_PROJECT_DATA);
    
    console.log('\n📋 Demo Project Creation Result:');
    console.log('==================================');
    
    if (result.success) {
      console.log('✅ Demo project created successfully!');
      console.log(`Project ID: ${result.projectId}`);
      
      // Update the public link file with the new demo project
      const publicUrl = `https://interactive-learning-278.web.app/view/${result.projectId}`;
      console.log(`\n🌐 Public demo URL: ${publicUrl}`);
      
      return result.projectId;
      
    } else {
      console.log('❌ Failed to create demo project:');
      console.log(`Error: ${result.error}`);
      if (result.stack) {
        console.log('Stack trace:', result.stack);
      }
      throw new Error(result.error);
    }
    
  } catch (error) {
    console.error('💥 Script error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the demo project creation
createDemoProject()
  .then(projectId => {
    console.log('\n✅ Demo project ready for testing!');
    console.log(`Test URL: https://interactive-learning-278.web.app/view/${projectId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Demo project creation failed:', error.message);
    process.exit(1);
  });