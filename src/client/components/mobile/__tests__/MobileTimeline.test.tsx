import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileTimeline from '../MobileTimeline';
import { TimelineEventData, HotspotData } from '../../../../shared/types';
import { vi } from 'vitest';

describe('MobileTimeline', () => {
  const uniqueSortedSteps = [1, 2, 3];
  const timelineEvents: TimelineEventData[] = [];
  const hotspots: HotspotData[] = [];

  it('renders correctly', () => {
    const { getByText } = render(
      <MobileTimeline
        uniqueSortedSteps={uniqueSortedSteps}
        currentStep={1}
        onStepSelect={() => {}}
        timelineEvents={timelineEvents}
        hotspots={hotspots}
        onAddStep={() => {}}
        onDeleteStep={() => {}}
        onUpdateStep={() => {}}
        onMoveStep={() => {}}
      />
    );
    expect(getByText('Timeline')).toBeInTheDocument();
  });

  it('calls onStepSelect when a step is clicked', () => {
    const handleStepSelect = vi.fn();
    const { getByText } = render(
      <MobileTimeline
        uniqueSortedSteps={uniqueSortedSteps}
        currentStep={1}
        onStepSelect={handleStepSelect}
        timelineEvents={timelineEvents}
        hotspots={hotspots}
        onAddStep={() => {}}
        onDeleteStep={() => {}}
        onUpdateStep={() => {}}
        onMoveStep={() => {}}
      />
    );
    fireEvent.click(getByText('2'));
    expect(handleStepSelect).toHaveBeenCalledWith(2);
  });
});
