import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileQuizSettings } from '../MobileQuizSettings';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';

describe('MobileQuizSettings', () => {
  const event: TimelineEvent = {
    type: InteractionType.QUIZ,
    id: '1',
    quizQuestion: 'What is the capital of France?',
    quizOptions: ['Paris', 'London', 'Berlin', 'Madrid'],
    quizCorrectAnswer: 0,
  };

  it('renders correctly', () => {
    const { getByDisplayValue } = render(
      <MobileQuizSettings event={event} onChange={() => {}} />
    );
    expect(getByDisplayValue('What is the capital of France?')).toBeInTheDocument();
  });

  it('calls onChange when the question is changed', () => {
    const handleChange = vi.fn();
    const { getByLabelText } = render(
      <MobileQuizSettings event={event} onChange={handleChange} />
    );
    const questionInput = getByLabelText('Question');
    fireEvent.change(questionInput, { target: { value: 'New Question' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ quizQuestion: 'New Question' }));
  });

  it('calls onChange when an option is changed', () => {
    const handleChange = vi.fn();
    const { getByTestId } = render(
      <MobileQuizSettings event={event} onChange={handleChange} />
    );
    const optionInput = getByTestId('option-0');
    fireEvent.change(optionInput, { target: { value: 'New Option' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ quizOptions: ['New Option', 'London', 'Berlin', 'Madrid'] }));
  });

  it('calls onChange when the correct answer is changed', () => {
    const handleChange = vi.fn();
    const { getAllByRole } = render(
      <MobileQuizSettings event={event} onChange={handleChange} />
    );
    const radioButtons = getAllByRole('radio');
    fireEvent.click(radioButtons[1]);
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ quizCorrectAnswer: 1 }));
  });
});
