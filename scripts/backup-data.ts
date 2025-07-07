#!/usr/bin/env ts-node

import { firebaseAPI } from '../src/lib/firebaseApi'
import * as fs from 'fs'
import * as path from 'path'

async function backupAllData() {
  console.log('Starting Firebase data backup...')
  const overallStartTime = Date.now();
  let totalProjectsBackedUp = 0;
  let totalHotspots = 0;
  let totalTimelineEvents = 0;

  try {
    const projectsSummary = await firebaseAPI.listProjects(); // Assuming this list doesn't contain full data
    console.log(`Found ${projectsSummary.length} projects to back up.`);

    const backupDate = new Date();
    const dateString = backupDate.toISOString().split('T')[0];
    const baseBackupDir = path.join(process.cwd(), 'backups', dateString);

    if (!fs.existsSync(baseBackupDir)) {
      fs.mkdirSync(baseBackupDir, { recursive: true });
      console.log(`Created backup directory: ${baseBackupDir}`);
    }

    for (let i = 0; i < projectsSummary.length; i++) {
      const projectSummary = projectsSummary[i];
      const projectId = projectSummary.id; // Assuming project summary has an 'id'
      console.log(`\nBacking up project ${i + 1}/${projectsSummary.length}: ${projectId}...`);
      const projectStartTime = Date.now();

      try {
        // Fetch the full project data here.
        // We assume firebaseAPI.getProject(projectId) fetches the full project document.
        // If projectSummary from listProjects() is already the full data, this call can be skipped
        // and projectSummary can be used directly. For this example, let's assume we need to fetch.
        const projectData = await firebaseAPI.getProject(projectId);

        if (!projectData) {
          console.warn(`⚠️ Project ${projectId} data not found. Skipping.`);
          continue;
        }

        const projectBackupPath = path.join(baseBackupDir, `${projectId}.json`);
        fs.writeFileSync(projectBackupPath, JSON.stringify(projectData, null, 2));

        const hotspotsCount = projectData.interactiveData?.hotspots?.length || 0;
        const timelineEventsCount = projectData.interactiveData?.timelineEvents?.length || 0;
        totalHotspots += hotspotsCount;
        totalTimelineEvents += timelineEventsCount;
        totalProjectsBackedUp++;

        const projectEndTime = Date.now();
        console.log(`✅ Successfully backed up project ${projectId} to ${projectBackupPath} (${((projectEndTime - projectStartTime)/1000).toFixed(2)}s)`);
        console.log(`   Hotspots: ${hotspotsCount}, Timeline Events: ${timelineEventsCount}`);

      } catch (projectError) {
        console.error(`❌ Failed to back up project ${projectId}:`, projectError);
        // Optionally, write this error to a per-project error log or a summary error log
      }
    }

    const overallEndTime = Date.now();
    console.log(`\n\n🎉 Firebase data backup process completed!`);
    console.log(`--------------------------------------------------`);
    console.log(`🗓️  Backup Date: ${backupDate.toLocaleString()}`);
    console.log(`🗂️  Backup Directory: ${baseBackupDir}`);
    console.log(`📊 Projects Attempted: ${projectsSummary.length}`);
    console.log(`✔️  Projects Successfully Backed Up: ${totalProjectsBackedUp}`);
    console.log(`❌ Projects Failed: ${projectsSummary.length - totalProjectsBackedUp}`);
    console.log(`♨️  Total Hotspots Backed Up: ${totalHotspots}`);
    console.log(`⏳ Total Timeline Events Backed Up: ${totalTimelineEvents}`);
    console.log(`⏱️  Total Backup Time: ${((overallEndTime - overallStartTime)/1000).toFixed(2)}s`);
    console.log(`--------------------------------------------------`);

  } catch (error) {
    console.error('❌ Main backup process failed:', error);
    process.exit(1)
  }
}

// Run backup if called directly
if (require.main === module) {
  backupAllData()
}

export { backupAllData }