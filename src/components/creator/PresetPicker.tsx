import { useEffect, useId, useRef, useState } from 'react';
import { track } from '../../utils/analytics';
import type { Preset } from '../../utils/presets';
import { fieldLabel, textInput } from './formFields';

export interface PresetPickerProps<T> {
  // Words for "what this picker fills", for example "the prompt options"
  scope: string;
  presets: Preset[];
  value: T;
  onChange: (next: T) => void;
  applyPreset: (preset: Preset) => T;
  reset: () => T;
  describe: (preset: Preset) => string;
}

type Pending = { kind: 'apply'; preset: Preset } | { kind: 'reset' };

const primary =
  'px-4 py-2 rounded-lg text-sm font-bold bg-[#006fbf] hover:bg-[#005694] text-white cursor-pointer disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed';
const secondary =
  'px-4 py-2 rounded-lg text-sm font-bold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer';

// Fills a form from a built-in preset. Nothing changes until Apply, and the
// user is asked first when that would throw away something typed by hand.
export function PresetPicker<T>({
  scope,
  presets,
  value,
  onChange,
  applyPreset,
  reset,
  describe,
}: PresetPickerProps<T>) {
  const selectId = useId();
  const [selectedId, setSelectedId] = useState('');
  const [pending, setPending] = useState<Pending | null>(null);
  const [message, setMessage] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);

  const selected = presets.find((preset) => preset.id === selectedId);

  useEffect(() => {
    if (pending) confirmRef.current?.focus();
  }, [pending]);

  // Untouched means the value is the defaults or exactly what a preset gives,
  // so it can be rebuilt and nothing typed by hand is lost
  const isEdited = () => {
    const current = JSON.stringify(value);
    const rebuildable = [reset(), ...presets.map(applyPreset)];
    return !rebuildable.some((known) => JSON.stringify(known) === current);
  };

  const run = (action: Pending) => {
    if (action.kind === 'apply') {
      onChange(applyPreset(action.preset));
      track({ event: 'preset_applied', props: { presetId: action.preset.id } });
      setMessage(`Applied ${action.preset.name} to ${scope}.`);
    } else {
      onChange(reset());
      setMessage(`Reset ${scope} to the app defaults.`);
    }
    setPending(null);
  };

  const request = (action: Pending) => {
    if (isEdited()) setPending(action);
    else run(action);
  };

  return (
    <div role="group" aria-label="Exam preset" className="space-y-3">
      <label htmlFor={selectId} className={fieldLabel}>
        Exam preset (optional)
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <select
          id={selectId}
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className={`${textInput} sm:w-auto sm:min-w-[240px]`}
        >
          <option value="">Choose a preset…</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected}
          onClick={() =>
            selected && request({ kind: 'apply', preset: selected })
          }
          className={primary}
        >
          Apply preset
        </button>
        <button
          type="button"
          onClick={() => request({ kind: 'reset' })}
          className={secondary}
        >
          Reset to defaults
        </button>
      </div>

      {selected && (
        <p className="text-sm text-gray-700">{describe(selected)}</p>
      )}

      {pending && (
        <div className="border-l-4 border-[#b45309] pl-3 py-1 flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold text-gray-900">
            {pending.kind === 'apply'
              ? `Replace your changes with ${pending.preset.name}?`
              : `Reset ${scope} and lose your changes?`}
          </p>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => run(pending)}
            className={primary}
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            className={secondary}
          >
            Cancel
          </button>
        </div>
      )}

      <p
        role="status"
        className={
          message
            ? 'border-l-4 border-[#006fbf] pl-3 text-sm text-gray-900'
            : 'sr-only'
        }
      >
        {message}
      </p>
    </div>
  );
}
