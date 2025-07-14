import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileShapeSelector } from '../MobileShapeSelector';
import { vi } from 'vitest';

const shapes = [
  { value: 'circle', label: 'Circle', icon: <div /> },
  { value: 'rectangle', label: 'Rectangle', icon: <div /> },
];

describe('MobileShapeSelector', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <MobileShapeSelector
        label="Shape"
        shapes={shapes}
        selectedShape="circle"
        onChange={() => {}}
      />
    );
    expect(getByText('Circle')).toBeInTheDocument();
  });

  it('calls onChange with the new shape when a shape is selected', () => {
    const handleChange = vi.fn();
    const { getByText } = render(
      <MobileShapeSelector
        label="Shape"
        shapes={shapes}
        selectedShape="circle"
        onChange={handleChange}
      />
    );
    const rectangleButton = getByText('Rectangle');
    fireEvent.click(rectangleButton);
    expect(handleChange).toHaveBeenCalledWith('rectangle');
  });

  it('displays the correct selected shape', () => {
    const { getByText } = render(
      <MobileShapeSelector
        label="Shape"
        shapes={shapes}
        selectedShape="rectangle"
        onChange={() => {}}
      />
    );
    const rectangleButton = getByText('Rectangle').parentElement;
    expect(rectangleButton).toHaveClass('border-blue-500');
  });
});
