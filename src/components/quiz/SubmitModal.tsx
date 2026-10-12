import React, { useEffect, useRef, type KeyboardEvent } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { isAnswered, type Answer } from '../../utils/answers';

export interface SubmitModalProps {
  isOpen: boolean;
  questions: Question[];
  answers: Record<string, Answer | undefined>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({
  isOpen,
  questions,
  answers,
  onConfirm,
  onCancel,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  // Focus the safe choice on open and give focus back to the opener on close
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    backRef.current?.focus();
    return () => opener?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const unansweredQuestions = questions.filter(
    (q) => !isAnswered(answers[q.id]),
  );
  const hasUnanswered = unansweredQuestions.length > 0;

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;
    // Keep Tab and Shift+Tab cycling inside the dialog
    const focusable = [
      ...(dialogRef.current?.querySelectorAll<HTMLElement>('button') ?? []),
    ];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-modal-title"
        aria-describedby="submit-modal-notice"
        onKeyDown={handleKeyDown}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-7 space-y-6 border border-gray-300"
      >
        <div className="flex items-center gap-3.5 border-b border-gray-100 pb-4">
          <div className="text-gray-900 flex-shrink-0">
            <AlertCircle aria-hidden="true" className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div>
            <h3
              id="submit-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              Submit Quiz Confirmation
            </h3>
            <p className="text-sm font-medium text-gray-600">
              Are you sure you want to finish?
            </p>
          </div>
        </div>

        {hasUnanswered ? (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 space-y-2.5">
            <div className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span>
                ⚠ Warning: Unanswered Questions ({unansweredQuestions.length})
              </span>
            </div>
            <p className="text-sm text-gray-800 font-medium">
              The following questions have not been answered:
            </p>
            <ul className="flex flex-wrap gap-2 pt-1">
              {unansweredQuestions.map((q) => (
                <li
                  key={q.id}
                  className="px-3 py-1 bg-gray-200 text-gray-900 rounded-md font-bold text-sm border border-gray-300"
                >
                  Q{q.number}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-4 text-base text-gray-900 font-semibold flex items-center gap-2.5">
            <CheckCircle2
              aria-hidden="true"
              className="w-6 h-6 text-gray-900 stroke-[2.2] flex-shrink-0"
            />
            <span>All questions have been answered.</span>
          </div>
        )}

        <p
          id="submit-modal-notice"
          className="text-base text-gray-800 leading-relaxed font-normal"
        >
          Submitting will end your attempt and record your answers. You will not
          be able to change your responses after submitting.
        </p>

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            ref={backRef}
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-base font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors cursor-pointer"
          >
            Back to Quiz
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-6 py-2.5 text-base font-bold text-white bg-[#006fbf] hover:bg-[#005694] rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
};
