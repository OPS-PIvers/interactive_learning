// Puppeteer utility functions for Claude Code usage
import puppeteer from 'puppeteer';

// Default launch configuration
export const defaultLaunchOptions = {
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--no-first-run',
    '--disable-default-apps',
    '--disable-extensions'
  ]
};

// Default viewport settings
export const defaultViewport = {
  width: 1280,
  height: 720
};

// Create a configured browser instance
export async function createBrowser(options = {}) {
  const launchOptions = { ...defaultLaunchOptions, ...options };
  return await puppeteer.launch(launchOptions);
}

// Create a page with default settings
export async function createPage(browser, viewport = defaultViewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  return page;
}

// Navigate to URL with error handling
export async function navigateToUrl(page, url, options = {}) {
  const defaultOptions = {
    waitUntil: 'networkidle2',
    timeout: 30000
  };
  
  try {
    await page.goto(url, { ...defaultOptions, ...options });
    return true;
  } catch (error) {
    console.error(`Navigation failed: ${error.message}`);
    return false;
  }
}

// Take screenshot with error handling
export async function takeScreenshot(page, filename = 'screenshot.png', options = {}) {
  try {
    await page.screenshot({ path: filename, ...options });
    return filename;
  } catch (error) {
    console.error(`Screenshot failed: ${error.message}`);
    return null;
  }
}

// Get page information
export async function getPageInfo(page) {
  try {
    const title = await page.title();
    const url = page.url();
    const viewport = page.viewport();
    
    return { title, url, viewport };
  } catch (error) {
    console.error(`Getting page info failed: ${error.message}`);
    return null;
  }
}

// Wait for element with timeout
export async function waitForElement(page, selector, timeout = 10000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    console.error(`Element ${selector} not found: ${error.message}`);
    return false;
  }
}

// Example usage function
export async function exampleUsage() {
  let browser;
  try {
    // Create browser
    browser = await createBrowser();
    
    // Create page
    const page = await createPage(browser);
    
    // Navigate to URL
    const success = await navigateToUrl(page, 'https://example.com');
    if (!success) return;
    
    // Take screenshot
    const screenshotPath = await takeScreenshot(page, 'example-screenshot.png');
    
    // Get page info
    const pageInfo = await getPageInfo(page);
    
    console.log('Page Info:', pageInfo);
    console.log('Screenshot saved to:', screenshotPath);
    
  } catch (error) {
    console.error('Error in example usage:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}