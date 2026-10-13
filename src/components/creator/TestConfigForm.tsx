import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { TestConfig } from '../../utils/promptBuilder';

export interface TestConfigFormProps {
  value: TestConfig;
  onChange: (next: TestConfig) => void;
}

const fieldLabel =
  'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5';
const textInput =
  'w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#006fbf] focus:border-transparent outline-none text-gray-900';
const acChoice =
  'flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer bg-white border border-gray-300 p-2.5 rounded hover:bg-gray-50 transition-colors';

// An empty field reads as 0 while typing; the quiz cannot start until it is fixed
const toNumber = (text: string, max: number) =>
  Math.min(max, Math.max(0, Math.floor(Number(text) || 0)));

export const TestConfigForm: React.FC<TestConfigFormProps> = ({
  value,
  onChange,
}) => {
  const [titleTouched, setTitleTouched] = useState(false);
  const titleMissing = titleTouched && !value.title.trim();
  const set = <K extends keyof TestConfig>(key: K, next: TestConfig[K]) =>
    onChange({ ...value, [key]: next });

  const ac = value.antiCheat;
  const setAc = (key: keyof typeof ac, on: boolean) =>
    set('antiCheat', { ...ac, [key]: on });

  return (
    <form
      aria-label="Test Settings"
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6"
    >
      <div>
        <div className="flex items-baseline gap-1 mb-1.5">
          <label
            htmlFor="test-title"
            className="text-xs font-bold uppercase tracking-wider text-gray-700"
          >
            Test Title
          </label>
          <span aria-hidden="true" className="text-red-600 font-bold">
            *
          </span>
          {titleMissing && (
            <span className="ml-auto text-xs font-bold text-red-600">
              Required
            </span>
          )}
        </div>
        <input
          id="test-title"
          type="text"
          required
          aria-invalid={titleMissing ? true : undefined}
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          onBlur={() => setTitleTouched(true)}
          className={`${textInput} font-medium ${
            titleMissing ? 'border-red-600 focus:ring-red-600' : ''
          }`}
        />
      </div>

      <div>
        <label htmlFor="test-time" className={fieldLabel}>
          Time Limit (Minutes)
        </label>
        <input
          id="test-time"
          type="number"
          min={1}
          max={180}
          value={value.timeLimitMinutes || ''}
          onChange={(e) =>
            set('timeLimitMinutes', toNumber(e.target.value, 180))
          }
          className={`${textInput} font-semibold`}
        />
      </div>

      <div className="border-t border-gray-100 pt-4">
        <span
          id="test-layout"
          className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
        >
          Test Layout Mode
        </span>
        <div
          role="group"
          aria-labelledby="test-layout"
          className="flex bg-gray-100 p-1 rounded-lg border border-gray-200"
        >
          {(
            [
              ['paginated', 'Paginated (1 Q / Page)'],
              ['single-page', 'Scroll Form (All Questions)'],
            ] as const
          ).map(([mode, text]) => (
            <button
              key={mode}
              type="button"
              aria-pressed={value.templateMode === mode}
              onClick={() => set('templateMode', mode)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                value.templateMode === mode
                  ? 'bg-white text-[#006fbf] shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Anti-Cheat Settings (Proctoring)
          </span>
          <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
            <span className={ac.enabled ? 'text-[#006fbf]' : 'text-gray-400'}>
              Enable Anti-Cheat
            </span>
            <input
              type="checkbox"
              checked={ac.enabled}
              onChange={(e) => setAc('enabled', e.target.checked)}
              className="w-4 h-4 rounded text-[#006fbf] cursor-pointer"
            />
          </label>
        </div>

        {ac.enabled && (
          <div className="border border-gray-300 p-4 rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="w-5 h-5 text-gray-600 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Proctoring Mode Active
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 font-medium">
                  When enabled, violations will be automatically logged to the
                  Audit Trail.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {(
                [
                  ['tabLock', 'Tab & Focus Lock'],
                  ['uiRestrictions', 'Block Copy / Paste'],
                  ['fullscreenLock', 'Require Fullscreen'],
                ] as const
              ).map(([key, text]) => (
                <label key={key} className={acChoice}>
                  <input
                    type="checkbox"
                    checked={ac[key]}
                    onChange={(e) => setAc(key, e.target.checked)}
                    className="w-4 h-4 rounded text-[#006fbf] cursor-pointer"
                  />
                  {text}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </form>
  );
};
