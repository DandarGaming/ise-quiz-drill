import React from 'react';
import { Moon, Sun } from 'lucide-react';

export type Theme = 'light' | 'dark';

interface AppearanceSettingsProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
  darkHeader?: boolean;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  theme,
  onChange,
  darkHeader = false,
}) => (
  <div
    role="group"
    aria-label="Appearance"
    className={`flex items-center gap-1 rounded-lg p-1 ${
      darkHeader ? 'bg-slate-800 border border-slate-700' : 'bg-gray-100'
    }`}
  >
    <span
      className={`px-2 text-xs font-semibold ${
        darkHeader ? 'text-slate-300' : 'text-gray-600'
      }`}
    >
      Appearance
    </span>
    <button
      type="button"
      aria-label="Light mode"
      aria-pressed={theme === 'light'}
      onClick={() => onChange('light')}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        theme === 'light'
          ? 'bg-white text-[#006fbf] shadow-sm'
          : darkHeader
            ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Sun aria-hidden="true" className="h-3.5 w-3.5" />
      Light
    </button>
    <button
      type="button"
      aria-label="Dark mode"
      aria-pressed={theme === 'dark'}
      onClick={() => onChange('dark')}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        theme === 'dark'
          ? 'bg-[#006fbf] text-white shadow-sm'
          : darkHeader
            ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      <Moon aria-hidden="true" className="h-3.5 w-3.5" />
      Dark
    </button>
  </div>
);
