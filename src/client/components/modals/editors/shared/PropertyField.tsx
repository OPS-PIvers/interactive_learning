import React from 'react';

interface PropertyFieldProps {
  label: string;
  children: React.ReactNode;
}

const PropertyField: React.FC<PropertyFieldProps> = ({ label, children }) => {
  return (
    <div className="mb-4">
      <label className="text-sm text-slate-300 mb-2 block">{label}</label>
      {children}
    </div>
  );
};

export default PropertyField;
