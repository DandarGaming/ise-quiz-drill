import React, { useEffect, useRef, useState } from 'react';
import { Bookmark, RefreshCw, X } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { isAnswered, type Answer } from '../../utils/answers';
import { gradeQuestion } from '../../utils/grading';

export interface QuestionRendererProps {
  question: Question;
  answer: Answer | undefined;
  isFlagged: boolean;
  onAnswerChange: (answer: Answer) => void;
  onToggleFlag: () => void;
  reviewMode?: boolean;
}

// Straight, sharp checkmark used across the quiz UI
export const StraightCheck = ({
  className = 'w-4 h-4',
}: {
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="square"
    strokeLinejoin="miter"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const StrikethroughIcon = ({
  className = 'w-5 h-5',
}: {
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4H9a3 3 0 0 0-3 3c0 1.5 1 2.5 3 3l6 2c2 1 3 2 3 3.5a3.5 3.5 0 0 1-3.5 3.5H7" />
    <line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);

// Line-numbered code block in one colour. Memoised because scroll mode
// renders every question at once.
export const CodeBlock = React.memo(function CodeBlock({
  code,
}: {
  code: string;
}) {
  const lines = code.split('\n');

  return (
    <div
      role="figure"
      aria-label="Code snippet"
      className="my-6 rounded-lg overflow-hidden border border-gray-800 bg-[#1e1e1e] shadow-md font-mono text-base select-text"
    >
      <div className="overflow-x-auto custom-scrollbar flex">
        <div
          aria-hidden="true"
          className="bg-[#181818] text-[#858585] select-none py-3.5 px-3.5 text-right font-mono text-base border-r border-[#2d2d2d] flex flex-col justify-start min-w-[44px]"
        >
          {lines.map((_, idx) => (
            <div key={idx} className="leading-relaxed h-6">
              {idx + 1}
            </div>
          ))}
        </div>
        <div className="py-3.5 px-4 text-white flex-1 whitespace-pre leading-relaxed font-mono">
          {lines.map((line, idx) => (
            <div key={idx} className="h-6">
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  answer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
  reviewMode = false,
}) => {
  // Struck-out options are a reading aid only, so they are not saved
  const [struckOptions, setStruckOptions] = useState<Record<string, boolean>>(
    {},
  );
  const [hoveredOptionId, setHoveredOptionId] = useState<string | null>(null);
  const [hoveredStrikethroughId, setHoveredStrikethroughId] = useState<
    string | null
  >(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headingId = `${question.id}-heading`;
  const isMulti = question.type === 'multi-select';
  const selectedList = Array.isArray(answer) ? answer : [];

  const isSelected = (optionId: string) =>
    isMulti ? selectedList.includes(optionId) : answer === optionId;

  const triggerSaveState = () => {
    setIsSaving(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setIsSaving(false), 450);
  };

  useEffect(
    () => () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    },
    [],
  );

  // Striking out a ticked option also unticks it
  const toggleStruck = (optionId: string) => {
    const willBeStruck = !struckOptions[optionId];
    if (isSelected(optionId) && willBeStruck) {
      onAnswerChange(
        isMulti ? selectedList.filter((id) => id !== optionId) : '',
      );
    }
    setStruckOptions((prev) => ({ ...prev, [optionId]: willBeStruck }));
  };

  // Ticking a struck option also removes the strike
  const handleSelectOption = (optionId: string) => {
    if (reviewMode) return;
    if (struckOptions[optionId]) {
      setStruckOptions((prev) => ({ ...prev, [optionId]: false }));
    }
    triggerSaveState();
    if (isMulti) {
      onAnswerChange(
        selectedList.includes(optionId)
          ? selectedList.filter((id) => id !== optionId)
          : [...selectedList, optionId],
      );
    } else {
      onAnswerChange(optionId);
    }
  };

  const correctIds = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [question.correctAnswer];
  const isOptionCorrect = (optionId: string) => correctIds.includes(optionId);

  const earnedPoints = gradeQuestion(question, answer).earnedPoints;
  const answered = isAnswered(answer);

  const blankParts = question.prompt.split('[BLANK]');
  const blankValues = Array.from(
    { length: blankParts.length - 1 },
    (_, idx) => (Array.isArray(answer) ? answer[idx] : undefined) ?? '',
  );

  return (
    <div
      role="group"
      aria-labelledby={headingId}
      className="bg-white py-1 mb-2 select-none"
    >
      {/* Header Line */}
      <div className="flex items-center justify-between pb-2 mb-2">
        <div className="flex items-center gap-2.5">
          <h2
            id={headingId}
            className="text-lg font-bold text-gray-900 tracking-tight"
          >
            Question {question.number}
          </h2>

          {!reviewMode &&
            (isSaving ? (
              <span className="flex items-center gap-1.5 text-gray-500 text-sm italic ml-1 select-none">
                <span>Saving...</span>
                <RefreshCw
                  aria-hidden="true"
                  className="w-3.5 h-3.5 text-gray-600 animate-spin stroke-[2.2]"
                />
              </span>
            ) : answered ? (
              <span className="flex items-center gap-1.5 text-gray-500 text-sm italic ml-1 select-none">
                <StraightCheck className="w-3.5 h-3.5 text-gray-700" />
                <span>Saved</span>
              </span>
            ) : (
              <span
                aria-hidden="true"
                className="text-gray-400 text-sm italic ml-1 font-mono"
              >
                --
              </span>
            ))}

          {reviewMode && (
            <span
              className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
                earnedPoints > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {earnedPoints} / {question.points} point
            </span>
          )}
        </div>

        {!reviewMode && (
          <button
            type="button"
            onClick={onToggleFlag}
            aria-label="Flag question"
            aria-pressed={isFlagged}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-transparent hover:bg-gray-100/60 transition-colors flex-shrink-0"
            title="Bookmark Question"
          >
            <Bookmark
              aria-hidden="true"
              className={`w-5 h-5 transition-colors ${
                isFlagged
                  ? 'fill-[#006fbf] text-[#006fbf]'
                  : 'text-gray-500 hover:text-gray-800 stroke-[2]'
              }`}
            />
          </button>
        )}
      </div>

      {/* Question Content Area - Indented slightly to the right */}
      <div className="pl-3 space-y-6">
        <div className="text-gray-900 text-lg leading-relaxed font-normal select-text whitespace-pre-wrap">
          {question.type === 'multi-blank'
            ? blankParts.map((part, idx) => (
                <React.Fragment key={idx}>
                  {part}
                  {idx < blankValues.length && (
                    <input
                      type="text"
                      aria-label={`Blank ${idx + 1}`}
                      disabled={reviewMode}
                      value={blankValues[idx]}
                      onChange={(e) => {
                        triggerSaveState();
                        const next = [...blankValues];
                        next[idx] = e.target.value;
                        onAnswerChange(next);
                      }}
                      className={`inline-block w-40 px-2.5 py-1.5 mx-1 border rounded-md text-base text-center font-bold outline-none transition-colors ${
                        reviewMode
                          ? 'bg-gray-50 border-gray-300 text-gray-800'
                          : 'bg-white border-gray-300 focus:border-[#006fbf] focus:ring-1 focus:ring-[#006fbf]'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))
            : question.prompt}
        </div>

        {reviewMode && question.type === 'multi-blank' && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <span className="font-semibold text-gray-800 mb-2 block">
              Correct Answers:
            </span>
            <ul className="list-decimal pl-5 space-y-1">
              {correctIds.map((ans, idx) => (
                <li key={idx} className="text-gray-700 text-base">
                  <span className="font-mono text-blue-700 font-bold ml-1">
                    {ans}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {question.codeSnippet && <CodeBlock code={question.codeSnippet} />}

        <div className="mt-6">
          {question.type === 'short-answer' && (
            <div className="space-y-2">
              <input
                type="text"
                aria-label="Answer"
                disabled={reviewMode}
                value={typeof answer === 'string' ? answer : ''}
                onChange={(e) => {
                  triggerSaveState();
                  onAnswerChange(e.target.value);
                }}
                placeholder="Type your answer here..."
                className={`w-full max-w-lg px-3 py-2.5 border rounded-md text-lg outline-none transition-colors ${
                  reviewMode
                    ? 'bg-gray-50 border-gray-300 text-gray-800'
                    : 'bg-white border-gray-300 focus:border-[#006fbf] focus:ring-1 focus:ring-[#006fbf]'
                }`}
              />
              {reviewMode && (
                <div className="text-lg mt-2">
                  <span className="font-semibold text-gray-700">
                    Correct Answer:{' '}
                  </span>
                  <span className="font-mono text-blue-700">
                    {correctIds.join(' or ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {question.options && question.options.length > 0 && (
            <div className="flex flex-col bg-white">
              {question.options.map((option) => {
                const inputId = `${question.id}-${option.id}`;
                const selected = isSelected(option.id);
                const correct = isOptionCorrect(option.id);
                const isWrongSelection = selected && !correct;
                const isStruck = !!struckOptions[option.id];
                const isOptionHovered = hoveredOptionId === option.id;
                const isButtonHovered = hoveredStrikethroughId === option.id;

                return (
                  <div
                    key={option.id}
                    onMouseEnter={() => setHoveredOptionId(option.id)}
                    onMouseLeave={() => setHoveredOptionId(null)}
                    className={`flex items-stretch justify-between ${
                      reviewMode ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      selected && !reviewMode
                        ? 'bg-[#dbeefe]'
                        : 'bg-white hover:bg-[#f0f7fd]'
                    } ${reviewMode && correct ? 'bg-blue-50/80' : ''} ${
                      reviewMode && isWrongSelection ? 'bg-red-50/80' : ''
                    }`}
                  >
                    {/* The label fills the whole highlighted row, so a click
                        near its edge still picks the option */}
                    <label
                      htmlFor={inputId}
                      className={`relative flex items-center gap-3 flex-1 min-h-[52px] pl-2.5 pr-2 py-2.5 transition-opacity ${
                        reviewMode ? 'cursor-default' : 'cursor-pointer'
                      } ${isStruck ? 'opacity-40' : 'opacity-100'}`}
                    >
                      {/* The native input gives keyboard and screen reader
                          support; the box next to it is what users see */}
                      <input
                        id={inputId}
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={question.id}
                        value={option.id}
                        checked={selected}
                        disabled={reviewMode}
                        onChange={() => handleSelectOption(option.id)}
                        className="peer sr-only"
                      />

                      {reviewMode && (
                        <div
                          aria-hidden="true"
                          data-review-marker
                          className="flex items-center gap-1 flex-shrink-0 w-5"
                        >
                          {correct && (
                            <span
                              className="flex items-center text-[#006fbf]"
                              title="Correct Answer"
                            >
                              <StraightCheck className="w-5 h-5 text-[#006fbf]" />
                            </span>
                          )}
                          {isWrongSelection && (
                            <span
                              className="text-red-600 font-bold"
                              title="Incorrect Selection"
                            >
                              <X className="w-5 h-5" />
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        aria-hidden="true"
                        className="flex-shrink-0 flex items-center rounded peer-focus-visible:ring-2 peer-focus-visible:ring-[#006fbf] peer-focus-visible:ring-offset-2"
                      >
                        {isMulti ? (
                          <div
                            className={`w-[22px] h-[22px] rounded-[5px] flex items-center justify-center border-[1.8px] flex-shrink-0 ${
                              selected
                                ? 'bg-white border-gray-600'
                                : isOptionHovered
                                  ? 'bg-white border-[#006fbf]'
                                  : 'bg-white border-gray-400'
                            }`}
                          >
                            {selected && (
                              <svg
                                viewBox="0 0 24 24"
                                className="w-4 h-4 text-gray-900 stroke-[3]"
                                fill="none"
                                stroke="currentColor"
                              >
                                <polyline
                                  points="20 6 9 17 4 12"
                                  strokeLinecap="square"
                                  strokeLinejoin="miter"
                                />
                              </svg>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border-[1.8px] flex-shrink-0 ${
                              selected || isOptionHovered
                                ? 'bg-white border-[#006fbf]'
                                : 'bg-white border-gray-400'
                            }`}
                          >
                            {selected && (
                              <div className="w-2.5 h-2.5 rounded-full bg-[#006fbf]" />
                            )}
                          </div>
                        )}
                      </div>

                      <span
                        className={`text-lg leading-snug font-normal text-gray-900 ${
                          isStruck ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {option.text}
                      </span>
                      {reviewMode && (correct || selected) && ' '}
                      {reviewMode && (correct || selected) && (
                        <span className="sr-only">
                          {selected
                            ? `Your answer, ${correct ? 'correct' : 'incorrect'}`
                            : 'Correct answer'}
                        </span>
                      )}
                    </label>

                    {!reviewMode && (
                      <div className="w-8 h-8 mr-2.5 self-center flex items-center justify-center flex-shrink-0 opacity-100">
                        <button
                          type="button"
                          onClick={() => toggleStruck(option.id)}
                          onMouseEnter={() =>
                            setHoveredStrikethroughId(option.id)
                          }
                          onMouseLeave={() => setHoveredStrikethroughId(null)}
                          aria-label={`Strike out ${option.text}`}
                          aria-pressed={isStruck}
                          className={`p-1.5 rounded-md transition-colors ${
                            isStruck || isOptionHovered
                              ? 'opacity-100'
                              : 'opacity-0 focus:opacity-100'
                          } ${
                            isButtonHovered || isStruck
                              ? 'bg-gray-200/80 text-gray-900'
                              : 'bg-transparent text-gray-500 hover:text-gray-800'
                          }`}
                          title={
                            isStruck ? 'Unstrike Option' : 'Strikeout Option'
                          }
                        >
                          <StrikethroughIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {reviewMode && question.explanation && (
          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-md text-base text-gray-700">
            <span className="font-bold text-gray-900">Explanation: </span>
            {question.explanation}
          </div>
        )}
      </div>
    </div>
  );
};
