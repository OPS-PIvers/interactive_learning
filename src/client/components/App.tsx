import React, { Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import LoadingScreen from './shared/LoadingScreen';
import ToastProvider from './feedback/ToastProvider';
import AuthenticationPage from './auth/AuthenticationPage';
import { authService } from '../services/authService';
import { useToast } from './feedback/ToastProvider';

// Lazy-loaded page components
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
const HotspotEditorPage = React.lazy(
  () => import('../pages/HotspotEditorPage')
);
const WalkthroughViewerPage = React.lazy(
  () => import('../pages/WalkthroughViewerPage')
);

// Authentication wrapper component
const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  console.log('=== AUTH PAGE RENDERING ===');
  console.log('AuthPage: Component is rendering');

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithEmail(email, password);
      console.log('AuthPage: Login successful, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.signUpWithEmail(email, password, displayName);
      console.log('AuthPage: Signup successful, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
      console.log('AuthPage: Google sign-in successful, redirecting to dashboard');
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = () => {
    console.log('AuthPage: Development bypass activated');
    // Enable dev bypass in localStorage so useAuth hook can detect it
    localStorage.setItem('devAuthBypass', 'true');
    console.log('AuthPage: Dev bypass enabled, redirecting to dashboard');
    navigate('/dashboard');
  };

  return (
    <AuthenticationPage
      onLogin={handleLogin}
      onSignup={handleSignup}
      onGoogleSignIn={handleGoogleSignIn}
      onDevBypass={handleDevBypass}
      loading={loading}
      error={error}
    />
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
