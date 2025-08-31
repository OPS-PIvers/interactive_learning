import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HotspotWalkthrough } from '../../shared/hotspotTypes';
import { getUserWalkthroughs, deleteWalkthrough } from '../../lib/firebaseApi';
import { useAuth } from '../hooks/useAuth';
import ProjectCard from '../components/dashboard/ProjectCard';
import CreateWalkthroughModal from '../components/dashboard/CreateWalkthroughModal';
import LoadingScreen from '../components/shared/LoadingScreen';
import ErrorScreen from '../components/shared/ErrorScreen';
import { useToast } from '../components/feedback/ToastProvider';

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError, logout } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [walkthroughs, setWalkthroughs] = useState<HotspotWalkthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    // Wait for auth to complete loading before making navigation decisions
    if (authLoading) {
      return;
    }

    if (authError) {
      console.error('Dashboard: Auth error detected:', authError);
      setError(`Authentication error: ${authError}`);
      setLoading(false);
      return;
    }

    if (!user) {
      console.log('Dashboard: No user, redirecting to auth');
      navigate('/auth');
      return;
    }

    console.log('Dashboard: User authenticated, loading walkthroughs');
    loadWalkthroughs();
  }, [user, authLoading, authError, navigate]);

  const loadWalkthroughs = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await getUserWalkthroughs(user.uid);
      // Ensure data is always an array to prevent undefined access
      setWalkthroughs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Dashboard: Error loading walkthroughs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load walkthroughs');
      // Reset to empty array on error to prevent undefined state
      setWalkthroughs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this walkthrough?')) return;

    try {
      await deleteWalkthrough(id);
      setWalkthroughs(prev => (prev || []).filter(w => w.id !== id));
      showToast({
        type: 'success',
        title: 'Walkthrough Deleted',
        message: 'The walkthrough has been deleted successfully.'
      });
    } catch (err) {
      console.error('Dashboard: Error deleting walkthrough:', err);
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete walkthrough. Please try again.'
      });
    }
  };

  const handleDuplicate = async (walkthrough: HotspotWalkthrough) => {
    const duplicate = {
      ...walkthrough,
      id: undefined,
      title: `${walkthrough.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPublished: false
    };

    // Navigate to editor with duplicate data
    navigate('/editor/new', { state: { duplicate } });
  };

  // Show loading screen while auth is loading or while loading walkthroughs
  if (authLoading || loading) {
    return <LoadingScreen message={authLoading ? "Authenticating..." : "Loading your walkthroughs..."} />;
  }

  if (error) {
    return (
      <ErrorScreen
        title="Dashboard Error"
        error={new Error(error)}
        onReload={loadWalkthroughs}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Hotspot Walkthroughs
              </h1>
              <p className="text-gray-600">
                Create interactive onboarding experiences
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                Welcome, {user?.displayName || user?.email || 'User'}!
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Walkthrough
              </button>
              <button
                onClick={logout}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!walkthroughs || walkthroughs.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.122 2.122" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No walkthroughs yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first interactive walkthrough to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Your First Walkthrough
            </button>
          </div>
        ) : (
          /* Project Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(walkthroughs || []).map((walkthrough) => (
              <ProjectCard
                key={walkthrough.id}
                walkthrough={walkthrough}
                onEdit={() => navigate(`/editor/${walkthrough.id}`)}
                onView={() => navigate(`/view/${walkthrough.id}`)}
                onDuplicate={() => handleDuplicate(walkthrough)}
                onDelete={() => handleDelete(walkthrough.id)}
                onShare={() => {
                  const url = `${window.location.origin}/view/${walkthrough.id}`;
                  navigator.clipboard.writeText(url);
                  showToast({
                    type: 'success',
                    title: 'Link Copied',
                    message: 'Share link copied to clipboard!'
                  });
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      <CreateWalkthroughModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onConfirm={(title, description) => {
          navigate('/editor/new', { state: { title, description } });
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
