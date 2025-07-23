// Test script to verify hotspot centering
import { createAuthenticatedSession } from './puppeteer-auth-helper.js';
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
      const onData = (data) => {
        const urlMatch = data.toString().match(/http:\/\/localhost:(\d+)/);
        if (urlMatch) {
          cleanup();
          resolve(`${urlMatch[0]}/view/proj_1752842941751_qqdjd`);
        }
      };

      const onError = (data) => {
        cleanup();
        reject(new Error(`Dev server error: ${data}`));
      };
      
      const cleanup = () => {
        devServer.stdout.removeListener('data', onData);
        devServer.stderr.removeListener('data', onError);
      };

      devServer.stdout.on('data', onData);
      devServer.stderr.on('data', onError);
    });

    const { browser: newBrowser, page } = await createAuthenticatedSession({
        method: 'bypass',
        url
    });
    browser = newBrowser;

    const { setupConsoleLogger } = await import('./puppeteer-utils.js');
    setupConsoleLogger(page);

    // Wait for the loading spinner to disappear
    console.log('Waiting for module content to load...');
    await page.waitForSelector('.animate-spin', { hidden: true, timeout: 10000 });

    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    console.log(bodyHTML);

    // Click on the first hotspot
    await page.click('[data-hotspot-id="hs1"]');
    console.log('✓ Clicked on hotspot with id "hs1"');

    // Wait for the animation to complete (pan/zoom transition is 0.2s)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Take a screenshot
    await page.screenshot({ path: 'hotspot-centering-test.png' });
    console.log('✓ Screenshot saved as hotspot-centering-test.png');

    // Verify hotspot centering by checking transform values
    const imageTransform = await page.evaluate(() => {
      const img = document.querySelector('img[src*="proj_1752842941751_qqdjd"]');
      if (!img) return null;
      const style = window.getComputedStyle(img);
      const transform = style.transform;
      if (transform === 'none') return { scale: 1, translateX: 0, translateY: 0 };
      
      // Parse matrix transform values
      const values = transform.match(/matrix\([^\)]+\)/);
      if (values) {
        const matrix = values[0].slice(7, -1).split(', ').map(parseFloat);
        return {
          scale: matrix[0], // Scale X component
          translateX: matrix[4],
          translateY: matrix[5]
        };
      }
      return null;
    });

    if (imageTransform) {
      console.log(`✓ Image transform: scale=${imageTransform.scale.toFixed(2)}, translateX=${imageTransform.translateX.toFixed(1)}, translateY=${imageTransform.translateY.toFixed(1)}`);
      
      // Verify that the image has been scaled and positioned (not at default state)
      if (imageTransform.scale > 1.5 && (Math.abs(imageTransform.translateX) > 0 || Math.abs(imageTransform.translateY) > 0)) {
        console.log('✅ Hotspot centering appears to be working correctly');
      } else {
        console.log('⚠️ Hotspot may not be properly centered (scale or translation values unexpected)');
      }
    } else {
      console.log('⚠️ Could not verify image transform values');
    }

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
