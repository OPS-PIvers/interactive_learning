import React, { useState } from 'react';
import { PlusCircleIcon } from '../icons/PlusCircleIcon';

interface MobileStepManagerProps {
  onAddStep: (step: number) => void;
}

const MobileStepManager: React.FC<MobileStepManagerProps> = ({ onAddStep }) => {
  const [newStep, setNewStep] = useState('');

  const handleAddStep = () => {
    const stepNumber = parseInt(newStep, 10);
    if (!isNaN(stepNumber)) {
      onAddStep(stepNumber);
      setNewStep('');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="number"
        value={newStep}
        onChange={(e) => setNewStep(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleAddStep();
          }
        }}
        className="w-20 bg-slate-800 text-white p-2 rounded"
        placeholder="Step #"
      />
      <button
        onClick={handleAddStep}
        className="p-2 bg-purple-600 rounded-full text-white"
      >
        <PlusCircleIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default MobileStepManager;
