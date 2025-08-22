export interface ColorScheme {
  name: string;
  colors: string[];
}

export interface ColorPreset {
  name: string;
  value: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  {
    name: 'Default',
    colors: ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500']
  },
  {
    name: 'Professional',
    colors: ['bg-slate-700', 'bg-teal-600', 'bg-gray-600', 'bg-blue-700', 'bg-slate-800']
  },
  {
    name: 'Warm',
    colors: ['bg-orange-500', 'bg-amber-500', 'bg-red-600', 'bg-yellow-600', 'bg-orange-600']
  },
  {
    name: 'Cool',
    colors: ['bg-sky-500', 'bg-cyan-500', 'bg-blue-600', 'bg-indigo-500', 'bg-teal-500']
  },
  {
    name: 'High Contrast',
    colors: ['bg-black', 'bg-white', 'bg-red-600', 'bg-yellow-400', 'bg-blue-600']
  }
];

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
];
