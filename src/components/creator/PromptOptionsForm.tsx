import React, { useState } from 'react';
import { AlertTriangle, Sliders } from 'lucide-react';
import type { QuestionType } from '../../types/quiz';
import type { DifficultyMode, PromptOptions } from '../../utils/promptBuilder';

export interface PromptOptionsFormProps {
  value: PromptOptions;
  onChange: (next: PromptOptions) => void;
}

const DIFFICULTIES: { id: DifficultyMode; label: string }[] = [
  { id: 'auto', label: 'Auto (AI Decides)' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' },
  { id: 'custom', label: 'Custom % Breakdown' },
];

const TYPES: { id: QuestionType; label: string }[] = [
  { id: 'mcq', label: 'Multiple Choice' },
  { id: 'multi-select', label: 'Multi-Select' },
  { id: 'true-false', label: 'True / False' },
  { id: 'short-answer', label: 'Short Answer' },
  { id: 'multi-blank', label: 'Multi-Blank' },
];

const CHIPS = [
  {
    label: '+ Code Snippets & Output',
    text: 'Include code snippets for at least 2-3 questions asking to predict the output or find compilation errors.',
  },
  {
    label: '+ Scenario-Based',
    text: 'Structure questions around real-world application scenarios and architectural design problems.',
  },
  {
    label: '+ Tricky Edge Cases',
    text: 'Focus on tricky edge cases, subtle traps, and common student misunderstandings.',
  },
  {
    label: '+ Step-by-Step Explanation',
    text: 'Provide thorough, step-by-step explanations for each correct answer.',
  },
];

const fieldLabel =
  'block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5';
const textInput =
  'w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#006fbf] focus:border-transparent outline-none text-gray-900';
const pctInput =
  'w-full px-3 py-1.5 border border-gray-300 rounded text-xs font-bold focus:ring-2 focus:ring-[#006fbf] outline-none';
const typeChoice =
  'flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer bg-gray-50 border border-gray-200 p-2.5 rounded-lg hover:bg-gray-100';
const acChoice =
  'flex items-center gap-2 text-xs font-semibold text-gray-800 cursor-pointer bg-white border border-gray-300 p-2.5 rounded hover:bg-gray-50 transition-colors';

// An empty field reads as 0 while typing; the prompt locks until it is fixed
const toNumber = (text: string, max: number) =>
  Math.min(max, Math.max(0, Math.floor(Number(text) || 0)));

export const PromptOptionsForm: React.FC<PromptOptionsFormProps> = ({
  value,
  onChange,
}) => {
  const [isPctFocused, setIsPctFocused] = useState(false);
  const set = <K extends keyof PromptOptions>(key: K, next: PromptOptions[K]) =>
    onChange({ ...value, [key]: next });

  const totalCustomPct = value.mix.easy + value.mix.medium + value.mix.hard;
  const isPctInvalid = value.difficulty === 'custom' && totalCustomPct !== 100;
  const isNoTypeSelected = value.types.length === 0;
  const ac = value.antiCheat;
  const setAc = (key: keyof typeof ac, on: boolean) =>
    set('antiCheat', { ...ac, [key]: on });

  const toggleType = (type: QuestionType, on: boolean) =>
    set(
      'types',
      TYPES.map((t) => t.id).filter((t) =>
        t === type ? on : value.types.includes(t),
      ),
    );

  const setMix = (level: keyof PromptOptions['mix'], text: string) =>
    set('mix', { ...value.mix, [level]: toNumber(text, 100) });

  return (
    <form
      aria-labelledby="prompt-options-title"
      onSubmit={(e) => e.preventDefault()}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="bg-[#006fbf] text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Step 1
          </span>
          <h2
            id="prompt-options-title"
            className="text-xl font-bold text-gray-900 flex items-center gap-2"
          >
            <Sliders aria-hidden="true" className="w-5 h-5 text-[#006fbf]" />{' '}
            Configure Test & AI Prompt Options
          </h2>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          Dynamically compiles System Prompt below
        </span>
      </div>

      <div>
        <label htmlFor="prompt-title" className={fieldLabel}>
          Test Title (Optional)
        </label>
        <input
          id="prompt-title"
          type="text"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g., PRJ301 - Java Web Midterm Exam 2026 (Leave blank for AI auto-title)"
          className={`${textInput} font-medium`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="prompt-count" className={fieldLabel}>
            Number of Questions
          </label>
          <input
            id="prompt-count"
            type="number"
            min={1}
            max={50}
            value={value.questionCount || ''}
            onChange={(e) => set('questionCount', toNumber(e.target.value, 50))}
            className={`${textInput} font-semibold`}
          />
        </div>
        <div>
          <label htmlFor="prompt-time" className={fieldLabel}>
            Time Limit (Minutes)
          </label>
          <input
            id="prompt-time"
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
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-4">
        <div>
          <span
            id="prompt-difficulty"
            className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2"
          >
            Difficulty Level
          </span>
          <div
            role="group"
            aria-labelledby="prompt-difficulty"
            className="flex flex-wrap items-center gap-2"
          >
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={value.difficulty === item.id}
                onClick={() => set('difficulty', item.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  value.difficulty === item.id
                    ? 'bg-[#006fbf] text-white border-[#006fbf] shadow-sm'
                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {value.difficulty === 'custom' && (
          <div className="space-y-3 pt-1">
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-4 grid grid-cols-3 gap-4 animate-in fade-in">
              {(
                [
                  ['easy', 'Easy %', 'e.g. 30'],
                  ['medium', 'Medium %', 'e.g. 50'],
                  ['hard', 'Hard %', 'e.g. 20'],
                ] as const
              ).map(([level, text, hint]) => (
                <div key={level}>
                  <label
                    htmlFor={`prompt-mix-${level}`}
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    {text}
                  </label>
                  <input
                    id={`prompt-mix-${level}`}
                    type="number"
                    min={0}
                    max={100}
                    value={value.mix[level]}
                    onChange={(e) => setMix(level, e.target.value)}
                    onFocus={() => setIsPctFocused(true)}
                    onBlur={() => setIsPctFocused(false)}
                    aria-invalid={isPctInvalid ? true : undefined}
                    aria-describedby={
                      isPctInvalid ? 'prompt-mix-error' : undefined
                    }
                    placeholder={hint}
                    className={pctInput}
                  />
                </div>
              ))}
            </div>

            {/* Hidden while typing in a field, so it does not flash on every key */}
            {isPctInvalid && !isPctFocused && (
              <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
                <AlertTriangle
                  aria-hidden="true"
                  className="w-4 h-4 text-amber-600 flex-shrink-0"
                />
                <span>
                  Warning: Total difficulty percentage must equal exactly 100%
                  (Current sum: <strong>{totalCustomPct}%</strong>). Please
                  adjust values.
                </span>
              </div>
            )}
            {isPctInvalid && (
              <span id="prompt-mix-error" className="sr-only">
                The difficulty mix must add up to 100% (now {totalCustomPct}%).
              </span>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-4">
        <span
          id="prompt-layout"
          className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5"
        >
          Test Layout Mode
        </span>
        <div
          role="group"
          aria-labelledby="prompt-layout"
          className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 md:w-1/2"
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

      <div className="pt-2">
        <label htmlFor="prompt-topics" className={fieldLabel}>
          Specific Topics / Focus Areas (Optional)
        </label>
        <input
          id="prompt-topics"
          type="text"
          value={value.topics}
          onChange={(e) => set('topics', e.target.value)}
          placeholder="e.g., Servlets LifeCycle, JSP Implicit Objects, MVC Architecture, Session Cookie..."
          className={textInput}
        />
      </div>

      <fieldset className="space-y-2 pt-2">
        <legend className="block text-xs font-bold uppercase tracking-wider text-gray-700">
          Included Question Types
        </legend>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {TYPES.map((type) => (
            <label key={type.id} className={typeChoice}>
              <input
                type="checkbox"
                checked={value.types.includes(type.id)}
                onChange={(e) => toggleType(type.id, e.target.checked)}
                className="w-4 h-4 rounded text-[#006fbf]"
              />
              {type.label}
            </label>
          ))}
        </div>

        {isNoTypeSelected && (
          <div className="bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-xs font-semibold animate-in fade-in mt-2">
            <AlertTriangle
              aria-hidden="true"
              className="w-4 h-4 text-amber-600 flex-shrink-0"
            />
            <span>
              Warning: You must select at least one question type for the exam.
            </span>
          </div>
        )}
      </fieldset>

      <div className="pt-2 space-y-2">
        <label htmlFor="prompt-notes" className={fieldLabel}>
          Special Instructions / Custom Notes (Optional)
        </label>
        <textarea
          id="prompt-notes"
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="e.g., Include code snippets for at least 2 questions. Focus on subtle edge cases and tricky traps..."
          rows={2.5}
          className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-[#006fbf] focus:border-transparent outline-none text-gray-900 font-medium"
        />

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-bold text-gray-500 mr-1">
            Quick Add Presets:
          </span>
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() =>
                set(
                  'notes',
                  value.notes.trim()
                    ? `${value.notes.trim()}\n${chip.text}`
                    : chip.text,
                )
              }
              className="bg-blue-50 hover:bg-blue-100 text-[#006fbf] border border-blue-200 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer hover:shadow-2xs active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-2 space-y-3">
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
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg space-y-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle
                aria-hidden="true"
                className="w-5 h-5 text-red-600 mt-0.5"
              />
              <div>
                <h3 className="text-sm font-bold text-red-900">
                  Proctoring Mode Active
                </h3>
                <p className="text-xs text-red-700 mt-0.5 font-medium">
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
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
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
