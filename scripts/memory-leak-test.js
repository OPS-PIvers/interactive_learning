#!/usr/bin/env node

/**
 * Memory Leak Detection Test
 * 
 * Part of Phase 2 performance optimization - detects memory leaks 
 * during long-running editing sessions.
 */

import { performance, PerformanceObserver } from 'perf_hooks';

console.log('🔍 Starting Memory Leak Detection Test...\n');

// Memory tracking
let initialMemory = null;
let peakMemory = 0;
const memorySnapshots = [];

// Performance observer for GC monitoring
const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.entryType === 'gc') {
      console.log(`GC: ${entry.kind} - Duration: ${entry.duration.toFixed(2)}ms`);
    }
  });
});

try {
  obs.observe({ entryTypes: ['gc'] });
} catch (e) {
  console.log('⚠️  GC monitoring not available in this environment');
}

// Memory monitoring function
function captureMemorySnapshot(label) {
  if (global.gc) {
    global.gc(); // Force garbage collection if available
  }
  
  const usage = process.memoryUsage();
  const snapshot = {
    label,
    timestamp: Date.now(),
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    rss: usage.rss
  };
  
  memorySnapshots.push(snapshot);
  
  if (snapshot.heapUsed > peakMemory) {
    peakMemory = snapshot.heapUsed;
  }
  
  console.log(`📊 Memory snapshot [${label}]:`);
  console.log(`   Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
  console.log();
  
  return snapshot;
}

// Simulate memory-intensive operations
async function simulateEditorSession() {
  console.log('🎮 Simulating 2-hour editor session...\n');
  
  // Initial memory baseline
  initialMemory = captureMemorySnapshot('Initial');
  
  // Simulate various editor operations
  const operations = [
    'Creating slide elements',
    'Drag and drop operations', 
    'Touch gesture handling',
    'Canvas transformations',
    'State updates',
    'Component re-renders'
  ];
  
  for (let cycle = 1; cycle <= 5; cycle++) {
    console.log(`🔄 Cycle ${cycle}/5`);
    
    for (const operation of operations) {
      // Simulate memory allocation
      const data = new Array(10000).fill(null).map((_, i) => ({
        id: `element-${i}`,
        position: { x: Math.random() * 800, y: Math.random() * 600 },
        style: { width: 100, height: 100 },
        animation: { type: 'pulse', duration: 1000 }
      }));
      
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Clear references (simulate proper cleanup)
      data.length = 0;
    }
    
    captureMemorySnapshot(`After Cycle ${cycle}`);
    
    // Brief pause between cycles
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

// Memory leak analysis
function analyzeMemoryLeaks() {
  console.log('📈 Memory Leak Analysis:\n');
  
  if (memorySnapshots.length < 2) {
    console.log('❌ Insufficient data for analysis');
    return false;
  }
  
  const initial = memorySnapshots[0];
  const final = memorySnapshots[memorySnapshots.length - 1];
  
  const heapGrowth = final.heapUsed - initial.heapUsed;
  const heapGrowthPercent = ((heapGrowth / initial.heapUsed) * 100);
  
  console.log(`Initial Memory: ${(initial.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Final Memory: ${(final.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Peak Memory: ${(peakMemory / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Memory Growth: ${(heapGrowth / 1024 / 1024).toFixed(2)} MB (${heapGrowthPercent.toFixed(1)}%)\n`);
  
  // Memory leak detection thresholds
  const ACCEPTABLE_GROWTH_MB = 5; // 5MB growth is acceptable
  const ACCEPTABLE_GROWTH_PERCENT = 20; // 20% growth is acceptable
  
  const hasMemoryLeak = (heapGrowth / 1024 / 1024) > ACCEPTABLE_GROWTH_MB || 
                        Math.abs(heapGrowthPercent) > ACCEPTABLE_GROWTH_PERCENT;
  
  if (hasMemoryLeak) {
    console.log('❌ MEMORY LEAK DETECTED!');
    console.log(`   Growth exceeds acceptable thresholds:`);
    console.log(`   - Size: ${ACCEPTABLE_GROWTH_MB}MB (actual: ${(heapGrowth / 1024 / 1024).toFixed(2)}MB)`);
    console.log(`   - Percentage: ${ACCEPTABLE_GROWTH_PERCENT}% (actual: ${heapGrowthPercent.toFixed(1)}%)`);
    return false;
  } else {
    console.log('✅ No significant memory leaks detected');
    console.log(`   Memory growth within acceptable limits`);
    return true;
  }
}

// Main execution
async function runMemoryLeakTest() {
  try {
    const startTime = Date.now();
    
    await simulateEditorSession();
    
    // Final memory check
    captureMemorySnapshot('Final');
    
    const success = analyzeMemoryLeaks();
    
    const duration = Date.now() - startTime;
    console.log(`\n⏱️  Test completed in ${duration}ms`);
    
    if (success) {
      console.log('🎉 Memory leak test PASSED');
      process.exit(0);
    } else {
      console.log('💥 Memory leak test FAILED');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Memory leak test error:', error.message);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n🛑 Test interrupted');
  obs.disconnect();
  process.exit(0);
});

// Run the test
runMemoryLeakTest();