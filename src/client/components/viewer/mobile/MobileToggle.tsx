import React, { useId } from 'react';

interface MobileToggleProps {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export const MobileToggle: React.FC<MobileToggleProps> = ({
  label,
  enabled,
  onChange,
  className = ''
}) => {
  const id = useId();
  
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <label id={`${id}-label`} className="text-sm font-medium text-gray-300">{label}</label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby={`${id}-label`}
        className={`${
          enabled ? 'bg-blue-600' : 'bg-slate-700'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        onClick={() => onChange(!enabled)}
      >
        <span
          aria-hidden="true"
          className={`${
            enabled ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </button>
    </div>
  );
};
