import { useEffect, useRef, type KeyboardEvent } from 'react';
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

export function SubmitModal({
  isOpen,
  questions,
  answers,
  onConfirm,
  onCancel,
}: SubmitModalProps) {
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

  const unanswered = questions.filter((q) => !isAnswered(answers[q.id]));

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-modal-title"
        aria-describedby="submit-modal-notice"
        onKeyDown={handleKeyDown}
        className="w-full max-w-lg space-y-6 rounded-xl border border-gray-300 bg-white p-7 shadow-2xl"
      >
        <div className="flex items-center gap-3.5 border-b border-gray-100 pb-4">
          <AlertCircle
            aria-hidden="true"
            className="h-8 w-8 flex-shrink-0 stroke-[2.2] text-gray-900"
          />
          <div>
            <h2
              id="submit-modal-title"
              className="text-xl font-bold text-gray-900"
            >
              Submit quiz confirmation
            </h2>
            <p className="text-sm font-medium text-gray-600">
              Are you sure you want to finish?
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-base font-semibold text-gray-900">
          {unanswered.length > 0 ? (
            <p>
              Unanswered: {unanswered.map((q) => `Q${q.number}`).join(', ')}
            </p>
          ) : (
            <p className="flex items-center gap-2.5">
              <CheckCircle2
                aria-hidden="true"
                className="h-6 w-6 flex-shrink-0"
              />
              All questions have been answered.
            </p>
          )}
        </div>

        <p
          id="submit-modal-notice"
          className="text-base leading-relaxed text-gray-800"
        >
          Submitting will end your attempt. You will not be able to change your
          answers afterwards.
        </p>

        <div className="flex items-center justify-end gap-4 pt-2">
          <button
            ref={backRef}
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-gray-100 px-5 py-2.5 text-base font-bold text-gray-800 hover:bg-gray-200"
          >
            Back to Quiz
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-[#006fbf] px-6 py-2.5 text-base font-bold text-white hover:bg-[#005694]"
          >
            Submit Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
