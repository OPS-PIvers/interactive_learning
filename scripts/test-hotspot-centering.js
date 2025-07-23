// Test script to verify hotspot centering
import { createAuthenticatedSession } from './puppeteer-auth-helper.js';
import fs from 'fs';
import { spawn } from 'child_process';

async function testHotspotCentering() {
  console.log('Testing hotspot centering...');

  let browser;
  let devServer;
  try {
    // Start the dev server
    devServer = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, VITE_DISABLE_FIREBASE: 'true' }
    });
    devServer.stdout.on('data', (data) => {
      console.log(`Dev server: ${data}`);
    });
    devServer.stderr.on('data', (data) => {
      console.error(`Dev server error: ${data}`);
    });

    // Wait for the dev server to be ready and get the port
    const url = await new Promise((resolve, reject) => {
      devServer.stdout.on('data', (data) => {
        const urlMatch = data.toString().match(/http:\/\/localhost:(\d+)/);
        if (urlMatch) {
          resolve(`${urlMatch[0]}/view/proj_1752842941751_qqdjd`);
        }
      });
      devServer.stderr.on('data', (data) => {
        reject(new Error(`Dev server error: ${data}`));
      });
    });

    const { browser: newBrowser, page } = await createAuthenticatedSession({
        method: 'bypass',
        url
    });
    browser = newBrowser;

    // Give some time for the module to load
    console.log('Waiting for module content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click on the first hotspot
    await page.click('[data-hotspot-id="hs1"]');
    console.log('✓ Clicked on hotspot with id "hs1"');

    // Wait for the animation to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take a screenshot
    await page.screenshot({ path: 'hotspot-centering-test.png' });
    console.log('✓ Screenshot saved as hotspot-centering-test.png');

    console.log('\n🎉 Hotspot centering test complete.');

  } catch (error) {
    console.error('❌ Error testing hotspot centering:', error.message);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
    if (devServer) {
      devServer.kill();
    }
  }
}

// Run the test
testHotspotCentering();
