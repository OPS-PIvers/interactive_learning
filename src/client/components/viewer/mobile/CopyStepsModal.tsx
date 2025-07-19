import React, { useState, useEffect } from 'react';
import { Project, TimelineEventData } from '../../../shared/types';
import { firebaseAPI } from '../../../lib/firebaseApi';

interface CopyStepsModalProps {
  onClose: () => void;
  onCopySteps: (steps: TimelineEventData[]) => void;
}

const CopyStepsModal: React.FC<CopyStepsModalProps> = ({ onClose, onCopySteps }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventData[]>([]);
  const [selectedSteps, setSelectedSteps] = useState<number[]>([]);

  useEffect(() => {
    firebaseAPI.listProjects().then(setProjects);
  }, []);

  useEffect(() => {
    if (selectedProject) {
      firebaseAPI.getProjectDetails(selectedProject.id).then(details => {
        setTimelineEvents(details.timelineEvents || []);
      });
    } else {
      setTimelineEvents([]);
    }
  }, [selectedProject]);

  const toggleStepSelection = (step: number) => {
    setSelectedSteps(prev =>
      prev.includes(step) ? prev.filter(s => s !== step) : [...prev, step]
    );
  };

  const handleCopy = () => {
    const stepsToCopy = timelineEvents.filter(event => selectedSteps.includes(event.step));
    onCopySteps(stepsToCopy);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-4 w-11/12 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Copy Steps from Project</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>

        <div className="mb-4">
          <label htmlFor="project-select" className="text-white mb-2 block">
            Select a project:
          </label>
          <select
            id="project-select"
            onChange={(e) => {
              const project = projects.find(p => p.id === e.target.value) || null;
              setSelectedProject(project);
            }}
            className="w-full bg-slate-700 text-white p-2 rounded"
          >
            <option value="">-- Select a project --</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {selectedProject && (
          <div>
            <h4 className="text-white mb-2">Select steps to copy:</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {timelineEvents.map(event => (
                <div key={event.id} className="bg-slate-700 p-2 rounded">
                  <label className="flex items-center text-white">
                    <input
                      type="checkbox"
                      checked={selectedSteps.includes(event.step)}
                      onChange={() => toggleStepSelection(event.step)}
                      className="mr-2"
                    />
                    Step {event.step}: {event.name}
                  </label>
                </div>
              ))}
            </div>
            <button
              onClick={handleCopy}
              disabled={selectedSteps.length === 0}
              className="mt-4 bg-purple-600 text-white px-4 py-2 rounded disabled:opacity-50 w-full"
            >
              Copy Selected Steps
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CopyStepsModal;
