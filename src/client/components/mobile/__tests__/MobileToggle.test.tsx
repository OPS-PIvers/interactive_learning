import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileToggle } from '../MobileToggle';
import { vi } from 'vitest';

describe('MobileToggle', () => {
  it('renders correctly', () => {
    const { getByLabelText } = render(
      <MobileToggle
        label="My Toggle"
        enabled={true}
        onChange={() => {}}
      />
    );
    expect(getByLabelText('My Toggle')).toBeInTheDocument();
  });

  it('calls onChange with the new value when the toggle is clicked', () => {
    const handleChange = vi.fn();
    const { getByRole } = render(
      <MobileToggle
        label="My Toggle"
        enabled={false}
        onChange={handleChange}
      />
    );
    const toggle = getByRole('switch');
    fireEvent.click(toggle);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('displays the correct initial state', () => {
    const { getByRole } = render(
      <MobileToggle
        label="My Toggle"
        enabled={true}
        onChange={() => {}}
      />
    );
    const toggle = getByRole('switch');
    expect(toggle.getAttribute('aria-checked')).toBe('true');
  });
});
