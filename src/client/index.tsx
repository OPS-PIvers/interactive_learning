import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './styles.css';
import './index.css';

// Application entry point with comprehensive error handling
async function initializeApp() {
  try {
    console.log('=== APPLICATION STARTUP ===');
    console.log('Starting ExpliCoLearning application...');
    
    // Get root element
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error("Could not find root element to mount to");
    }
    console.log('Root element found successfully');

    // Create React root
    const root = createRoot(rootElement);
    console.log('React root created successfully');

    // Render application
    root.render(
      <React.StrictMode>
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('=== ERROR BOUNDARY CAUGHT ERROR ===');
            console.error('Error:', error);
            console.error('Component Stack:', errorInfo.componentStack);
          }}
        >
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
    
    console.log('React application rendered successfully');
    console.log('=== APPLICATION STARTUP COMPLETE ===');
  } catch (error) {
    console.error('=== CRITICAL APPLICATION ERROR ===');
    console.error('Failed to initialize application:', error);
    
    // Show a simple error message if React fails to initialize
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          padding: 2rem;
          background-color: #1e293b;
          color: #f1f5f9;
          font-family: Inter, sans-serif;
        ">
          <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Failed to Load</h1>
          <p style="margin-bottom: 1rem;">An error occurred while starting the application:</p>
          <pre style="background-color: #374151; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; overflow-x: auto;">
            ${error instanceof Error ? error.message : String(error)}
          </pre>
          <p style="color: #94a3b8;">Please refresh the page or contact support if the problem persists.</p>
        </div>
      `;
    }
  }
}

// Start the application
initializeApp();