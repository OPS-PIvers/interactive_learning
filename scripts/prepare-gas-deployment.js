import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepare Google Apps Script deployment
 * This script creates HTML template files for Apps Script web app deployment
 */
function prepareGasDeployment() {
  const distDir = path.join(__dirname, '..', 'dist');
  const bundlePath = path.join(distDir, 'bundle.js');
  const indexHtmlPath = path.join(distDir, 'index.html');
  
  // Check if bundle exists
  if (!fs.existsSync(bundlePath)) {
    console.error('bundle.js not found. Please run build first.');
    process.exit(1);
  }
  
  // Read the bundle content and original HTML
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  const htmlContent = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, 'utf8') : '';
  
  // Create main index.html template for Apps Script
  const indexTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Training Modules</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* Custom scrollbar for better aesthetics */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb {
      background: #888;
      border-radius: 10px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

    /* Subtle pulse animation for hotspots in idle mode */
    .subtle-pulse-animation {
      animation: subtle-pulse-keyframes 2s infinite ease-in-out;
    }
    @keyframes subtle-pulse-keyframes {
      0%, 100% { opacity: 0.6; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.08); }
    }
  </style>
</head>
<body class="bg-slate-100">
  <div id="root"></div>
  
  <!-- React and ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- App bundle -->
  <script>
<?= include('bundle') ?>
  </script>
</body>
</html>`;

  // Create bundle.html file that contains just the JavaScript
  const bundleHtmlPath = path.join(distDir, 'bundle.html');
  fs.writeFileSync(bundleHtmlPath, bundleContent);
  
  // Replace the original index.html with the template version
  fs.writeFileSync(indexHtmlPath, indexTemplate);
  
  console.log('✅ Created index.html template for Apps Script');
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