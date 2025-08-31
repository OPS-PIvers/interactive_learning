import React, { Suspense, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import LoadingScreen from './shared/LoadingScreen';
import ToastProvider from './feedback/ToastProvider';

// Lazy-loaded page components
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const HotspotEditorPage = React.lazy(
  () => import('../pages/HotspotEditorPage')
);
const WalkthroughViewerPage = React.lazy(
  () => import('../pages/WalkthroughViewerPage')
);

// A placeholder for the auth page with enhanced logging and visibility
const AuthPage = () => {
  console.log('=== AUTH PAGE RENDERING ===');
  console.log('AuthPage: Component is rendering');
  
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#1e293b', // Dark background to ensure visibility
        color: '#f1f5f9', // Light text color
        fontFamily: 'Inter, sans-serif',
        fontSize: '24px',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      <h1 style={{ color: '#ef4444', margin: 0 }}>Authentication Required</h1>
      <p style={{ color: '#94a3b8', textAlign: 'center', margin: 0 }}>
        Please authenticate to access the application
      </p>
      <div style={{ 
        padding: '10px 20px', 
        backgroundColor: '#374151', 
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        Debug: AuthPage component loaded successfully
      </div>
    </div>
  );
};

// Route tracking component
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('=== ROUTE CHANGE DETECTED ===');
    console.log('Current route:', location.pathname);
    console.log('Search params:', location.search);
    console.log('Hash:', location.hash);
  }, [location]);
  
  return null;
};

const App: React.FC = () => {
  console.log('=== APP COMPONENT RENDERING ===');
  
  return (
    <ToastProvider>
      <Router>
        <RouteTracker />
        <Suspense fallback={<LoadingScreen message="Loading application pages..." />}>
          <Routes>
            {/* Default route redirects to the dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Application routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/editor/:id" element={<HotspotEditorPage />} />
            <Route path="/editor/new" element={<HotspotEditorPage />} />
            <Route path="/view/:id" element={<WalkthroughViewerPage />} />

            {/* A placeholder for authentication */}
            <Route path="/auth" element={<AuthPage />} />

            {/* Fallback route for unmatched paths */}
            <Route
              path="*"
              element={<Navigate to="/dashboard" replace />}
            />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
};

export default App;
