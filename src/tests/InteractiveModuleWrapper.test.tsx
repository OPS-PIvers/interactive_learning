import React from 'react';
import { render, screen } from '@testing-library/react';
import InteractiveModuleWrapper from '../client/components/InteractiveModuleWrapper';
import { Project } from '../shared/types';
import { AuthProvider } from '../lib/authContext';

const mockProject: Project = {
  id: '1',
  title: 'Test Project',
  interactiveData: {
    hotspots: [],
    timelineEvents: [],
    metadata: {
      version: '',
      initialCamera: undefined,
      panningEnabled: false,
      backgroundColor: ''
    },
    background: {
      type: 'image',
      url: ''
    }
  },
};

describe('InteractiveModuleWrapper', () => {
  it('should render InteractiveModule when interactiveData is present', () => {
    render(
      <AuthProvider>
        <InteractiveModuleWrapper
          selectedProject={mockProject}
          isEditingMode={false}
          isMobile={false}
          onClose={() => {}}
          onSave={() => {}}
        />
      </AuthProvider>
    );
    expect(screen.queryByText('Loading viewer...')).not.toBeInTheDocument();
  });

  it('should render loading message when interactiveData is not present', () => {
    const projectWithoutData = { ...mockProject, interactiveData: undefined };
    render(
      <AuthProvider>
        <InteractiveModuleWrapper
          selectedProject={projectWithoutData as any}
          isEditingMode={false}
          isMobile={false}
          onClose={() => {}}
          onSave={() => {}}
        />
      </AuthProvider>
    );
    expect(screen.getByText('Loading viewer...')).toBeInTheDocument();
  });
});
