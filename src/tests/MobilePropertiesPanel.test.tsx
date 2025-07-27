import React from 'react';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { MobilePropertiesPanel } from '../client/components/slides/MobilePropertiesPanel';
import { SlideElement, DeviceType } from '../shared/slideTypes';

// Mock dependencies
vi.mock('../client/components/interactions/InteractionsList', () => ({
  default: () => <div data-testid="interactions-list">Interactions List</div>
}));

vi.mock('../client/components/interactions/InteractionEditor', () => ({
  default: () => <div data-testid="interaction-editor">Interaction Editor</div>
}));

vi.mock('../client/components/icons/ChevronDownIcon', () => ({
  default: ({ className }: { className?: string }) => (
    <div data-testid="chevron-icon" className={className}>Chevron</div>
  )
}));

describe('MobilePropertiesPanel Component Tests', () => {
  const mockOnElementUpdate = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnClose = vi.fn();

  const mockElement: SlideElement = {
    id: 'test-element-1',
    type: 'hotspot',
    position: {
      desktop: { x: 100, y: 100, width: 50, height: 50 },
      tablet: { x: 80, y: 80, width: 40, height: 40 },
      mobile: { x: 60, y: 60, width: 30, height: 30 }
    },
    style: {
      backgroundColor: '#ff0000',
      borderRadius: '50%',
      opacity: 0.8
    },
    content: {
      title: 'Test Hotspot',
      description: 'Test hotspot description'
    },
    interactions: []
  };

  const defaultProps = {
    selectedElement: mockElement,
    deviceType: 'mobile' as DeviceType,
    onElementUpdate: mockOnElementUpdate,
    onDelete: mockOnDelete,
    onClose: mockOnClose
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('Rendering and Initialization', () => {
    test('renders mobile properties panel with element data', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });

      // Only style section is open by default
      expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
    });

    test('shows style section open by default', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      await waitFor(() => {
        // Style section should be expanded by default
        expect(screen.getByText('Background Color')).toBeInTheDocument();
      });
    });

    test('shows auto-save confirmation message', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('✓ Changes saved automatically')).toBeInTheDocument();
      });
    });

    test('renders without element (null case)', async () => {
      render(<MobilePropertiesPanel {...defaultProps} selectedElement={null} />);

      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });

      // Should still render the panel structure
      expect(screen.getByText('Properties')).toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    test('style section is open by default', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      await waitFor(() => {
        // Style section content should be visible
        expect(screen.getByText('Background Color')).toBeInTheDocument();
        expect(screen.getByText('Border Radius')).toBeInTheDocument();
      });
    });

    test('can toggle collapsible sections', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      // Find and click the content section header
      const contentHeader = screen.getByText('Content');
      fireEvent.click(contentHeader);

      await waitFor(() => {
        // Content section should expand
        expect(screen.getByText('Title')).toBeInTheDocument();
      });

      // Click again to collapse
      fireEvent.click(contentHeader);

      await waitFor(() => {
        // Content section should collapse
        expect(screen.queryByText('Title')).not.toBeInTheDocument();
      });
    });

    test('touch events on sections work correctly', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const positionHeader = screen.getByText('Position');
      
      // Simulate touch start
      fireEvent.touchStart(positionHeader);
      fireEvent.click(positionHeader);

      await waitFor(() => {
        // Position section should expand
        expect(screen.getByText('X Position')).toBeInTheDocument();
      });
    });

    test('multiple sections can be open simultaneously', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      // Style section is open by default
      expect(screen.getByText('Background Color')).toBeInTheDocument();

      // Open content section
      fireEvent.click(screen.getByText('Content'));

      await waitFor(() => {
        // Both sections should be open
        expect(screen.getByText('Background Color')).toBeInTheDocument();
        expect(screen.getByText('Title')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Event Isolation', () => {
    test('modal overlay prevents event bubbling', async () => {
      const mockStopPropagation = vi.fn();
      
      render(<MobilePropertiesPanel {...defaultProps} />);

      const modalOverlay = document.querySelector('.fixed.inset-0');

      expect(modalOverlay).toBeInTheDocument();

      // Simulate touch on overlay
      fireEvent.touchStart(modalOverlay!, { 
        target: modalOverlay,
        currentTarget: modalOverlay 
      });

      // Should not interfere with underlying slide editor
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('clicking outside modal closes it', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const modalOverlay = document.querySelector('.fixed.inset-0');
      
      // Click the overlay itself (not a child)
      fireEvent.click(modalOverlay!, { 
        target: modalOverlay,
        currentTarget: modalOverlay 
      });

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    test('interactive elements have touch protection', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close properties');
      const deleteButton = screen.getByText('Delete Element');
      const doneButton = screen.getByText('Done');

      // Touch events should not propagate from interactive elements
      [closeButton, deleteButton, doneButton].forEach(button => {
        fireEvent.touchStart(button);
        // Should not trigger modal close
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Element Updates', () => {
    test('updates element title', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      // Open content section
      fireEvent.click(screen.getByText('Content'));

      const titleInput = screen.getByDisplayValue('Test Hotspot');
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      await waitFor(() => {
        expect(mockOnElementUpdate).toHaveBeenCalledWith('test-element-1', {
          content: {
            ...mockElement.content,
            title: 'Updated Title'
          }
        });
      });
    });

    test('updates element description', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Content'));

      const descInput = screen.getByDisplayValue('Test hotspot description');
      fireEvent.change(descInput, { target: { value: 'Updated description' } });

      await waitFor(() => {
        expect(mockOnElementUpdate).toHaveBeenCalledWith('test-element-1', {
          content: {
            ...mockElement.content,
            description: 'Updated description'
          }
        });
      });
    });

    test('updates element background color', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      // Style section is open by default
      const colorInput = screen.getByDisplayValue('#ff0000');
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      await waitFor(() => {
        expect(mockOnElementUpdate).toHaveBeenCalledWith('test-element-1', {
          style: {
            ...mockElement.style,
            backgroundColor: '#00ff00'
          }
        });
      });
    });

    test('updates element position for mobile device', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Position'));

      const xInput = screen.getByDisplayValue('60');
      fireEvent.change(xInput, { target: { value: '80' } });

      await waitFor(() => {
        expect(mockOnElementUpdate).toHaveBeenCalledWith('test-element-1', {
          position: {
            ...mockElement.position,
            mobile: {
              ...mockElement.position.mobile,
              x: 80
            }
          }
        });
      });
    });
  });

  describe('Action Buttons', () => {
    test('close button works correctly', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close properties');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('delete button works correctly', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const deleteButton = screen.getByText('Delete Element');
      fireEvent.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalled();
    });

    test('done button works correctly', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const doneButton = screen.getByText('Done');
      fireEvent.click(doneButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    test('buttons have correct styling', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      const deleteButton = screen.getByText('Delete Element');
      const doneButton = screen.getByText('Done');

      // Delete button should be red
      expect(deleteButton).toHaveClass('bg-red-600');
      
      // Done button should be blue (updated from slate)
      expect(doneButton).toHaveClass('bg-blue-600');
    });
  });

  describe('Interactions Management', () => {
    test('shows interactions section when opened', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Interactions'));

      await waitFor(() => {
        expect(screen.getByTestId('interactions-list')).toBeInTheDocument();
      });
    });

    test('can add new interactions', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Interactions'));

      // Mock interaction type selection
      const addButton = screen.getByText('Add Interaction');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnElementUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Device Type Handling', () => {
    test('works correctly with different device types', async () => {
      const { rerender } = render(
        <MobilePropertiesPanel {...defaultProps} deviceType="tablet" />
      );

      fireEvent.click(screen.getByText('Position'));

      // Should show tablet position values
      expect(screen.getByDisplayValue('80')).toBeInTheDocument(); // tablet x

      rerender(
        <MobilePropertiesPanel {...defaultProps} deviceType="desktop" />
      );

      // Should show desktop position values  
      expect(screen.getByDisplayValue('100')).toBeInTheDocument(); // desktop x
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles element with missing properties gracefully', async () => {
      const incompleteElement = {
        id: 'incomplete',
        type: 'hotspot',
        position: {
          desktop: { x: 0, y: 0, width: 10, height: 10 },
          tablet: { x: 0, y: 0, width: 8, height: 8 },
          mobile: { x: 0, y: 0, width: 6, height: 6 }
        },
        style: {}, // Empty style object
        content: {}, // Empty content object
        interactions: []
      } as SlideElement;

      render(
        <MobilePropertiesPanel 
          {...defaultProps} 
          selectedElement={incompleteElement} 
        />
      );

      // Should not crash and show reasonable defaults
      await waitFor(() => {
        expect(screen.getByText('Properties')).toBeInTheDocument();
      });
    });

    test('handles rapid successive updates correctly', async () => {
      render(<MobilePropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Content'));
      
      const titleInput = screen.getByDisplayValue('Test Hotspot');
      
      // Rapid changes
      fireEvent.change(titleInput, { target: { value: 'A' } });
      fireEvent.change(titleInput, { target: { value: 'AB' } });
      fireEvent.change(titleInput, { target: { value: 'ABC' } });

      await waitFor(() => {
        // Should handle updates gracefully
        expect(mockOnElementUpdate).toHaveBeenCalled();
      });
    });
  });
});