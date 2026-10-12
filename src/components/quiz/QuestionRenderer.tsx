import { useState } from 'react';
import { Bookmark, Check, Strikethrough } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { isAnswered, type Answer } from '../../utils/answers';

export interface QuestionRendererProps {
  question: Question;
  answer: Answer | undefined;
  isFlagged: boolean;
  onAnswerChange: (answer: Answer) => void;
  onToggleFlag: () => void;
}

const BLANK = '[BLANK]';

function CodeSnippet({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <figure
      aria-label="Code snippet"
      className="my-6 flex overflow-x-auto rounded-lg border border-gray-800 bg-[#1e1e1e] font-mono text-base leading-relaxed"
    >
      <div
        aria-hidden="true"
        className="min-w-[44px] select-none border-r border-[#2d2d2d] bg-[#181818] px-3.5 py-3.5 text-right text-[#858585]"
      >
        {lines.map((_, index) => (
          <div key={index}>{index + 1}</div>
        ))}
      </div>
      <pre className="flex-1 px-4 py-3.5 text-[#d4d4d4]">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

const textInput =
  'rounded-md border border-gray-300 bg-white outline-none focus:border-[#006fbf] focus:ring-1 focus:ring-[#006fbf]';

export function QuestionRenderer({
  question,
  answer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
}: QuestionRendererProps) {
  // Struck-out options are a reading aid only, so they are not saved
  const [struck, setStruck] = useState<Record<string, boolean>>({});

  const headingId = `${question.id}-heading`;
  const isMulti = question.type === 'multi-select';
  const selected = Array.isArray(answer) ? answer : [];
  const isSelected = (optionId: string) =>
    isMulti ? selected.includes(optionId) : answer === optionId;

  const selectOption = (optionId: string) => {
    if (struck[optionId]) setStruck((prev) => ({ ...prev, [optionId]: false }));
    if (!isMulti) return onAnswerChange(optionId);
    onAnswerChange(
      selected.includes(optionId)
        ? selected.filter((id) => id !== optionId)
        : [...selected, optionId],
    );
  };

  const toggleStrike = (optionId: string) => {
    const willStrike = !struck[optionId];
    if (willStrike && isSelected(optionId)) {
      onAnswerChange(isMulti ? selected.filter((id) => id !== optionId) : '');
    }
    setStruck((prev) => ({ ...prev, [optionId]: willStrike }));
  };

  const promptParts = question.prompt.split(BLANK);
  const blankValues = Array.from(
    { length: promptParts.length - 1 },
    (_, index) => (Array.isArray(answer) ? answer[index] : undefined) ?? '',
  );
  const changeBlank = (index: number, value: string) => {
    const next = [...blankValues];
    next[index] = value;
    onAnswerChange(next);
  };

  const pointLabel = question.points === 1 ? 'point' : 'points';

  return (
    <fieldset aria-labelledby={headingId} className="mb-2 bg-white py-1">
      <div className="mb-2 flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <h2
            id={headingId}
            className="text-lg font-bold tracking-tight text-gray-900"
          >
            Question {question.number} ({question.points} {pointLabel})
          </h2>
          {isAnswered(answer) && (
            <span className="ml-1 flex items-center gap-1.5 text-sm italic text-gray-500">
              <Check aria-hidden="true" className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
        </div>
        <button
          type="button"
          aria-label="Flag question"
          aria-pressed={isFlagged}
          onClick={onToggleFlag}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100"
        >
          <Bookmark
            aria-hidden="true"
            className={
              isFlagged
                ? 'h-5 w-5 fill-[#006fbf] text-[#006fbf]'
                : 'h-5 w-5 text-gray-500'
            }
          />
        </button>
      </div>

      <div className="space-y-6 pl-3">
        <p className="whitespace-pre-wrap text-lg leading-relaxed text-gray-900">
          {question.type === 'multi-blank'
            ? promptParts.map((part, index) => (
                <span key={index}>
                  {part}
                  {index < blankValues.length && (
                    <input
                      type="text"
                      aria-label={`Blank ${index + 1}`}
                      value={blankValues[index]}
                      onChange={(event) =>
                        changeBlank(index, event.target.value)
                      }
                      className={`${textInput} mx-1 inline-block w-40 px-2.5 py-1.5 text-center text-base font-bold`}
                    />
                  )}
                </span>
              ))
            : question.prompt}
        </p>

        {question.codeSnippet && <CodeSnippet code={question.codeSnippet} />}

        {question.type === 'short-answer' && (
          <input
            type="text"
            aria-label="Answer"
            placeholder="Type your answer here..."
            value={typeof answer === 'string' ? answer : ''}
            onChange={(event) => onAnswerChange(event.target.value)}
            className={`${textInput} w-full max-w-lg px-3 py-2.5 text-lg`}
          />
        )}

        {question.options && question.options.length > 0 && (
          <ul className="flex flex-col">
            {question.options.map((option) => {
              const inputId = `${question.id}-${option.id}`;
              const isStruck = !!struck[option.id];
              return (
                <li
                  key={option.id}
                  className="group flex items-center justify-between px-2.5 py-2.5 hover:bg-[#f0f7fd] has-[:checked]:bg-[#dbeefe]"
                >
                  <label
                    htmlFor={inputId}
                    className={`flex flex-1 cursor-pointer items-center gap-3 pr-2 ${isStruck ? 'opacity-40' : ''}`}
                  >
                    <input
                      id={inputId}
                      type={isMulti ? 'checkbox' : 'radio'}
                      name={question.id}
                      value={option.id}
                      checked={isSelected(option.id)}
                      onChange={() => selectOption(option.id)}
                      className="h-5 w-5 flex-shrink-0 accent-[#006fbf]"
                    />
                    <span
                      className={`text-lg leading-snug text-gray-900 ${isStruck ? 'text-gray-500 line-through' : ''}`}
                    >
                      {option.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Strike out ${option.text}`}
                    aria-pressed={isStruck}
                    onClick={() => toggleStrike(option.id)}
                    className={`rounded-md p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 focus:opacity-100 group-hover:opacity-100 ${isStruck ? 'bg-gray-200 text-gray-900 opacity-100' : 'opacity-0'}`}
                  >
                    <Strikethrough aria-hidden="true" className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </fieldset>
  );
}
