#!/usr/bin/env ts-node

import { firebaseAPI } from '../src/lib/firebaseApi'
import * as fs from 'fs'
import * as path from 'path'

async function backupAllData() {
  console.log('Starting Firebase data backup...')
  
  try {
    const projects = await firebaseAPI.listProjects()
    
    const backup = {
      timestamp: new Date().toISOString(),
      exportedAt: new Date().toLocaleString(),
      projectCount: projects.length,
      projects: projects.map(project => ({
        ...project,
        hotspotCount: project.interactiveData.hotspots.length,
        timelineEventCount: project.interactiveData.timelineEvents.length
      }))
    }
    
    // Create backups directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `backup-${timestamp}-${Date.now()}.json`
    const filepath = path.join(backupDir, filename)
    
    // Write backup file
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2))
    
    console.log(`✅ Backup completed successfully!`)
    console.log(`📁 File: ${filepath}`)
    console.log(`📊 Projects backed up: ${projects.length}`)
    console.log(`🗂️  Total hotspots: ${projects.reduce((sum, p) => sum + p.interactiveData.hotspots.length, 0)}`)
    console.log(`⏱️  Total timeline events: ${projects.reduce((sum, p) => sum + p.interactiveData.timelineEvents.length, 0)}`)
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

// Run backup if called directly
if (require.main === module) {
  backupAllData()
}

export { backupAllData }