import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { MobileSpotlightSettings } from '../MobileSpotlightSettings';
import { InteractionType, TimelineEvent } from '../../../../shared/types';
import { vi } from 'vitest';
import { CircleIcon, SquareIcon } from '@radix-ui/react-icons';

const shapes = [
    { value: 'circle', label: 'Circle', icon: <CircleIcon className="w-8 h-8" /> },
    { value: 'rectangle', label: 'Rectangle', icon: <SquareIcon className="w-8 h-8" /> },
];

describe('MobileSpotlightSettings', () => {
    const event: TimelineEvent = {
        type: InteractionType.SPOTLIGHT,
        id: '1',
        spotlightWidth: 100,
        spotlightHeight: 100,
        spotlightShape: 'circle',
    };

    it('renders correctly', () => {
        const { getByLabelText } = render(
            <MobileSpotlightSettings event={event} onUpdate={() => {}} />
        );
        expect(getByLabelText('Size')).toBeInTheDocument();
    });

    it('calls onUpdate when the size is changed', () => {
        const handleUpdate = vi.fn();
        const { getByLabelText } = render(
            <MobileSpotlightSettings event={event} onUpdate={handleUpdate} />
        );
        const sizeInput = getByLabelText('Size');
        fireEvent.change(sizeInput, { target: { value: '150' } });
        expect(handleUpdate).toHaveBeenCalledWith({ spotlightWidth: 150, spotlightHeight: 150 });
    });

    it('calls onUpdate when the shape is changed', () => {
        const handleUpdate = vi.fn();
        const { getByRole } = render(
            <MobileSpotlightSettings event={event} onUpdate={handleUpdate} />
        );
        const shapeSelector = getByRole('radio', { name: 'Rectangle' });
        fireEvent.click(shapeSelector);
        expect(handleUpdate).toHaveBeenCalledWith({ spotlightShape: 'rectangle' });
    });
});
