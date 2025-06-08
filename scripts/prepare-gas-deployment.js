import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepare Google Apps Script deployment
 * This script embeds the webpack bundle directly into HTML files for Apps Script compatibility
 */
function prepareGasDeployment() {
  const distDir = path.join(__dirname, '..', 'dist');
  const bundlePath = path.join(distDir, 'assets');
  // Find the JS bundle file (Vite generates with hash)
  const assetsDir = path.join(distDir, 'assets');
  let bundleFile = null;
  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    bundleFile = files.find(file => file.endsWith('.js') && file.startsWith('index-'));
  }
  
  if (!bundleFile) {
    console.error('No JS bundle found in dist/assets/. Please run build first.');
    process.exit(1);
  }
  
  const actualBundlePath = path.join(assetsDir, bundleFile);
  const htmlPath = path.join(distDir, 'index.html');
  
  // Read the bundle content
  const bundleContent = fs.readFileSync(actualBundlePath, 'utf8');
  
  // Create a separate bundle.html file that Apps Script can include
  const bundleHtmlPath = path.join(distDir, 'bundle.html');
  fs.writeFileSync(bundleHtmlPath, bundleContent);
  
  console.log('✅ Created bundle.html for Apps Script template inclusion');
  
  // Clean up files that Apps Script doesn't need
  const filesToRemove = [
    'bundle.js.LICENSE.txt'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    }
  });
  
  // Add Google Apps Script API mocks for local development
  const mockScript = `
// Google Apps Script API mocks for local development
if (typeof google === 'undefined') {
  window.google = {
    script: {
      run: function(functionName) {
        console.log('Mock google.script.run called:', functionName);
        const mockResponse = { success: true, data: 'mock data' };
        return {
          withSuccessHandler: function(callback) {
            setTimeout(() => callback(mockResponse), 100);
            return this;
          },
          withFailureHandler: function(callback) {
            return this;
          }
        };
      }
    }
  };
  console.log('🔧 Google Apps Script API mocks loaded for local development');
}
`;
  
  const mockPath = path.join(distDir, 'gas-mocks.html');
  fs.writeFileSync(mockPath, mockScript);
  console.log('✅ Created gas-mocks.html for local development');
  
  console.log('🚀 Google Apps Script deployment files prepared successfully!');
}

// Run the script
prepareGasDeployment();