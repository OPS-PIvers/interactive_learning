// Test script to analyze the main app and find valid project IDs
import { createBrowser, createPage, navigateToUrl } from './puppeteer-utils.js';

async function testMainApp() {
  console.log('🔍 Testing main app to find valid project IDs...');
  
  let browser;
  
  try {
    // Create browser
    browser = await createBrowser({ headless: true });
    console.log('✓ Browser launched successfully');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Enhanced console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // Navigate to the main app
    const mainUrl = 'http://localhost:3000/';
    console.log(`🌐 Navigating to: ${mainUrl}`);
    
    const success = await navigateToUrl(page, mainUrl, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    if (success) {
      console.log(`✓ Successfully navigated to ${mainUrl}`);

      // Wait for the app to load
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Get page title
      const title = await page.title();
      console.log(`📄 Page title: ${title}`);

      // Look for project cards or links
      const projectLinks = await page.$$eval('a[href*="/view/"]', links => 
        links.map(link => ({ href: link.href, text: link.textContent?.trim() }))
      );
      
      console.log('\n🔗 Found project links:');
      projectLinks.forEach((link, index) => {
        console.log(`${index + 1}. ${link.text} -> ${link.href}`);
      });

      // Look for any elements with project IDs
      const projectElements = await page.$$eval('[data-project-id], [id*="proj_"]', elements => 
        elements.map(el => ({ 
          id: el.id || el.getAttribute('data-project-id'), 
          text: el.textContent?.trim().substring(0, 50) 
        }))
      );
      
      if (projectElements.length > 0) {
        console.log('\n🎯 Found elements with project IDs:');
        projectElements.forEach((el, index) => {
          console.log(`${index + 1}. ID: ${el.id} -> ${el.text}`);
        });
      }

      // Take screenshot
      await page.screenshot({ path: 'main-app-screenshot.png', fullPage: true });
      console.log('📸 Screenshot saved as main-app-screenshot.png');

      // Try to find the create project button or other interactive elements
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => btn.textContent?.trim()).filter(text => text)
      );
      
      console.log('\n🔘 Found buttons:', buttons.slice(0, 10));

    } else {
      console.error(`❌ Failed to navigate to ${mainUrl}`);
    }
    
  } catch (error) {
    console.error('💥 Error during analysis:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Run the analysis
testMainApp().catch(console.error);