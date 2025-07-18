// Enhanced Puppeteer script to analyze console output and page behavior
import { createBrowser, createPage, navigateToUrl, setupConsoleLogger } from './puppeteer-utils.js';

async function analyzeWebAppConsole() {
  console.log('🔍 Analyzing web app console output...');
  
  let browser;
  const consoleEntries = [];
  
  try {
    // Create browser
    browser = await createBrowser({ headless: true }); // Run in headless mode (server environment)
    console.log('✓ Browser launched successfully');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Enhanced console logging with categorization
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const timestamp = new Date().toISOString();
      
      const entry = {
        type,
        text,
        timestamp,
        location: msg.location ? `${msg.location().url}:${msg.location().lineNumber}` : 'unknown'
      };
      
      consoleEntries.push(entry);
      
      // Color-coded output
      const colors = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        log: '\x1b[37m',
        debug: '\x1b[90m'
      };
      const color = colors[type] || '\x1b[37m';
      const reset = '\x1b[0m';
      
      console.log(`${color}[${type.toUpperCase()}]${reset} ${text}`);
      if (entry.location !== 'unknown') {
        console.log(`  📍 ${entry.location}`);
      }
    });

    // Listen for network failures
    page.on('requestfailed', request => {
      console.log(`❌ Network request failed: ${request.url()}`);
      console.log(`   Failure: ${request.failure().errorText}`);
    });

    // Listen for unhandled promise rejections
    page.on('pageerror', error => {
      console.log(`💥 Page error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    });
    
    // Navigate to the local development server
    const moduleUrl = 'http://localhost:3000/view/proj_1752842941751_qqdjd';
    console.log(`🌐 Navigating to: ${moduleUrl}`);
    
    const success = await navigateToUrl(page, moduleUrl, { 
      waitUntil: 'networkidle0', 
      timeout: 30000 
    });
    
    if (success) {
      console.log(`✓ Successfully navigated to ${moduleUrl}`);

      // Wait for the app to load and generate console output
      console.log('⏳ Waiting for app to load and console output...');
      await new Promise(resolve => setTimeout(resolve, 15000));

      // Get page title and URL
      const title = await page.title();
      const currentUrl = page.url();
      console.log(`📄 Page title: ${title}`);
      console.log(`🔗 Current URL: ${currentUrl}`);

      // Check for specific elements
      const errorElements = await page.$$('[data-testid="error"], .error, [class*="error"]');
      const loadingElements = await page.$$('[data-testid="loading"], .loading, [class*="loading"]');
      
      console.log(`🔍 Found ${errorElements.length} error elements on page`);
      console.log(`⏳ Found ${loadingElements.length} loading elements on page`);

      // Take screenshot
      await page.screenshot({ path: 'console-analysis-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved as console-analysis-screenshot.png');

      // Analyze console entries
      console.log('\n📊 CONSOLE ANALYSIS SUMMARY:');
      console.log('=' .repeat(50));
      
      const errorCount = consoleEntries.filter(e => e.type === 'error').length;
      const warningCount = consoleEntries.filter(e => e.type === 'warn').length;
      const infoCount = consoleEntries.filter(e => e.type === 'info').length;
      const logCount = consoleEntries.filter(e => e.type === 'log').length;
      
      console.log(`🔴 Errors: ${errorCount}`);
      console.log(`🟡 Warnings: ${warningCount}`);
      console.log(`🔵 Info: ${infoCount}`);
      console.log(`⚪ Logs: ${logCount}`);
      console.log(`📝 Total entries: ${consoleEntries.length}`);
      
      // Show critical errors
      const criticalErrors = consoleEntries.filter(e => 
        e.type === 'error' && 
        (e.text.includes('Firebase') || e.text.includes('Failed') || e.text.includes('Error'))
      );
      
      if (criticalErrors.length > 0) {
        console.log('\n🚨 CRITICAL ERRORS:');
        criticalErrors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.text}`);
          if (error.location !== 'unknown') {
            console.log(`   📍 ${error.location}`);
          }
        });
      }
      
      // Show Firebase-specific messages
      const firebaseMessages = consoleEntries.filter(e => 
        e.text.includes('Firebase') || e.text.includes('firebase')
      );
      
      if (firebaseMessages.length > 0) {
        console.log('\n🔥 FIREBASE MESSAGES:');
        firebaseMessages.forEach((msg, index) => {
          console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
        });
      }

    } else {
      console.error(`❌ Failed to navigate to ${moduleUrl}`);
    }
    
  } catch (error) {
    console.error('💥 Error during analysis:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the analysis
analyzeWebAppConsole().catch(console.error);