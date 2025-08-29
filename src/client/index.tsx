import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import './styles.css';
import './index.css';
import { firebaseManager } from '../lib/firebaseConfig';
import { getAnalytics } from "firebase/analytics";

// Initialize Firebase
firebaseManager.initialize();
const app = firebaseManager.getApp();
if (app) {
  const analytics = getAnalytics(app);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);