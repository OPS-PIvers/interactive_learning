import React from 'react';

const inputClasses = "w-full bg-slate-700 p-2 rounded border border-slate-600 focus:ring-purple-500 focus:border-purple-500";
const labelClasses = "block text-sm font-medium text-slate-300 mb-1";

interface InteractionFormFieldProps {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}

const InteractionFormField: React.FC<InteractionFormFieldProps> = ({ label, htmlFor, children }) => {
  return (
    <div>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label}
      </label>
      {children}
    </div>
  );
};

export { inputClasses, labelClasses };
export default InteractionFormField;
