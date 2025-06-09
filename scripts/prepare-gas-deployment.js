import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepare Google Apps Script deployment with separate files
 * This creates index.html, css.html, and javascript.html files
 */
function prepareGasDeployment() {
  const distDir = path.join(__dirname, '..', 'dist');
  const bundlePath = path.join(distDir, 'bundle.js');
  const stylesPath = path.join(distDir, 'styles.css');
  
  // Check if bundle exists
  if (!fs.existsSync(bundlePath)) {
    console.error('❌ bundle.js not found. Please run build first.');
    process.exit(1);
  }
  
  // Read the bundle content
  let bundleContent = fs.readFileSync(bundlePath, 'utf8');
  
  // Read CSS content if it exists
  let cssContent = '';
  if (fs.existsSync(stylesPath)) {
    cssContent = fs.readFileSync(stylesPath, 'utf8');
  }
  
  // Verify bundle content is complete
  console.log(`📦 Bundle size: ${bundleContent.length} characters`);
  console.log(`📦 Bundle size: ${(bundleContent.length / 1024).toFixed(2)} KB`);
  
  if (bundleContent.length === 0) {
    console.error('❌ Bundle content is empty!');
    process.exit(1);
  }
  
  // IMPORTANT: Escape the bundle content to prevent issues with quotes and special characters
  // This is crucial for preventing "Unexpected end of input" errors
  bundleContent = bundleContent
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/'/g, "\\'")    // Escape single quotes
    .replace(/"/g, '\\"')    // Escape double quotes
    .replace(/\n/g, '\\n')   // Escape newlines
    .replace(/\r/g, '\\r')   // Escape carriage returns
    .replace(/\t/g, '\\t');  // Escape tabs
  
  // Step 1: Create the main index.html file
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Training Modules</title>
  
  <!-- Include CSS from separate file -->
  <?!= HtmlService.createHtmlOutputFromFile('css').getContent() ?>
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
  
  <!-- Include JavaScript from separate file -->
  <?!= HtmlService.createHtmlOutputFromFile('javascript').getContent() ?>
</body>
</html>`;

  // Step 2: Create the css.html file with Tailwind CDN and custom styles
  const cssHtml = `<!-- Tailwind CSS from CDN -->
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

  /* Additional styles for better loading experience */
  .loading-container {
    transition: opacity 0.3s ease-in-out;
  }
  
  /* Hide loading screen once React app mounts */
  .react-loaded .loading-container {
    display: none;
  }
  
  ${cssContent ? `/* Bundled CSS styles */\n${cssContent}` : ''}
</style>`;

  // Step 3: Create the javascript.html file
  // IMPORTANT: We use eval with the escaped content to prevent syntax errors
  const javascriptHtml = `<script>
// Self-contained React application bundle
(function() {
  'use strict';
  
  try {
    // Using eval to execute the escaped bundle content
    eval("${bundleContent}");
  } catch (error) {
    console.error('Error loading application:', error);
    document.getElementById('root').innerHTML = 
      '<div class="min-h-screen flex items-center justify-center">' +
      '<div class="max-w-md mx-auto text-center">' +
      '<h1 class="text-2xl font-bold text-red-800 mb-4">Error Loading Application</h1>' +
      '<div class="bg-white rounded-lg shadow-lg p-6">' +
      '<p class="text-red-600 mb-4">Failed to initialize the interactive learning application.</p>' +
      '<p class="text-gray-600 text-sm">Error details: ' + error.message + '</p>' +
      '<p class="text-gray-600 text-sm mt-2">Please try refreshing the page or contact support.</p>' +
      '</div></div></div>';
  }
})();
</script>`;

  // Step 4: Write all three files
  try {
    const indexPath = path.join(distDir, 'index.html');
    const cssPath = path.join(distDir, 'css.html');
    const jsPath = path.join(distDir, 'javascript.html');

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    fs.writeFileSync(cssPath, cssHtml, 'utf8');
    fs.writeFileSync(jsPath, javascriptHtml, 'utf8');

    console.log(`✅ Created index.html: ${indexHtml.length} characters`);
    console.log(`✅ Created css.html: ${cssHtml.length} characters`);
    console.log(`✅ Created javascript.html: ${javascriptHtml.length} characters (${(javascriptHtml.length / 1024).toFixed(2)} KB)`);

    // Check if any individual file is too large
    // Google Apps Script has a limit of about 1MB per file
    const maxSize = 1000000; // 1MB limit
    let hasOversizedFiles = false;

    if (indexHtml.length > maxSize) {
      console.error(`❌ index.html is too large (${(indexHtml.length / 1024).toFixed(2)} KB)`);
      hasOversizedFiles = true;
    }
    if (cssHtml.length > maxSize) {
      console.error(`❌ css.html is too large (${(cssHtml.length / 1024).toFixed(2)} KB)`);
      hasOversizedFiles = true;
    }
    if (javascriptHtml.length > maxSize) {
      console.error(`❌ javascript.html is too large (${(javascriptHtml.length / 1024).toFixed(2)} KB)`);
      console.error('⚠️  Consider enabling minification or code splitting');
      hasOversizedFiles = true;
    }

    if (hasOversizedFiles) {
      console.error('\n⚠️  One or more files exceed Google Apps Script limits');
      console.error('Solutions:');
      console.error('1. Enable minification in your build');
      console.error('2. Remove unnecessary dependencies');
      console.error('3. Consider using a CDN for large libraries');
    } else {
      console.log('✅ All files are within Google Apps Script size limits');
    }

  } catch (error) {
    console.error('❌ Error writing HTML files:', error);
    process.exit(1);
  }
  
  // Step 5: Clean up files that Apps Script doesn't need
  const filesToRemove = [
    'bundle.js',  // Remove original bundle since it's now in javascript.html
    'bundle.js.LICENSE.txt',
    'styles.css',  // Remove original CSS since it's now in css.html
    'gas-mocks.html'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    }
  });
  
  console.log('\n🚀 Google Apps Script deployment files prepared successfully!');
  console.log('📁 Files created:');
  console.log('   - index.html (main template)');
  console.log('   - css.html (styles)');
  console.log('   - javascript.html (application code)');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: cd dist && clasp push');
  console.log('   2. Deploy the web app in Apps Script editor');
}

// Run the script
prepareGasDeployment();