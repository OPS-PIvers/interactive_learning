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

// Navigate to URL with enhanced error handling
export async function navigateToUrl(page, url, options = {}) {
  const defaultOptions = {
    waitUntil: 'networkidle0',
    timeout: 60000
  };
  
  try {
    const response = await page.goto(url, { ...defaultOptions, ...options });
    
    if (!response) {
      throw new Error('No response received');
    }
    
    if (!response.ok()) {
      throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
    }
    
    return { success: true, status: response.status(), url: response.url() };
  } catch (error) {
    const errorInfo = {
      success: false,
      error: error.message,
      type: error.name,
      url: url
    };
    
    // Classify error types for better handling
    if (error.message.includes('net::ERR_NAME_NOT_RESOLVED')) {
      errorInfo.category = 'DNS_ERROR';
    } else if (error.message.includes('Navigation timeout')) {
      errorInfo.category = 'TIMEOUT_ERROR';
    } else if (error.message.includes('HTTP')) {
      errorInfo.category = 'HTTP_ERROR';
    } else {
      errorInfo.category = 'UNKNOWN_ERROR';
    }
    
    console.error(`Navigation failed: ${error.message}`);
    return errorInfo;
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

// Enhanced element waiting with better error handling
export async function waitForElement(page, selector, options = {}) {
  const defaultOptions = {
    timeout: 10000,
    visible: true
  };
  
  const waitOptions = { ...defaultOptions, ...options };
  
  try {
    await page.waitForSelector(selector, waitOptions);
    return { success: true, selector, found: true };
  } catch (error) {
    // Check if element exists but is not visible
    const elementExists = await page.$(selector) !== null;
    
    const result = {
      success: false,
      selector,
      found: elementExists,
      error: error.message,
      category: 'ELEMENT_NOT_FOUND'
    };
    
    if (elementExists && error.message.includes('visible')) {
      result.category = 'ELEMENT_NOT_VISIBLE';
    } else if (error.message.includes('timeout')) {
      result.category = 'TIMEOUT_ERROR';
    }
    
    console.error(`Element ${selector} wait failed: ${error.message}`);
    return result;
  }
}

// Enhanced click function with element detection
export async function clickElement(page, selector, options = {}) {
  const defaultOptions = {
    timeout: 10000,
    delay: 100
  };
  
  const clickOptions = { ...defaultOptions, ...options };
  
  try {
    // Wait for element to be present and visible
    const waitResult = await waitForElement(page, selector, { timeout: clickOptions.timeout });
    if (!waitResult.success) {
      return waitResult;
    }
    
    // Perform the click
    await page.click(selector, { delay: clickOptions.delay });
    
    return { success: true, selector, action: 'clicked' };
  } catch (error) {
    console.error(`Click failed for ${selector}: ${error.message}`);
    return {
      success: false,
      selector,
      error: error.message,
      category: 'CLICK_ERROR'
    };
  }
}

// Enhanced form filling function
export async function fillInput(page, selector, value, options = {}) {
  const defaultOptions = {
    timeout: 10000,
    clearFirst: true
  };
  
  const fillOptions = { ...defaultOptions, ...options };
  
  try {
    // Wait for input element
    const waitResult = await waitForElement(page, selector, { timeout: fillOptions.timeout });
    if (!waitResult.success) {
      return waitResult;
    }
    
    // Clear existing content if requested
    if (fillOptions.clearFirst) {
      await page.focus(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
    }
    
    // Type the new value
    await page.type(selector, value);
    
    return { success: true, selector, value, action: 'filled' };
  } catch (error) {
    console.error(`Fill failed for ${selector}: ${error.message}`);
    return {
      success: false,
      selector,
      error: error.message,
      category: 'FILL_ERROR'
    };
  }
}

// Set up console logging for a page
export function setupConsoleLogger(page) {
  page.on('console', msg => {
    const type = msg.type().substr(0, 3).toUpperCase();
    console.log(`CONSOLE ${type}: ${msg.text()}`);
  });
}

// Example usage function
export async function exampleUsage() {
  let browser;
  try {
    // Create browser
    browser = await createBrowser();
    
    // Create page
    const page = await createPage(browser);

    // Set up console logging
    setupConsoleLogger(page);
    
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