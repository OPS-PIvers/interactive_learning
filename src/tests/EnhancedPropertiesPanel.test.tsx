import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedPropertiesPanel from '../client/components/EnhancedPropertiesPanel';
import { SlideElement, DeviceType } from '../shared/slideTypes';
import { vi } from 'vitest';

// Mock dependencies
vi.mock('../client/hooks/useIsMobile', () => ({
  useIsMobile: () => true,
}));

vi.mock('../client/components/mobile/MobileColorPicker', () => ({
  MobileColorPicker: ({ color, onChange }) => (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      data-testid="color-picker"
    />
  ),
}));



const mockElement: SlideElement = {
  id: 'elem1',
  type: 'hotspot',
  position: {
    desktop: { x: 10, y: 20, width: 30, height: 40 },
    mobile: { x: 60, y: 70, width: 80, height: 90 },
    tablet: { x: 160, y: 170, width: 180, height: 190 },
  },
  content: {
    title: 'Test Hotspot',
    description: 'A test description',
    customProperties: {
      size: 'medium',
      color: 'bg-red-500',
    },
  },
  style: {
    backgroundColor: '#ff0000',
    borderRadius: 50,
    opacity: 0.8,
  },
  interactions: [],
};

const defaultProps = {
  selectedElement: mockElement,
  onElementUpdate: vi.fn(),
  onSlideUpdate: vi.fn(),
  deviceType: 'mobile' as DeviceType,
  isMobile: true,
  currentSlide: {
    id: 'slide1',
    elements: [mockElement],
    backgroundMedia: null,
  }
};

