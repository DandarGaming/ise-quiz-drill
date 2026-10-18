import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  MAX_FEEDBACK_LENGTH,
  type FeedbackCategory,
} from '../../utils/feedback';

export interface FeedbackContext {
  quizTitle?: string;
  questionNumber?: number;
}

interface FeedbackDialogProps {
  context?: FeedbackContext;
  onClose: () => void;
}

const categories: { value: FeedbackCategory; label: string }[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'idea', label: 'Idea' },
  { value: 'wrong_question', label: 'Wrong question' },
];

export const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  context,
  onClose,
}) => {
  const [category, setCategory] = useState<FeedbackCategory>(
    context?.questionNumber ? 'wrong_question' : 'bug',
  );
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<
    'idle' | 'sending' | 'sent' | 'error' | 'limited'
  >('idle');

  const trimmedMessage = message.trim();
  const validationMessage =
    trimmedMessage.length === 0
      ? 'Write a message before sending.'
      : message.length > MAX_FEEDBACK_LENGTH
        ? `Keep your message to ${MAX_FEEDBACK_LENGTH} characters or fewer.`
        : '';

  const send = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validationMessage || status === 'sending') return;

    setStatus('sending');
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          category,
          message,
          ...(context?.quizTitle ? { quizTitle: context.quizTitle } : {}),
          ...(context?.questionNumber
            ? { questionNumber: context.questionNumber }
            : {}),
        }),
      });
      if (response.status === 429) {
        setStatus('limited');
      } else if (!response.ok) {
        setStatus('error');
      } else {
        setStatus('sent');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 text-gray-900 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="feedback-title" className="text-xl font-bold">
              Send feedback
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Tell us what would make Quiz Drill better.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        {status === 'sent' ? (
          <div
            role="status"
            className="rounded-lg bg-green-50 p-4 text-sm text-green-900"
          >
            Thank you — your feedback was sent to the project owner.
          </div>
        ) : (
          <form onSubmit={send} className="space-y-4">
            <label
              className="block text-sm font-semibold"
              htmlFor="feedback-category"
            >
              Feedback type
              <select
                id="feedback-category"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as FeedbackCategory)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-normal"
              >
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            {context?.quizTitle && context.questionNumber && (
              <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-900">
                About question {context.questionNumber} in “{context.quizTitle}”
                . This context will be attached to your report.
              </p>
            )}

            <label
              className="block text-sm font-semibold"
              htmlFor="feedback-message"
            >
              Message
              <textarea
                id="feedback-message"
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                aria-describedby="feedback-privacy feedback-count feedback-validation"
                className="mt-1 block w-full resize-y rounded-md border border-gray-300 bg-white px-3 py-2 font-normal"
              />
            </label>
            <div className="flex justify-between gap-4 text-xs text-gray-600">
              <span id="feedback-count">
                {message.length}/{MAX_FEEDBACK_LENGTH} characters
              </span>
              <span
                id="feedback-validation"
                role="status"
                className="text-red-700"
              >
                {validationMessage}
              </span>
            </div>
            <p id="feedback-privacy" className="text-xs text-gray-600">
              Your message is sent to the project owner and kept in private
              server logs for up to 30 days. It is not saved in your browser.
              Your network address is used briefly to limit abuse, not saved.
              Avoid including sensitive personal information.
            </p>

            {status === 'error' && (
              <p role="alert" className="text-sm text-red-700">
                We couldn’t send your message. Please try again.
              </p>
            )}
            {status === 'limited' && (
              <p role="alert" className="text-sm text-red-700">
                The feedback limit has been reached. Please try again later.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!!validationMessage || status === 'sending'}
                className="rounded-md bg-[#006fbf] px-4 py-2 text-sm font-bold text-white hover:bg-[#005694] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};
