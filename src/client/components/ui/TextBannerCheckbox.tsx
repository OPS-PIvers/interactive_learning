import React from 'react';

interface TextBannerCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
}

const TextBannerCheckbox: React.FC<TextBannerCheckboxProps> = ({
  checked,
  onChange,
  id,
  className = ''
}) => {
  return (
    <div className={className}>
      <label className="flex items-center text-sm font-medium text-slate-300">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mr-2 form-checkbox h-4 w-4 text-purple-600 bg-slate-600 border-slate-500 rounded focus:ring-purple-500 focus:ring-offset-slate-800 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-offset-slate-900"
        />
        Show Text Banner
      </label>
    </div>
  );
};

export default TextBannerCheckbox;