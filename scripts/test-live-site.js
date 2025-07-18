// Test script to analyze the live deployed site and find actual project IDs
import { createBrowser, createPage, navigateToUrl } from './puppeteer-utils.js';

async function testLiveSite() {
  console.log('🌐 Testing live deployed site to find actual project IDs...');
  
  let browser;
  const foundProjects = [];
  
  try {
    // Create browser
    browser = await createBrowser({ headless: true });
    console.log('✓ Browser launched successfully');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Enhanced logging to catch all project-related information
    page.on('console', msg => {
      const text = msg.text();
      
      // Look for project IDs in console output
      const projectIdMatch = text.match(/proj_\d+_[a-zA-Z0-9]+/g);
      if (projectIdMatch) {
        projectIdMatch.forEach(id => {
          if (!foundProjects.includes(id)) {
            foundProjects.push(id);
            console.log(`🎯 Found project ID in console: ${id}`);
          }
        });
      }
      
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    });

    // Capture network requests to find project-related API calls
    page.on('request', request => {
      const url = request.url();
      
      // Look for project IDs in network requests
      const projectIdMatch = url.match(/proj_\d+_[a-zA-Z0-9]+/g);
      if (projectIdMatch) {
        projectIdMatch.forEach(id => {
          if (!foundProjects.includes(id)) {
            foundProjects.push(id);
            console.log(`🔗 Found project ID in network request: ${id}`);
          }
        });
      }
      
      if (url.includes('firestore') || url.includes('projects')) {
        console.log(`📡 API Request: ${request.method()} ${url}`);
      }
    });

    // Test multiple pages on the live site
    const sitesToTest = [
      'https://interactive-learning-278.web.app/',
      'https://interactive-learning-278.web.app/view/',
      'https://interactive-learning-278.web.app/projects',
      'https://interactive-learning-278.web.app/explore'
    ];

    for (const siteUrl of sitesToTest) {
      console.log(`\n🌐 Testing: ${siteUrl}`);
      
      try {
        const success = await navigateToUrl(page, siteUrl, { 
          waitUntil: 'networkidle2', 
          timeout: 20000 
        });
        
        if (success) {
          console.log(`✓ Successfully loaded: ${siteUrl}`);
          
          // Wait for content to load
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Get page title
          const title = await page.title();
          console.log(`📄 Page title: ${title}`);
          
          // Look for project links in the page content
          const projectLinks = await page.$$eval('a[href*="/view/"], a[href*="proj_"]', links => 
            links.map(link => ({
              href: link.href,
              text: link.textContent?.trim(),
              title: link.title
            }))
          );
          
          if (projectLinks.length > 0) {
            console.log(`🔗 Found ${projectLinks.length} project links:`);
            projectLinks.forEach((link, index) => {
              console.log(`  ${index + 1}. ${link.text} -> ${link.href}`);
              
              // Extract project ID from href
              const match = link.href.match(/proj_\d+_[a-zA-Z0-9]+/);
              if (match && !foundProjects.includes(match[0])) {
                foundProjects.push(match[0]);
                console.log(`    🎯 Extracted project ID: ${match[0]}`);
              }
            });
          }
          
          // Look for any elements with data attributes containing project IDs
          const dataElements = await page.$$eval('[data-project-id], [data-id*="proj_"]', elements => 
            elements.map(el => ({
              id: el.getAttribute('data-project-id') || el.getAttribute('data-id'),
              className: el.className,
              text: el.textContent?.trim()?.substring(0, 100)
            }))
          );
          
          if (dataElements.length > 0) {
            console.log(`📊 Found ${dataElements.length} elements with project data:`);
            dataElements.forEach((el, index) => {
              console.log(`  ${index + 1}. ID: ${el.id} | Class: ${el.className} | Text: ${el.text}`);
            });
          }
          
          // Check for any script tags or inline data that might contain project IDs
          const scriptContent = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const content = scripts.map(script => script.textContent || script.innerHTML).join('\n');
            const matches = content.match(/proj_\d+_[a-zA-Z0-9]+/g);
            return matches ? [...new Set(matches)] : [];
          });
          
          if (scriptContent.length > 0) {
            console.log(`📜 Found project IDs in scripts: ${scriptContent.join(', ')}`);
            scriptContent.forEach(id => {
              if (!foundProjects.includes(id)) {
                foundProjects.push(id);
              }
            });
          }
          
        } else {
          console.log(`❌ Failed to load: ${siteUrl}`);
        }
      } catch (error) {
        console.log(`⚠️  Error loading ${siteUrl}: ${error.message}`);
      }
    }

    // Test the original problematic URL on the live site
    console.log('\n🔍 Testing original problematic URL on live site...');
    const originalUrl = 'https://interactive-learning-278.web.app/view/proj_1752842941751_qqdjd';
    
    try {
      const success = await navigateToUrl(page, originalUrl, { 
        waitUntil: 'networkidle2', 
        timeout: 15000 
      });
      
      if (success) {
        console.log(`✓ Original URL loaded successfully: ${originalUrl}`);
        
        // Check if we get an error page or actual content
        const pageContent = await page.evaluate(() => {
          const errorElements = document.querySelectorAll('[class*="error"], [class*="not-found"]');
          const hasErrorContent = document.body.textContent?.includes('not found') || 
                                 document.body.textContent?.includes('invalid') ||
                                 document.body.textContent?.includes('unavailable');
          
          return {
            hasErrorElements: errorElements.length > 0,
            hasErrorContent,
            title: document.title,
            bodyText: document.body.textContent?.substring(0, 200)
          };
        });
        
        console.log(`📄 Original URL status:`);
        console.log(`  Title: ${pageContent.title}`);
        console.log(`  Has error elements: ${pageContent.hasErrorElements}`);
        console.log(`  Has error content: ${pageContent.hasErrorContent}`);
        console.log(`  Preview: ${pageContent.bodyText}`);
        
      } else {
        console.log(`❌ Original URL failed to load: ${originalUrl}`);
      }
    } catch (error) {
      console.log(`⚠️  Error testing original URL: ${error.message}`);
    }

    // Take screenshot of the final page
    await page.screenshot({ path: 'live-site-analysis.png', fullPage: true });
    console.log('📸 Screenshot saved as live-site-analysis.png');

  } catch (error) {
    console.error('💥 Error during live site analysis:', error.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }

  // Summary
  console.log('\n🎯 SUMMARY OF FOUND PROJECT IDs:');
  console.log('=' + '='.repeat(50));
  if (foundProjects.length > 0) {
    foundProjects.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
      console.log(`   Test URL: https://interactive-learning-278.web.app/view/${id}`);
    });
  } else {
    console.log('No project IDs found on the live site.');
  }
  
  return foundProjects;
}

// Run the analysis
testLiveSite().catch(console.error);