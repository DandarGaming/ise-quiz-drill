import { useRef, useState, type KeyboardEvent } from 'react';
import { Download, Play, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import type { QuizAttemptRecord, QuizConfig } from '../../types/quiz';
import {
  clearHistory,
  deleteHistoryRecord,
  deleteSavedQuiz,
  loadHistory,
  loadSavedQuizzes,
} from '../../utils/attemptStorage';
import {
  browserStorage,
  safely,
  type KeyValueStore,
} from '../../utils/browserStorage';
import { formatDuration } from '../quiz/HeaderBar';

export interface QuizHistoryProps {
  onStart: (quiz: QuizConfig) => void;
  onCreate: () => void;
  onReview: (record: QuizAttemptRecord) => void;
  storage?: KeyValueStore;
}

type Tab = 'saved' | 'attempts';

const fileName = (title: string) =>
  `${
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'quiz'
  }.json`;

function exportQuiz(quiz: QuizConfig) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName(quiz.title);
  link.click();
  URL.revokeObjectURL(url);
}

const button =
  'flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100';
const primary =
  'flex items-center gap-1.5 rounded-lg bg-[#006fbf] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#005694]';

export function QuizHistory({
  onStart,
  onCreate,
  onReview,
  storage = browserStorage(),
}: QuizHistoryProps) {
  const [tab, setTab] = useState<Tab>('saved');
  const [quizzes, setQuizzes] = useState(
    () => (storage && safely(() => loadSavedQuizzes(storage))) ?? [],
  );
  const [attempts, setAttempts] = useState(
    () => (storage && safely(() => loadHistory(storage))) ?? [],
  );
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    saved: null,
    attempts: null,
  });

  const removeQuiz = (quiz: QuizConfig) => {
    if (!window.confirm(`Delete "${quiz.title}"?`)) return;
    if (storage) safely(() => deleteSavedQuiz(storage, quiz.id));
    setQuizzes((list) => list.filter((q) => q.id !== quiz.id));
  };

  const removeAttempt = (record: QuizAttemptRecord) => {
    if (!window.confirm('Delete this attempt?')) return;
    if (storage) safely(() => deleteHistoryRecord(storage, record.id));
    setAttempts((list) => list.filter((r) => r.id !== record.id));
  };

  const clearAll = () => {
    if (
      !window.confirm('Clear the whole attempt history? This cannot be undone.')
    )
      return;
    if (storage) safely(() => clearHistory(storage));
    setAttempts([]);
  };

  const tabs: [Tab, string][] = [
    ['saved', `Saved tests (${quizzes.length})`],
    ['attempts', `Attempt history (${attempts.length})`],
  ];

  // Left and Right move between tabs, as in the ARIA tabs pattern
  const onTabKey = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const next: Tab = tab === 'saved' ? 'attempts' : 'saved';
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Saved tests and history
        </h1>
        <button type="button" onClick={onCreate} className={primary}>
          <PlusCircle aria-hidden="true" className="h-4 w-4" /> Create new test
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Library"
        className="flex gap-2"
        onKeyDown={onTabKey}
      >
        {tabs.map(([id, label]) => (
          <button
            key={id}
            ref={(el) => {
              tabRefs.current[id] = el;
            }}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              tab === id
                ? 'bg-[#006fbf] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="rounded-xl border border-gray-200 bg-white p-6"
      >
        {tab === 'saved' &&
          (quizzes.length === 0 ? (
            <div className="space-y-3 py-10 text-center">
              <p className="text-lg font-bold text-gray-900">
                No saved tests yet.
              </p>
              <button
                type="button"
                onClick={onCreate}
                className={`${primary} mx-auto`}
              >
                Create your first test
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {quizzes.map((quiz) => (
                <article
                  key={quiz.id}
                  aria-labelledby={`saved-${quiz.id}`}
                  className="space-y-3 rounded-lg border border-gray-200 p-4"
                >
                  <div>
                    <h2
                      id={`saved-${quiz.id}`}
                      className="text-lg font-bold text-gray-900"
                    >
                      {quiz.title}
                    </h2>
                    <p className="font-mono text-xs text-gray-500">
                      {quiz.courseCode}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    {quiz.questions.length} questions · {quiz.timeLimitMinutes}{' '}
                    minutes
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onStart(quiz)}
                      className={primary}
                    >
                      <Play aria-hidden="true" className="h-4 w-4" /> Start
                    </button>
                    <button
                      type="button"
                      onClick={() => exportQuiz(quiz)}
                      className={button}
                    >
                      <Download aria-hidden="true" className="h-4 w-4" /> Export
                      JSON
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${quiz.title}`}
                      onClick={() => removeQuiz(quiz)}
                      className={button}
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ))}

        {tab === 'attempts' &&
          (attempts.length === 0 ? (
            <p className="py-10 text-center text-lg font-bold text-gray-900">
              No attempts yet.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button type="button" onClick={clearAll} className={button}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" /> Clear
                  history
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-500">
                  <tr>
                    <th className="py-2">Date</th>
                    <th className="py-2">Quiz</th>
                    <th className="py-2">Score</th>
                    <th className="py-2">Time</th>
                    <th className="py-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {attempts.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3">
                        <time dateTime={record.timestamp}>
                          {new Date(record.timestamp).toLocaleString()}
                        </time>
                      </td>
                      <td className="py-3 font-semibold text-gray-900">
                        {record.quizTitle}
                      </td>
                      <td className="py-3">
                        {record.earnedScore} / {record.totalPoints} (
                        {record.percentage}%)
                      </td>
                      <td className="py-3 font-mono">
                        {formatDuration(record.timeTakenSeconds)}
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onReview(record)}
                            className={button}
                          >
                            Review
                          </button>
                          <button
                            type="button"
                            onClick={() => onStart(record.quizSnapshot)}
                            className={button}
                          >
                            <RotateCcw aria-hidden="true" className="h-4 w-4" />{' '}
                            Retake
                          </button>
                          <button
                            type="button"
                            aria-label="Delete attempt"
                            onClick={() => removeAttempt(record)}
                            className={button}
                          >
                            <Trash2 aria-hidden="true" className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </div>
  );
}
