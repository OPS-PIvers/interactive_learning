import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileStepManager from '../MobileStepManager';
import { vi } from 'vitest';

describe('MobileStepManager', () => {
  it('renders correctly', () => {
    const { getByPlaceholderText } = render(<MobileStepManager onAddStep={() => {}} />);
    expect(getByPlaceholderText('Step #')).toBeInTheDocument();
  });

  it('calls onAddStep when a valid step is added', () => {
    const handleAddStep = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <MobileStepManager onAddStep={handleAddStep} />
    );
    const input = getByPlaceholderText('Step #');
    const button = getByRole('button');

    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(button);

    expect(handleAddStep).toHaveBeenCalledWith(5);
  });

  it('does not call onAddStep when an invalid step is added', () => {
    const handleAddStep = vi.fn();
    const { getByPlaceholderText, getByRole } = render(
      <MobileStepManager onAddStep={handleAddStep} />
    );
    const input = getByPlaceholderText('Step #');
    const button = getByRole('button');

    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.click(button);

    expect(handleAddStep).not.toHaveBeenCalled();
  });
});
