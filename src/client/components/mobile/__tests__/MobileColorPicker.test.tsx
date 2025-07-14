import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileColorPicker } from '../MobileColorPicker';
import { vi } from 'vitest';

describe('MobileColorPicker', () => {
  it('renders correctly', () => {
    const { getByLabelText } = render(<MobileColorPicker label="Color Picker" color="#ffffff" onChange={() => {}} />);
    expect(getByLabelText('Color Picker')).toBeInTheDocument();
  });

  it('calls onChange with the new color when a color is selected', () => {
    const handleChange = vi.fn();
    const { getByLabelText } = render(<MobileColorPicker label="Color Picker" color="#ffffff" onChange={handleChange} />);
    const colorInput = getByLabelText('Color Picker');
    fireEvent.change(colorInput, { target: { value: '#ff0000' } });
    expect(handleChange).toHaveBeenCalledWith('#ff0000');
  });

  it('displays the correct initial color', () => {
    const { getByLabelText } = render(<MobileColorPicker label="Color Picker" color="#00ff00" onChange={() => {}} />);
    const colorInput = getByLabelText('Color Picker') as HTMLInputElement;
    expect(colorInput.value).toBe('#00ff00');
  });
});
