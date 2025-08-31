import React, { useState } from 'react';
import ResponsiveModal from '../responsive/ResponsiveModal';

interface CreateWalkthroughModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (title: string, description: string) => void;
}

export default function CreateWalkthroughModal({
  isOpen,
  onClose,
  onConfirm
}: CreateWalkthroughModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    if (title.trim()) {
      onConfirm(title, description);
    }
  };

  return (
    <ResponsiveModal
      type="settings"
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Walkthrough"
      size="medium"
    >
      <div className="space-y-6">
        <div>
          <label
            htmlFor="walkthrough-title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Walkthrough Title
          </label>
          <input
            type="text"
            id="walkthrough-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 'New Employee Onboarding'"
          />
        </div>

        <div>
          <label
            htmlFor="walkthrough-description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <textarea
            id="walkthrough-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Briefly describe what this walkthrough is about"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!title.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            Create Walkthrough
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
