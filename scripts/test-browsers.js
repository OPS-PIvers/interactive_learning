#!/usr/bin/env node

const { execSync } = require('child_process');

const browsers = ['chromium', 'firefox', 'webkit'];

console.log('Running cross-browser tests...');

for (const browser of browsers) {
  console.log(`\nTesting with ${browser}...`);
  try {
    execSync(`npx playwright test --browser ${browser}`, { stdio: 'inherit' });
    console.log(`✅ Tests passed with ${browser}`);
  } catch (error) {
    console.error(`❌ Tests failed with ${browser}`);
    process.exit(1);
  }
}

console.log('\n✅ All cross-browser tests passed!');
