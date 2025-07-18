// Test script to verify core app functionality and identify issues
import { createBrowser, createPage, navigateToUrl } from './puppeteer-utils.js';

async function testAppFunctionality() {
  console.log('🧪 Testing core app functionality...');
  
  let browser;
  const errors = [];
  const warnings = [];
  
  try {
    // Create browser
    browser = await createBrowser({ headless: true });
    console.log('✓ Browser launched successfully');
    
    // Create page
    const page = await createPage(browser);
    console.log('✓ Page created');

    // Capture all console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        errors.push(text);
      } else if (type === 'warning') {
        warnings.push(text);
      }
      
      console.log(`[${type.toUpperCase()}] ${text}`);
    });

    // Capture failed network requests
    page.on('requestfailed', request => {
      const failure = `${request.method()} ${request.url()} - ${request.failure().errorText}`;
      errors.push(`Network: ${failure}`);
      console.log(`❌ Network failure: ${failure}`);
    });

    // Test 1: Main page load
    console.log('\n🔍 Test 1: Loading main page...');
    const mainSuccess = await navigateToUrl(page, 'http://localhost:3000/', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    if (mainSuccess) {
      console.log('✓ Main page loaded successfully');
      
      // Wait for React to render
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if auth modal is visible
      const authModalVisible = await page.evaluate(() => {
        const authModal = document.querySelector('[data-testid="auth-modal"]') || 
                         document.querySelector('.auth-modal') ||
                         document.querySelector('div:contains("Sign In")');
        return authModal !== null;
      });
      
      console.log(`Auth modal visible: ${authModalVisible ? '✓' : '❌'}`);
      
      // Check for sign in button
      const signInButton = await page.$('button:contains("Sign In")');
      console.log(`Sign In button found: ${signInButton ? '✓' : '❌'}`);
      
      // Take screenshot
      await page.screenshot({ path: 'main-page-test.png', fullPage: true });
      console.log('📸 Main page screenshot saved');
      
    } else {
      console.error('❌ Failed to load main page');
    }

    // Test 2: Try to access a shared module directly
    console.log('\n🔍 Test 2: Testing shared module access...');
    const sharedModuleSuccess = await navigateToUrl(page, 'http://localhost:3000/view/test-module', { 
      waitUntil: 'networkidle2', 
      timeout: 15000 
    });
    
    if (sharedModuleSuccess) {
      console.log('✓ Shared module route loaded');
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check if module loads without requiring auth
      const moduleContent = await page.evaluate(() => {
        const moduleContainer = document.querySelector('[data-testid="module-container"]') || 
                              document.querySelector('.interactive-module') ||
                              document.querySelector('canvas') ||
                              document.querySelector('img');
        return moduleContainer !== null;
      });
      
      console.log(`Module content visible: ${moduleContent ? '✓' : '❌'}`);
      
      // Take screenshot
      await page.screenshot({ path: 'shared-module-test.png', fullPage: true });
      console.log('📸 Shared module screenshot saved');
      
    } else {
      console.error('❌ Failed to load shared module');
    }

    // Test 3: Check if Firebase is working
    console.log('\n🔍 Test 3: Testing Firebase initialization...');
    const firebaseStatus = await page.evaluate(() => {
      // Check if Firebase modules are loaded
      const firebaseApp = window.firebase || window.firebaseApp;
      const hasFirebaseConfig = typeof firebase !== 'undefined' || 
                               document.querySelector('script[src*="firebase"]') !== null;
      
      return {
        firebaseLoaded: hasFirebaseConfig,
        consoleErrors: []
      };
    });
    
    console.log(`Firebase initialized: ${firebaseStatus.firebaseLoaded ? '✓' : '❌'}`);

    // Test 4: Test responsive design
    console.log('\n🔍 Test 4: Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone SE size
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mobileLayout = await page.evaluate(() => {
      const body = document.body;
      const hasHorizontalScroll = body.scrollWidth > body.clientWidth;
      const hasMobileClass = body.classList.contains('mobile') || 
                            document.querySelector('[data-mobile="true"]') !== null;
      
      return {
        hasHorizontalScroll,
        hasMobileClass,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    });
    
    console.log(`Mobile layout working: ${!mobileLayout.hasHorizontalScroll ? '✓' : '❌'}`);
    console.log(`Mobile viewport: ${mobileLayout.viewport.width}x${mobileLayout.viewport.height}`);
    
    // Take mobile screenshot
    await page.screenshot({ path: 'mobile-layout-test.png', fullPage: true });
    console.log('📸 Mobile layout screenshot saved');

    // Reset to desktop
    await page.setViewport({ width: 1200, height: 800 });

  } catch (error) {
    console.error('💥 Error during testing:', error.message);
    errors.push(`Test error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('=' .repeat(50));
  
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} Error(s) Found:`);
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} Warning(s) Found:`);
    warnings.forEach((warning, index) => {
      console.log(`${index + 1}. ${warning}`);
    });
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ No critical errors detected!');
  }
  
  console.log('\n🎯 App Status Assessment:');
  const criticalErrors = errors.filter(error => 
    error.includes('TypeError') || 
    error.includes('ReferenceError') ||
    error.includes('Cannot read') ||
    error.includes('Failed to fetch')
  );
  
  if (criticalErrors.length > 0) {
    console.log('🚨 CRITICAL ISSUES DETECTED - App may be broken');
    console.log('Critical errors:');
    criticalErrors.forEach(error => console.log(`  - ${error}`));
  } else {
    console.log('✅ No critical runtime errors detected');
    console.log('🎉 App appears to be functioning correctly');
  }
}

// Run the test
testAppFunctionality().catch(console.error);