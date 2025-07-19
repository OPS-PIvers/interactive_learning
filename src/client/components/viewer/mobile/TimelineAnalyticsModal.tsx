import React from 'react';
import { TimelineEventData } from '../../../shared/types';

interface TimelineAnalyticsModalProps {
  onClose: () => void;
  timelineEvents: TimelineEventData[];
}

const TimelineAnalyticsModal: React.FC<TimelineAnalyticsModalProps> = ({
  onClose,
  timelineEvents,
}) => {
  const totalSteps = [...new Set(timelineEvents.map(e => e.step))].length;
  const totalEvents = timelineEvents.length;

  // This is a placeholder for actual analytics data.
  // In a real application, this data would be collected and stored.
  const completedSteps = Math.floor(Math.random() * totalSteps);
  const completionRate = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-4 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Timeline Analytics</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-white">Total Steps</h4>
            <p className="text-2xl font-bold text-purple-400">{totalSteps}</p>
          </div>
          <div>
            <h4 className="text-white">Total Events</h4>
            <p className="text-2xl font-bold text-purple-400">{totalEvents}</p>
          </div>
          <div>
            <h4 className="text-white">Completed Steps</h4>
            <p className="text-2xl font-bold text-purple-400">{completedSteps}</p>
          </div>
          <div>
            <h4 className="text-white">Completion Rate</h4>
            <p className="text-2xl font-bold text-purple-400">{completionRate.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineAnalyticsModal;
