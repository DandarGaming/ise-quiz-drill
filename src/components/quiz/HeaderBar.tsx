import { ShieldAlert, X } from 'lucide-react';

export interface HeaderBarProps {
  title: string;
  remainingSeconds: number;
  totalSeconds: number;
  showTimer?: boolean;
  isProctored?: boolean;
  // Pulse the time when it is about to run out
  isWarning?: boolean;
  onExit: () => void;
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

export function HeaderBar({
  title,
  remainingSeconds,
  totalSeconds,
  showTimer = true,
  isProctored = false,
  isWarning = false,
  onExit,
}: HeaderBarProps) {
  const ratio =
    totalSeconds > 0
      ? Math.min(1, Math.max(0, remainingSeconds / totalSeconds))
      : 0;

  return (
    <header className="flex min-h-[68px] flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-8 py-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        {isProctored && (
          <span className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
            <ShieldAlert aria-hidden="true" className="h-3.5 w-3.5" />
            Proctoring on
          </span>
        )}
      </div>

      <div className="flex items-center gap-6">
        {showTimer && (
          <div role="timer" className="flex items-center gap-3">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6 flex-shrink-0 -rotate-90"
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
                strokeDashoffset={CIRCUMFERENCE * (1 - ratio)}
                strokeLinecap="round"
              />
            </svg>
            <span className="font-mono text-lg tracking-tight text-gray-700">
              <span
                className={
                  isWarning
                    ? 'font-black text-black motion-safe:animate-pulse'
                    : ''
                }
              >
                {formatDuration(remainingSeconds)}
              </span>{' '}
              remaining
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label="Exit quiz"
          onClick={onExit}
          className="ml-2 p-1 text-gray-700 hover:text-black"
        >
          <X aria-hidden="true" className="h-7 w-7 stroke-[2.5]" />
        </button>
      </div>
    </header>
  );
}
