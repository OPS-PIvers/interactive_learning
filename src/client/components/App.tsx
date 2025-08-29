import React, { useState, useEffect } from 'react';
import * as firebaseApi from '../../lib/firebaseApi';
import { DevAuthBypass, TEST_USERS } from '../../lib/testAuthUtils';
import { SlideDeck } from '../../shared/slideTypes';
import SlideViewer from './viewer/SlideViewer';

interface User {
  uid: string;
  email: string | null;
}

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [slideDeck, setSlideDeck] = useState<SlideDeck | null>(null);
  const [editableTitle, setEditableTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Enable dev auth bypass
    const devBypass = DevAuthBypass.getInstance();
    if (devBypass.isEnabled()) {
      const bypassUser = devBypass.getBypassUser();
      setUser(bypassUser);
    } else {
        // In a real app, you'd have a proper auth flow.
        // For now, we'll just set a default test user.
        console.warn("Dev auth bypass not enabled. Forcing test user.");
        devBypass.setBypassUser(TEST_USERS.DEVELOPER);
        setUser(devBypass.getBypassUser());
    }
  }, []);

  useEffect(() => {
    if (user) {
      const storedProjectId = localStorage.getItem('projectId');
      if (storedProjectId) {
        setProjectId(storedProjectId);
      } else {
        console.log("No project ID found, creating a new one...");
        firebaseApi.createProjectForUser(user.uid, "My New Project")
          .then((newProjectId: string) => {
            localStorage.setItem('projectId', newProjectId);
            setProjectId(newProjectId);
          })
          .catch((err: Error) => {
            console.error("Failed to create project:", err);
            setError("Could not create a new project.");
          });
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && projectId) {
      setIsLoading(true);
      firebaseApi.loadSlideDeck(user.uid, projectId)
        .then((deck: SlideDeck | null) => {
          setSlideDeck(deck);
          if (deck) {
            setEditableTitle(deck.title);
          }
          setIsLoading(false);
        })
        .catch((err: Error) => {
          console.error("Failed to load slide deck:", err);
          setError(`Could not load slide deck: ${err.message}`);
          setIsLoading(false);
        });
    }
  }, [user, projectId]);

  const handleSaveTitle = async () => {
    if (!user || !slideDeck) return;

    setIsSaving(true);
    const updatedDeck: SlideDeck = { ...slideDeck, title: editableTitle };

    try {
      await firebaseApi.saveSlideDeck(user.uid, updatedDeck);
      setSlideDeck(updatedDeck);
    } catch (err) {
      console.error("Failed to save title:", err);
      setError("Could not save the new title.");
      // Optionally, revert the title change in the UI
      setEditableTitle(slideDeck.title);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <div>Authenticating...</div>;
  }

  if (isLoading) {
    return <div>Loading Slide Deck...</div>;
  }

  if (error) {
    return <div style={{ color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>ExpliCo</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            style={{ fontSize: '1.5rem', padding: '5px' }}
            disabled={isSaving}
          />
          <button onClick={handleSaveTitle} disabled={isSaving || editableTitle === slideDeck?.title}>
            {isSaving ? 'Saving...' : 'Save Title'}
          </button>
        </div>
      </header>

      <main>
        {slideDeck && slideDeck.slides.length > 0 ? (
          <>
            <SlideViewer slideDeck={slideDeck} currentSlideIndex={currentSlideIndex} />
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <button
                onClick={() => setCurrentSlideIndex(i => Math.max(0, i - 1))}
                disabled={currentSlideIndex === 0}
              >
                Previous Slide
              </button>
              <span>Slide {currentSlideIndex + 1} of {slideDeck.slides.length}</span>
              <button
                onClick={() => setCurrentSlideIndex(i => Math.min(slideDeck.slides.length - 1, i + 1))}
                disabled={currentSlideIndex === slideDeck.slides.length - 1}
              >
                Next Slide
              </button>
            </div>
          </>
        ) : (
          <p>This slide deck is empty.</p>
        )}
      </main>
    </div>
  );
};

export default App;
