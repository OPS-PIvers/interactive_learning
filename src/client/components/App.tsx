import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
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

// A placeholder for the auth page
const AuthPage = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <h1>Authentication Page</h1>
  </div>
);

const App: React.FC = () => {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
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
