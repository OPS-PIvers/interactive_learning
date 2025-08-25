// Combined and enhanced console analysis script
import { createBrowser, createPage, navigateToUrl } from './puppeteer-utils.js';
import fs from 'fs';

async function analyzeConsole(url) {
  console.log(`🔍 Starting console analysis for: ${url}`);

  let browser;
  const consoleEntries = [];

  try {
    browser = await createBrowser({ headless: true });
    const page = await createPage(browser);

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

      const colors = {
        error: '[31m',
        warn: '[33m',
        info: '[36m',
        log: '[37m',
        debug: '[90m'
      };
      const color = colors[type] || '[37m';
      const reset = '[0m';

      console.log(`${color}[${type.toUpperCase()}]${reset} ${text}`);
      if (entry.location !== 'unknown') {
        console.log(`  📍 ${entry.location}`);
      }
    });

    page.on('pageerror', error => {
      console.log(`💥 Page error: ${error.message}`);
      consoleEntries.push({ type: 'pageerror', text: error.message, stack: error.stack, timestamp: new Date().toISOString() });
    });

    page.on('requestfailed', request => {
      const errorText = request.failure()?.errorText;
      console.log(`❌ Network request failed: ${request.url()} (${errorText})`);
      consoleEntries.push({ type: 'requestfailed', text: `URL: ${request.url()}, Error: ${errorText}`, timestamp: new Date().toISOString() });
    });

    console.log(`🌐 Navigating to: ${url}`);
    const success = await navigateToUrl(page, url, { waitUntil: 'networkidle0', timeout: 30000 });

    if (!success) {
      console.error(`❌ Failed to navigate to ${url}`);
      return;
    }

    console.log('✅ Successfully navigated.');
    console.log('⏳ Waiting for app to settle...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🖱️ Attempting to interact with the page to trigger more logs...');
    const interactiveSelectors = ['button', '[role="button"]', 'a[href]', 'input', '.hotspot', '[data-testid]'];
    for (const selector of interactiveSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        try {
          await elements[0].click();
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          // ignore errors
        }
      }
    }

    const errorElements = await page.$$('[data-testid="error"], .error, [class*="error"]');
    const loadingElements = await page.$$('[data-testid="loading"], .loading, [class*="loading"]');

    const screenshotPath = 'console-analysis-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved as ${screenshotPath}`);

    console.log('
📊 CONSOLE ANALYSIS SUMMARY');
    console.log('='.repeat(50));
    const errors = consoleEntries.filter(e => e.type === 'error' || e.type === 'pageerror' || e.type === 'requestfailed');
    const warnings = consoleEntries.filter(e => e.type === 'warn');
    console.log(`Total entries: ${consoleEntries.length}`);
    console.log(`🔴 Errors: ${errors.length}`);
    console.log(`🟡 Warnings: ${warnings.length}`);
    console.log(`🔵 Info/Log: ${consoleEntries.length - errors.length - warnings.length}`);
    console.log(`DOM Errors: ${errorElements.length}`);
    console.log(`DOM Loading: ${loadingElements.length}`);

    if (errors.length > 0) {
      console.log('
🚨 DETAILED ERRORS:');
      errors.forEach((e, i) => {
        console.log(`${i + 1}. [${e.type.toUpperCase()}] ${e.text}`);
        if(e.stack) console.log(`   Stack: ${e.stack}`);
      });
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

const url = process.argv[2] || 'http://localhost:3000';
analyzeConsole(url).catch(console.error);
