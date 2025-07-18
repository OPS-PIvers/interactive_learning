// Console monitoring script for debugging the app
import { createBrowser, createPage } from './puppeteer-utils.js';

async function monitorConsole() {
  console.log('🔍 Starting console monitoring for your app...');
  
  let browser;
  try {
    // Create browser instance
    browser = await createBrowser();
    const page = await createPage(browser);
    
    // Arrays to store console messages
    const consoleMessages = [];
    const errors = [];
    const warnings = [];
    
    // Listen for console events
    page.on('console', (message) => {
      const type = message.type();
      const text = message.text();
      const location = message.location();
      
      const logEntry = {
        type,
        text,
        location,
        timestamp: new Date().toISOString()
      };
      
      consoleMessages.push(logEntry);
      
      // Categorize messages
      if (type === 'error') {
        errors.push(logEntry);
      } else if (type === 'warning') {
        warnings.push(logEntry);
      }
      
      // Real-time console output
      console.log(`[${type.toUpperCase()}] ${text}`);
      if (location.url) {
        console.log(`  → ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    });
    
    // Listen for page errors
    page.on('pageerror', (error) => {
      const errorEntry = {
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      errors.push(errorEntry);
      console.log(`[PAGE ERROR] ${error.message}`);
      if (error.stack) {
        console.log(`  → Stack: ${error.stack}`);
      }
    });
    
    // Listen for request failures
    page.on('requestfailed', (request) => {
      const failureEntry = {
        type: 'requestfailed',
        url: request.url(),
        failure: request.failure(),
        timestamp: new Date().toISOString()
      };
      
      errors.push(failureEntry);
      console.log(`[REQUEST FAILED] ${request.url()}`);
      console.log(`  → Reason: ${request.failure().errorText}`);
    });
    
    // Navigate to the app
    console.log('🚀 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait a bit to capture initial console messages
    console.log('⏳ Waiting for app to load and capturing console output...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Try to interact with the app to trigger more console messages
    console.log('🖱️ Attempting to interact with the app...');
    
    // Look for common interactive elements
    const interactiveElements = [
      'button',
      '[role="button"]',
      'a[href]',
      'input',
      '.hotspot',
      '[data-testid]'
    ];
    
    for (const selector of interactiveElements) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} ${selector} elements`);
          // Click the first element to see if it triggers console messages
          await elements[0].click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        // Ignore interaction errors, we're just trying to trigger console messages
      }
    }
    
    // Final wait to capture any delayed messages
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generate summary report
    console.log('\n📊 CONSOLE MONITORING SUMMARY');
    console.log('=' * 50);
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);
    console.log(`Info/Log messages: ${consoleMessages.length - errors.length - warnings.length}`);
    
    // Show detailed errors
    if (errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:');
      errors.forEach((error, index) => {
        console.log(`\n${index + 1}. [${error.type}] ${error.text}`);
        if (error.location) {
          console.log(`   Location: ${error.location.url}:${error.location.lineNumber}:${error.location.columnNumber}`);
        }
        if (error.stack) {
          console.log(`   Stack: ${error.stack}`);
        }
      });
    }
    
    // Show warnings
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS FOUND:');
      warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.text}`);
        if (warning.location) {
          console.log(`   Location: ${warning.location.url}:${warning.location.lineNumber}:${warning.location.columnNumber}`);
        }
      });
    }
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalMessages: consoleMessages.length,
        errors: errors.length,
        warnings: warnings.length,
        info: consoleMessages.length - errors.length - warnings.length
      },
      messages: consoleMessages,
      errors,
      warnings
    };
    
    // Write report to file
    await page.evaluate((reportData) => {
      console.log('📄 Full console report:', reportData);
    }, report);
    
    return report;
    
  } catch (error) {
    console.error('❌ Error during console monitoring:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the monitoring
monitorConsole().catch(console.error);