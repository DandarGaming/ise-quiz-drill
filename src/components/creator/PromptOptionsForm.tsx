import type { ReactNode } from 'react';
import { QUESTION_TYPES, type QuestionType } from '../../types/quiz';
import type { DifficultyMode, PromptOptions } from '../../utils/promptBuilder';

export interface PromptOptionsFormProps {
  value: PromptOptions;
  onChange: (next: PromptOptions) => void;
}

const DIFFICULTIES: [DifficultyMode, string][] = [
  ['auto', 'Auto'],
  ['easy', 'Easy'],
  ['medium', 'Medium'],
  ['hard', 'Hard'],
  ['custom', 'Custom mix'],
];

const TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'Multiple choice',
  'multi-select': 'Multiple select',
  'true-false': 'True / false',
  'short-answer': 'Short answer',
  'multi-blank': 'Fill in the blanks',
};

const input =
  'w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-[#006fbf]';
const label =
  'mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700';
const choice =
  'flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm font-semibold text-gray-800';

// Empty input reads as 0 while typing; validation reports it
const toNumber = (text: string, max: number) =>
  Math.min(max, Math.max(0, Math.floor(Number(text) || 0)));

function Field({
  id,
  text,
  children,
}: {
  id: string;
  text: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
    </div>
  );
}

export function PromptOptionsForm({ value, onChange }: PromptOptionsFormProps) {
  const set = <K extends keyof PromptOptions>(key: K, next: PromptOptions[K]) =>
    onChange({ ...value, [key]: next });

  const mixTotal = value.mix.easy + value.mix.medium + value.mix.hard;
  const mixError =
    value.difficulty === 'custom' && mixTotal !== 100
      ? `The difficulty mix must add up to 100% (now ${mixTotal}%).`
      : null;

  const toggleType = (type: QuestionType, on: boolean) =>
    set(
      'types',
      QUESTION_TYPES.filter((t) => (t === type ? on : value.types.includes(t))),
    );

  const ac = value.antiCheat;
  const setAc = (key: keyof typeof ac, on: boolean) =>
    set('antiCheat', { ...ac, [key]: on });

  return (
    <form
      aria-labelledby="prompt-options-title"
      onSubmit={(event) => event.preventDefault()}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 id="prompt-options-title" className="text-xl font-bold text-gray-900">
        Test options
      </h2>

      <Field id="prompt-title" text="Test title (optional)">
        <input
          id="prompt-title"
          type="text"
          value={value.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="Leave blank to let the AI name it"
          className={input}
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field id="prompt-count" text="Number of questions">
          <input
            id="prompt-count"
            type="number"
            min={1}
            max={50}
            value={value.questionCount || ''}
            onChange={(e) => set('questionCount', toNumber(e.target.value, 50))}
            className={input}
          />
        </Field>
        <Field id="prompt-time" text="Time limit (minutes)">
          <input
            id="prompt-time"
            type="number"
            min={1}
            max={180}
            value={value.timeLimitMinutes || ''}
            onChange={(e) =>
              set('timeLimitMinutes', toNumber(e.target.value, 180))
            }
            className={input}
          />
        </Field>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="prompt-layout"
        className="space-y-2"
      >
        <span id="prompt-layout" className={label}>
          Layout
        </span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['paginated', 'One question per page'],
              ['single-page', 'All questions on one page'],
            ] as const
          ).map(([mode, text]) => (
            <label key={mode} className={choice}>
              <input
                type="radio"
                name="prompt-layout"
                checked={value.templateMode === mode}
                onChange={() => set('templateMode', mode)}
                className="accent-[#006fbf]"
              />
              {text}
            </label>
          ))}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="prompt-difficulty"
        className="space-y-2"
      >
        <span id="prompt-difficulty" className={label}>
          Difficulty
        </span>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map(([mode, text]) => (
            <label key={mode} className={choice}>
              <input
                type="radio"
                name="prompt-difficulty"
                checked={value.difficulty === mode}
                onChange={() => set('difficulty', mode)}
                className="accent-[#006fbf]"
              />
              {text}
            </label>
          ))}
        </div>
        {value.difficulty === 'custom' && (
          <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="grid grid-cols-3 gap-4">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Field
                  key={level}
                  id={`prompt-mix-${level}`}
                  text={`${level[0].toUpperCase()}${level.slice(1)} %`}
                >
                  <input
                    id={`prompt-mix-${level}`}
                    type="number"
                    min={0}
                    max={100}
                    value={value.mix[level]}
                    aria-invalid={mixError ? true : undefined}
                    aria-describedby={mixError ? 'prompt-mix-error' : undefined}
                    onChange={(e) =>
                      set('mix', {
                        ...value.mix,
                        [level]: toNumber(e.target.value, 100),
                      })
                    }
                    className={input}
                  />
                </Field>
              ))}
            </div>
            {mixError && (
              <p
                id="prompt-mix-error"
                className="text-sm font-semibold text-red-700"
              >
                {mixError}
              </p>
            )}
          </div>
        )}
      </div>

      <fieldset className="space-y-2">
        <legend className={label}>Question types</legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {QUESTION_TYPES.map((type) => (
            <label key={type} className={choice}>
              <input
                type="checkbox"
                checked={value.types.includes(type)}
                onChange={(e) => toggleType(type, e.target.checked)}
                className="accent-[#006fbf]"
              />
              {TYPE_LABELS[type]}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="prompt-topics" text="Focus topics (optional)">
        <textarea
          id="prompt-topics"
          rows={2}
          value={value.topics}
          onChange={(e) => set('topics', e.target.value)}
          placeholder="e.g. infrastructure as code, CDK stacks, S3 and CloudFront"
          className={input}
        />
      </Field>

      <Field id="prompt-notes" text="Special instructions (optional)">
        <textarea
          id="prompt-notes"
          rows={2}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
          className={input}
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className={label}>Proctoring</legend>
        <label className={choice}>
          <input
            type="checkbox"
            checked={ac.enabled}
            onChange={(e) => setAc('enabled', e.target.checked)}
            className="accent-[#006fbf]"
          />
          Enable proctoring
        </label>
        <div className="grid grid-cols-1 gap-2 pl-6 md:grid-cols-3">
          {(
            [
              ['tabLock', 'Lock to this tab'],
              ['uiRestrictions', 'Block copy, paste and right-click'],
              ['fullscreenLock', 'Require fullscreen'],
            ] as const
          ).map(([key, text]) => (
            <label
              key={key}
              className={`${choice} ${ac.enabled ? '' : 'opacity-50'}`}
            >
              <input
                type="checkbox"
                disabled={!ac.enabled}
                checked={ac[key]}
                onChange={(e) => setAc(key, e.target.checked)}
                className="accent-[#006fbf]"
              />
              {text}
            </label>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
