// Test script to verify Puppeteer setup and log console output
import { createBrowser, createPage, navigateToUrl, setupConsoleLogger } from './puppeteer-utils.js';
import fs from 'fs';

async function testPuppeteer() {
  console.log('Testing Puppeteer setup and console logging...');
  
  let browser;
  try {
    // Create browser
    browser = await createBrowser();
    console.log('✓ Browser launched successfully');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created with viewport settings');

    // Set up console logging
    setupConsoleLogger(page);
    console.log('✓ Console logging enabled');
    
    // Navigate to your module URL
    const moduleUrl = 'https://interactive-learning-278.web.app/view/proj_1752842941751_qqdjd';
    const success = await navigateToUrl(page, moduleUrl);
    
    if (success) {
      console.log(`✓ Successfully navigated to ${moduleUrl}`);

      // Give some time for the module to load and errors to appear
      console.log('Waiting for module content to load and logs to appear...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Increased timeout for module content to load

      // Take a screenshot (optional)
      await page.screenshot({ path: 'module-screenshot.png' });
      console.log('✓ Screenshot saved as module-screenshot.png');

      const title = await page.title();
      console.log(`✓ Page title: ${title}`);

      console.log('\n🎉 Puppeteer test complete. Check console output above for module logs.');

    } else {
      console.error(`❌ Failed to navigate to ${moduleUrl}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing Puppeteer:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testPuppeteer();