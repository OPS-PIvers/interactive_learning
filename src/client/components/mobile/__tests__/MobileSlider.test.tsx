import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileSlider } from '../MobileSlider';
import { vi } from 'vitest';

describe('MobileSlider', () => {
  it('renders correctly', () => {
    const { getByLabelText } = render(
      <MobileSlider
        label="My Slider"
        value={50}
        min={0}
        max={100}
        onChange={() => {}}
      />
    );
    expect(getByLabelText('My Slider')).toBeInTheDocument();
  });

  it('calls onChange with the new value when the slider is moved', () => {
    const handleChange = vi.fn();
    const { getByLabelText } = render(
      <MobileSlider
        label="My Slider"
        value={50}
        min={0}
        max={100}
        onChange={handleChange}
      />
    );
    const slider = getByLabelText('My Slider');
    fireEvent.change(slider, { target: { value: '75' } });
    expect(handleChange).toHaveBeenCalledWith(75);
  });

  it('displays the correct initial value', () => {
    const { getByLabelText } = render(
      <MobileSlider
        label="My Slider"
        value={25}
        min={0}
        max={100}
        onChange={() => {}}
      />
    );
    const slider = getByLabelText('My Slider') as HTMLInputElement;
    expect(slider.value).toBe('25');
  });
});
