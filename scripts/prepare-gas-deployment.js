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
  
  // Create the HTML template parts separately to avoid template literal issues
  const htmlStart = `<!DOCTYPE html>
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
  <div id="root">
    <div class="min-h-screen flex items-center justify-center">
      <div class="max-w-md mx-auto text-center">
        <h1 class="text-2xl font-bold text-gray-800 mb-4">Interactive Training Modules</h1>
        <div class="bg-white rounded-lg shadow-lg p-6">
          <p class="text-gray-600 mb-4">Loading your interactive learning application...</p>
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Self-contained Application Bundle with React included -->
  <script>
`;

  const htmlEnd = `
  </script>
</body>
</html>`;

  // Combine the parts without using template literals for the bundle content
  const indexTemplate = htmlStart + bundleContent + htmlEnd;

  // Replace the original index.html with the template version (JavaScript embedded directly)
  fs.writeFileSync(indexHtmlPath, indexTemplate);
  
  console.log('✅ Created index.html with embedded JavaScript for Apps Script');
  
  // Clean up files that Apps Script doesn't need
  const filesToRemove = [
    'bundle.js.LICENSE.txt',
    'app-bundle.html',  // Remove old bundle file if it exists
    'bundle.js',  // Remove bundle.js since it's embedded in index.html
    'gas-mocks.html'  // Remove gas-mocks.html to prevent it from being pushed
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    }
  });
  
  console.log('🚀 Google Apps Script deployment files prepared successfully!');
}

// Run the script
prepareGasDeployment();