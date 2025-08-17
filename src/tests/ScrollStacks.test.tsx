import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScrollStacks from '../client/components/ScrollStacks';
import { Project } from '../shared/types';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

// @ts-ignore
global.IntersectionObserver = mockIntersectionObserver;

// Mock the ProjectCard component
vi.mock('../client/components/ProjectCard', () => ({
  default: ({ project, onEdit, onDelete }: { project: Project; onEdit: () => void; onDelete: (id: string) => void }) => (
    <div data-testid={`project-card-${project.id}`}>
      <h3>{project.title}</h3>
      <p>{project.description}</p>
      <button onClick={onEdit}>Edit</button>
      <button onClick={() => onDelete(project.id)}>Delete</button>
    </div>
  )
}));

const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Test Project 1',
    description: 'First test project',
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    projectType: 'slide',
    interactiveData: {}
  },
  {
    id: '2',
    title: 'Test Project 2',
    description: 'Second test project',
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    projectType: 'slide',
    interactiveData: {}
  },
  {
    id: '3',
    title: 'Test Project 3',
    description: 'Third test project',
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    projectType: 'slide',
    interactiveData: {}
  }
];

const manyProjects: Project[] = [
  ...mockProjects,
  {
    id: '4',
    title: 'Test Project 4',
    description: 'Fourth test project',
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    projectType: 'slide',
    interactiveData: {}
  },
  {
    id: '5',
    title: 'Test Project 5',
    description: 'Fifth test project',
    createdBy: 'test-user',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublished: false,
    projectType: 'slide',
    interactiveData: {}
  }
];

describe('ScrollStacks', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnEdit.mockClear();
    mockOnDelete.mockClear();
  });

  it('renders all projects in grid layout when 3 or fewer projects', () => {
    render(
      <BrowserRouter>
        <ScrollStacks
          projects={mockProjects}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-3')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
  });

  it('renders scroll stacks layout when more than 3 projects', () => {
    render(
      <BrowserRouter>
        <ScrollStacks
          projects={manyProjects}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-4')).toBeInTheDocument();
    expect(screen.getByTestId('project-card-5')).toBeInTheDocument();
  });

  it('handles empty projects array', () => {
    render(
      <BrowserRouter>
        <ScrollStacks
          projects={[]}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    expect(screen.queryByTestId(/project-card-/)).not.toBeInTheDocument();
  });

  it('calls onEdit callback when edit button is clicked', () => {
    render(
      <BrowserRouter>
        <ScrollStacks
          projects={mockProjects}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
    editButtons[0]!.click();

    expect(mockOnEdit).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('calls onDelete callback when delete button is clicked', () => {
    render(
      <BrowserRouter>
        <ScrollStacks
          projects={mockProjects}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      </BrowserRouter>
    );

    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons.length).toBeGreaterThan(0);
    deleteButtons[0]!.click();

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});