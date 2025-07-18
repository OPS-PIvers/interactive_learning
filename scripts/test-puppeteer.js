// Test script to verify Puppeteer setup
import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('Testing Puppeteer setup...');
  
  let browser;
  try {
    // Launch browser with basic config
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    console.log('✓ Browser launched successfully');
    
    // Create a new page
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    console.log('✓ Page created with viewport settings');
    
    // Navigate to a test page
    await page.goto('https://example.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    console.log('✓ Successfully navigated to test page');
    
    // Take a screenshot
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✓ Screenshot saved as test-screenshot.png');
    
    // Get page title
    const title = await page.title();
    console.log(`✓ Page title: ${title}`);
    
    console.log('\n🎉 Puppeteer is configured and working correctly!');
    
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