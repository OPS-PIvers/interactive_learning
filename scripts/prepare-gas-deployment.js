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
  
  // Check if bundle exists
  if (!fs.existsSync(bundlePath)) {
    console.error('❌ bundle.js not found. Please run build first.');
    process.exit(1);
  }
  
  // Read the bundle content
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  
  // Verify bundle content is complete
  console.log(`📦 Bundle size: ${bundleContent.length} characters`);
  if (bundleContent.length === 0) {
    console.error('❌ Bundle content is empty!');
    process.exit(1);
  }
  
  // Step 1: Create the main index.html file
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Training Modules</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@19/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"></script>
  
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

  // Step 2: Create the css.html file
  const cssHtml = `<style>
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

  /* Additional styles from your build process can go here */
</style>`;

  // Step 3: Create the javascript.html file
  const javascriptHtml = `<script>
${bundleContent}
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
    console.log(`✅ Created javascript.html: ${javascriptHtml.length} characters`);

    // Check if any individual file is too large
    const maxSize = 50000; // 50KB limit for Apps Script
    let hasOversizedFiles = false;

    if (indexHtml.length > maxSize) {
      console.error(`❌ index.html is too large (${indexHtml.length} chars)`);
      hasOversizedFiles = true;
    }
    if (cssHtml.length > maxSize) {
      console.error(`❌ css.html is too large (${cssHtml.length} chars)`);
      hasOversizedFiles = true;
    }
    if (javascriptHtml.length > maxSize) {
      console.error(`❌ javascript.html is too large (${javascriptHtml.length} chars)`);
      hasOversizedFiles = true;
    }

    if (hasOversizedFiles) {
      console.error('⚠️  One or more files exceed Google Apps Script 50KB limit');
      console.error('Consider further code splitting or optimization');
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
    'gas-mocks.html'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    }
  });
  
  console.log('🚀 Google Apps Script deployment files prepared successfully!');
  console.log('📁 Files created:');
  console.log('   - index.html (main template)');
  console.log('   - css.html (styles)');
  console.log('   - javascript.html (application code)');
}

// Run the script
prepareGasDeployment();