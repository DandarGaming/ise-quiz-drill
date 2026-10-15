import React from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { AppearanceSettings, type Theme } from '../app/AppearanceSettings';

export interface HeaderBarProps {
  title: string;
  remainingSeconds: number;
  totalSeconds: number;
  showTimer?: boolean;
  isProctored?: boolean;
  // Pulse the time when it is about to run out
  isWarning?: boolean;
  onExit: () => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const pad = (n: number) => String(n).padStart(2, '0');
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${hours}:${pad(minutes)}:${pad(total % 60)}`;
}

const RADIUS = 9;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  remainingSeconds,
  totalSeconds,
  showTimer = true,
  isProctored = false,
  isWarning = false,
  onExit,
  theme,
  onThemeChange,
}) => {
  const ratio =
    totalSeconds > 0
      ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds))
      : 0;
  const strokeDashoffset = CIRCUMFERENCE * (1 - ratio);

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between min-h-[68px] select-none flex-shrink-0">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {title}
        </h1>
        {isProctored && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-600 text-white rounded text-xs font-bold uppercase tracking-wider">
            <ShieldAlert aria-hidden="true" className="w-3.5 h-3.5" />{' '}
            Proctoring On
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {theme && onThemeChange && (
          <AppearanceSettings theme={theme} onChange={onThemeChange} />
        )}
        {showTimer && (
          <div role="timer" className="flex items-center gap-3">
            <svg
              aria-hidden="true"
              className="w-6 h-6 -rotate-90 flex-shrink-0"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r={RADIUS}
                stroke="#e5e7eb"
                strokeWidth="2.5"
                fill="none"
              />
              <circle
                cx="12"
                cy="12"
                r={RADIUS}
                stroke="#006fbf"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            <div className="flex items-center gap-1.5 font-mono text-lg tracking-tight">
              <span
                className={`transition-all ${
                  isWarning
                    ? 'font-black text-red-700'
                    : 'font-normal text-gray-700'
                }`}
              >
                {formatDuration(remainingSeconds)}
              </span>{' '}
              <span className="font-normal text-gray-700">remaining</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onExit}
          aria-label="Exit quiz"
          className="text-gray-700 hover:text-black p-1 transition-colors ml-2"
          title="Exit Quiz"
        >
          <X aria-hidden="true" className="w-7 h-7 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
};