describe('EnhancedPropertiesPanel Component Tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering and Initialization', () => {
    test('renders properties panel with element data', () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Properties - Hotspot Element'));
      expect(screen.getByText('Properties - Hotspot Element')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Hotspot')).toBeInTheDocument();

      // Check for color value in a text input, not a color input
      const textInputs = screen.getAllByDisplayValue('#ff0000');
      expect(textInputs.some(input => input.getAttribute('type') === 'text')).toBe(true);
    });

    test('shows style presets section open by default for hotspots', () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      expect(screen.getByText('Style Presets')).toBeInTheDocument();
    });


    test('renders slide properties when no element is selected', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} selectedElement={null} />);

      await waitFor(() => {
        expect(screen.getByText('Slide Background')).toBeInTheDocument();
      });
      expect(screen.queryByText('hotspot Element')).not.toBeInTheDocument();
    });
  });

  describe('Collapsible Sections', () => {
    test('can toggle collapsible sections', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);

      // The main properties section should be collapsed by default
      expect(screen.queryByDisplayValue('Test Hotspot')).not.toBeInTheDocument();

      // Open the properties section
      const mainHeader = screen.getByText('Properties - Hotspot Element');
      fireEvent.click(mainHeader);

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Hotspot')).toBeVisible();
      });

      // Close the properties section
      fireEvent.click(mainHeader);
      
      await waitFor(() => {
        expect(screen.queryByDisplayValue('Test Hotspot')).not.toBeInTheDocument();
      });
    });

    test('touch events on sections work correctly', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);

      const mainHeader = screen.getByText('Properties - Hotspot Element');
      fireEvent.click(mainHeader);

      await waitFor(() => {
        expect(screen.getByDisplayValue('60')).toBeVisible(); // x-position for mobile
      });
    });

    test('multiple sections can be open simultaneously', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);

      // Open main element properties section
      fireEvent.click(screen.getByText('Properties - Hotspot Element'));
      
      // Wait for properties section to open, then also try to open style presets
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test Hotspot')).toBeVisible();
        expect(screen.getByDisplayValue('60')).toBeVisible(); // position value
      });

      // Note: Style Presets section should already be open by default for hotspots
      // Check if style presets content is visible
      expect(screen.getByText('Style Presets')).toBeVisible();
    });
  });

  describe('Element Updates', () => {
    test('updates element title', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      const titleInput = screen.getByDisplayValue('Test Hotspot');
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(defaultProps.onElementUpdate).toHaveBeenCalledWith(mockElement.id, {
        content: { ...mockElement.content, title: 'New Title' },
      });
    });

    test('updates element description', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      const descInput = screen.getByDisplayValue('A test description');
      fireEvent.change(descInput, { target: { value: 'New Description' } });

      expect(defaultProps.onElementUpdate).toHaveBeenCalledWith(mockElement.id, {
        content: { ...mockElement.content, description: 'New Description' },
      });
    });

    test('updates element background color', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      const colorInput = screen.getAllByDisplayValue('#ff0000').find(i => i.getAttribute('type') === 'text');
      fireEvent.change(colorInput, { target: { value: '#00ff00' } });

      expect(defaultProps.onElementUpdate).toHaveBeenCalledWith(
        mockElement.id,
        expect.objectContaining({
          style: expect.objectContaining({ backgroundColor: '#00ff00' }),
        })
      );
    });

    test('updates element position for mobile device', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);

      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      const xInput = screen.getByDisplayValue('60');
      fireEvent.change(xInput, { target: { value: '65' } });

      await waitFor(() => {
        expect(defaultProps.onElementUpdate).toHaveBeenCalledWith(mockElement.id, {
          position: {
            ...mockElement.position,
            mobile: { ...mockElement.position.mobile, x: 65 },
          },
        });
      });
    });
  });

  describe('Interactions Management', () => {
    test('shows interactions section when opened', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      expect(await screen.findByTestId('interactions-list')).toBeInTheDocument();
    });

    test('can add new interactions', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      
      const modalButton = await screen.findByText('Modal Dialog');
      fireEvent.click(modalButton);

      expect(defaultProps.onElementUpdate).toHaveBeenCalledWith(
        mockElement.id,
        expect.objectContaining({
          interactions: expect.arrayContaining([
            expect.objectContaining({
              effect: expect.objectContaining({ type: 'modal' }),
            }),
          ]),
        })
      );
    });
  });

  describe('Device Type Handling', () => {
    test('works correctly with different device types', async () => {
      const { rerender } = render(
        <EnhancedPropertiesPanel {...defaultProps} deviceType="tablet" />
      );

      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      // Should show tablet position values
      await waitFor(() => {
        expect(screen.getByDisplayValue('160')).toBeInTheDocument();
      });

      rerender(<EnhancedPropertiesPanel {...defaultProps} deviceType="desktop" />);

      // Should show desktop position values
      await waitFor(() => {
        expect(screen.getByDisplayValue('10')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles element with missing properties gracefully', () => {
      const minimalElement = { 
        id: 'elem2', 
        type: 'hotspot', 
        position: { 
          desktop: { x: 0, y: 0, width: 10, height: 10 }, 
          mobile: { x: 0, y: 0, width: 10, height: 10 }, 
          tablet: { x: 0, y: 0, width: 10, height: 10 } 
        }, 
        content: {}, 
        style: {}, 
        interactions: [], 
        isVisible: true 
      };
      render(<EnhancedPropertiesPanel {...defaultProps} selectedElement={minimalElement} />);

      expect(screen.getByText('Properties - Hotspot Element')).toBeInTheDocument();
      // Should not crash
    });

    test('handles rapid successive updates correctly', async () => {
      render(<EnhancedPropertiesPanel {...defaultProps} />);
      fireEvent.click(screen.getByText('Properties - Hotspot Element'));

      const titleInput = screen.getByDisplayValue('Test Hotspot');
      fireEvent.change(titleInput, { target: { value: 'A' } });
      fireEvent.change(titleInput, { target: { value: 'AB' } });
      fireEvent.change(titleInput, { target: { value: 'ABC' } });

      expect(defaultProps.onElementUpdate).toHaveBeenCalledTimes(3);
      expect(defaultProps.onElementUpdate).toHaveBeenLastCalledWith(mockElement.id, {
        content: { ...mockElement.content, title: 'ABC' },
      });
    });
  });
});