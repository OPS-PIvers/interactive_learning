import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Prepare Google Apps Script deployment
 * This script creates the HTML files needed for Apps Script
 */
function prepareGasDeployment() {
  const distDir = path.join(__dirname, '..', 'dist');
  const bundlePath = path.join(distDir, 'bundle.js');
  
  // Check if bundle exists
  if (!fs.existsSync(bundlePath)) {
    console.error('bundle.js not found. Please run build first.');
    process.exit(1);
  }
  
  // Read the bundle content
  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  
  // Create JavaScript.html file that Apps Script can include
  const jsHtmlPath = path.join(distDir, 'JavaScript.html');
  const jsHtmlContent = `<script>\n${bundleContent}\n</script>`;
  fs.writeFileSync(jsHtmlPath, jsHtmlContent);
  console.log('✅ Created JavaScript.html for Apps Script');
  
  // Create CSS.html file (even if empty for now)
  const cssHtmlPath = path.join(distDir, 'CSS.html');
  let cssContent = '';
  const cssPath = path.join(distDir, 'bundle.css');
  if (fs.existsSync(cssPath)) {
    cssContent = fs.readFileSync(cssPath, 'utf8');
  }
  const cssHtmlContent = `<style>\n${cssContent}\n</style>`;
  fs.writeFileSync(cssHtmlPath, cssHtmlContent);
  console.log('✅ Created CSS.html for Apps Script');

  // Create the main index.html file for Apps Script
  const indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interactive Training Modules</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
    ::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
    .subtle-pulse-animation { animation: subtle-pulse-keyframes 2s infinite ease-in-out; }
    @keyframes subtle-pulse-keyframes { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
  </style>
  <?!= HtmlService.createHtmlOutputFromFile('CSS').getContent(); ?>
</head>
<body class="bg-slate-100">
  <div id="root"></div>
  <?!= HtmlService.createHtmlOutputFromFile('JavaScript').getContent(); ?>
</body>
</html>`;

  const indexHtmlPath = path.join(distDir, 'index.html');
  fs.writeFileSync(indexHtmlPath, indexHtmlContent);
  console.log('✅ Created index.html for Apps Script');
  
  // Clean up files that Apps Script doesn't need
  const filesToRemove = [
    'bundle.js',
    'bundle.css',
    'bundle.js.LICENSE.txt'
  ];
  
  filesToRemove.forEach(file => {
    const filePath = path.join(distDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Removed ${file}`);
    }
  });
  
  console.log('🚀 Google Apps Script deployment files prepared successfully!');
  console.log('📝 Next steps:');
  console.log('   1. Copy dist/index.html content to your Apps Script index.html file');
  console.log('   2. Copy dist/JavaScript.html content to your Apps Script JavaScript.html file');
  console.log('   3. Copy dist/CSS.html content to your Apps Script CSS.html file');
  console.log('   4. Deploy your Apps Script web app');
}

// Run the script
prepareGasDeployment();