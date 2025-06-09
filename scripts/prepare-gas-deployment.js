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
  
  // Create a simplified Apps Script compatible template
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
  
  <!-- React and ReactDOM from CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Simplified App -->
  <script>
    // Simple demonstration app for Apps Script
    const { useState, useEffect } = React;
    const { createRoot } = ReactDOM;

    function App() {
      const [projects, setProjects] = useState([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState(null);

      useEffect(() => {
        // Try to load projects from Google Apps Script
        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler((data) => {
              setProjects(data || []);
              setLoading(false);
            })
            .withFailureHandler((err) => {
              setError(err.message);
              setLoading(false);
            })
            .getProjects();
        } else {
          // Fallback for testing
          setProjects([
            {
              id: 'demo-1',
              title: 'Sample Interactive Module',
              description: 'A demonstration of the interactive learning system',
              thumbnailUrl: null
            }
          ]);
          setLoading(false);
        }
      }, []);

      if (loading) {
        return React.createElement('div', { className: 'min-h-screen flex items-center justify-center' },
          React.createElement('div', { className: 'text-center' },
            React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4' }),
            React.createElement('p', { className: 'text-gray-600' }, 'Loading projects...')
          )
        );
      }

      if (error) {
        return React.createElement('div', { className: 'min-h-screen flex items-center justify-center' },
          React.createElement('div', { className: 'max-w-md mx-auto text-center' },
            React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-6' },
              React.createElement('h2', { className: 'text-red-800 font-semibold mb-2' }, 'Error Loading Projects'),
              React.createElement('p', { className: 'text-red-600' }, error)
            )
          )
        );
      }

      return React.createElement('div', { className: 'min-h-screen bg-slate-100 py-8' },
        React.createElement('div', { className: 'max-w-6xl mx-auto px-4' },
          React.createElement('h1', { className: 'text-3xl font-bold text-gray-900 mb-8 text-center' }, 'Interactive Training Modules'),
          React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
            projects.map(project => 
              React.createElement('div', { 
                key: project.id,
                className: 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow'
              },
                React.createElement('div', { className: 'p-6' },
                  React.createElement('h3', { className: 'text-xl font-semibold text-gray-900 mb-2' }, project.title),
                  React.createElement('p', { className: 'text-gray-600 mb-4' }, project.description),
                  React.createElement('button', { 
                    className: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors',
                    onClick: () => alert('Interactive module would open here!')
                  }, 'Open Module')
                )
              )
            )
          )
        )
      );
    }

    // Initialize the app
    const root = createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
  </script>
</body>
</html>`;

  // Replace the original index.html with the template version (JavaScript embedded directly)
  fs.writeFileSync(indexHtmlPath, indexTemplate);
  
  console.log('✅ Created index.html with embedded JavaScript for Apps Script');
  
  // Clean up files that Apps Script doesn't need
  const filesToRemove = [
    'bundle.js.LICENSE.txt',
    'app-bundle.html',  // Remove old bundle file if it exists
    'bundle.js'  // Remove bundle.js since it's embedded in index.html
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