import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import type {
  AttemptState,
  QuizAttemptRecord,
  QuizConfig,
  QuizEventType,
} from '../../types/quiz';
import { useAntiCheat } from '../../hooks/useAntiCheat';
import { useQuizTimer } from '../../hooks/useQuizTimer';
import { isAnswered, type Answer } from '../../utils/answers';
import {
  appendHistory,
  clearAttempt,
  loadAttempt,
  saveAttempt,
} from '../../utils/attemptStorage';
import { gradeQuiz } from '../../utils/grading';
import { paginate } from '../../utils/pagination';
import { HeaderBar } from './HeaderBar';
import { QuestionNavigator } from './QuestionNavigator';
import { QuestionRenderer } from './QuestionRenderer';
import { ResultsReview } from './ResultsReview';
import { SubmitModal } from './SubmitModal';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface QuizSimulatorProps {
  quiz: QuizConfig;
  onExit?: () => void;
  storage?: KeyValueStore;
}

// Warn when this many seconds are left, largest first
const WARNINGS: [number, string][] = [
  [300, 'Your work will be submitted in 5 minutes.'],
  [60, 'Your work will be submitted in 1 minute.'],
];

function newAttempt(quiz: QuizConfig): AttemptState {
  const now = Date.now();
  return {
    quizId: quiz.id,
    startedAt: new Date(now).toISOString(),
    deadline: now + quiz.timeLimitMinutes * 60_000,
    currentPage: 1,
    answers: {},
    flagged: {},
    eventLog: [],
  };
}

// Storage can be missing (server render) or throw (private mode, full
// quota); the quiz must keep working without it.
function safely<T>(action: () => T): T | undefined {
  try {
    return action();
  } catch {
    return undefined;
  }
}

const browserStorage = (): KeyValueStore | undefined =>
  typeof window === 'undefined' ? undefined : safely(() => window.localStorage);

function PageControls({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-4">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="rounded bg-[#e3e8ee] px-7 py-3 font-bold text-gray-900 hover:bg-gray-300 disabled:cursor-not-allowed disabled:text-[#556370] disabled:hover:bg-[#e3e8ee]"
        >
          Previous page
        </button>
        <button
          type="button"
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="rounded bg-[#006fbf] px-8 py-3 font-bold text-white hover:bg-[#005694] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          Next page
        </button>
      </div>
      <span className="text-xl text-gray-900">
        Page {page} of {totalPages}
      </span>
    </div>
  );
}

export function QuizSimulator({
  quiz,
  onExit = () => window.location.assign('/'),
  storage = browserStorage(),
}: QuizSimulatorProps) {
  const { questions, totalPages } = useMemo(() => paginate(quiz), [quiz]);
  const [state, setState] = useState<AttemptState>(
    () =>
      (storage && safely(() => loadAttempt(storage, quiz.id))) ??
      newAttempt(quiz),
  );
  const [record, setRecord] = useState<QuizAttemptRecord | null>(null);
  const [isSubmitOpen, setSubmitOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isWarning, setWarning] = useState(false);
  const submitted = record !== null;
  const submittedRef = useRef(false);
  const warned = useRef(new Set<number>());

  // Auto-save on every change while the attempt is open
  useEffect(() => {
    if (!submitted && storage) safely(() => saveAttempt(storage, state));
  }, [state, submitted, storage]);

  // Submitting is an event, not a state update, so it runs once even under
  // StrictMode; the ref also stops a timer expiry and a click racing.
  const submit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const now = Date.now();
    const graded = gradeQuiz(quiz, state.answers);
    const next: QuizAttemptRecord = {
      id: `attempt-${now}`,
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseCode: quiz.courseCode,
      timestamp: new Date(now).toISOString(),
      earnedScore: graded.earnedScore,
      totalPoints: graded.totalPoints,
      percentage: graded.percentage,
      timeTakenSeconds: Math.min(
        quiz.timeLimitMinutes * 60,
        Math.round((now - Date.parse(state.startedAt)) / 1000),
      ),
      eventLog: state.eventLog,
      answers: state.answers,
      quizSnapshot: quiz,
    };
    if (storage) {
      safely(() => appendHistory(storage, next));
      safely(() => clearAttempt(storage, quiz.id));
    }
    setSubmitOpen(false);
    setRecord(next);
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const remaining = useQuizTimer({
    deadline: state.deadline,
    onExpire: submit,
    running: !submitted,
  });

  useEffect(() => {
    if (submitted) return;
    const crossed = WARNINGS.filter(([seconds]) => remaining <= seconds);
    const latest = crossed[crossed.length - 1];
    if (!latest || warned.current.has(latest[0]) || remaining === 0) return;
    crossed.forEach(([seconds]) => warned.current.add(seconds));
    setToast(latest[1]);
    setWarning(true);
  }, [remaining, submitted]);

  useEffect(() => {
    if (!isWarning) return;
    const id = setTimeout(() => setWarning(false), 5000);
    return () => clearTimeout(id);
  }, [isWarning]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 10_000);
    return () => clearTimeout(id);
  }, [toast]);

  const logEvent = (type: QuizEventType, details: string) =>
    setState((prev) => ({
      ...prev,
      eventLog: [
        ...prev.eventLog,
        { type, details, timestamp: new Date().toISOString() },
      ],
    }));

  const antiCheat = useAntiCheat(quiz.antiCheat, {
    active: !submitted,
    onEvent: logEvent,
    onNotice: setToast,
  });

  const retake = () => {
    if (storage) safely(() => clearAttempt(storage, quiz.id));
    submittedRef.current = false;
    warned.current.clear();
    setToast(null);
    setWarning(false);
    setState(newAttempt(quiz));
    setRecord(null);
  };

  if (record) {
    return (
      <ResultsReview
        quiz={quiz}
        answers={record.answers}
        timeTakenSeconds={record.timeTakenSeconds}
        eventLog={record.eventLog}
        onRetake={retake}
        onExit={onExit}
      />
    );
  }

  const paginated = quiz.templateMode === 'paginated';
  const shown = paginated
    ? questions.filter((q) => q.page === state.currentPage)
    : questions;
  const answeredCount = questions.filter((q) =>
    isAnswered(state.answers[q.id]),
  ).length;
  const allAnswered = answeredCount === questions.length;
  const goToPage = (page: number) =>
    setState((prev) => ({ ...prev, currentPage: page }));
  const setAnswer = (id: string, answer: Answer) =>
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [id]: answer },
    }));
  const toggleFlag = (id: string) =>
    setState((prev) => ({
      ...prev,
      flagged: { ...prev.flagged, [id]: !prev.flagged[id] },
    }));

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div aria-hidden="true" className="h-1 w-full bg-[#008000]" />
      <HeaderBar
        title={quiz.title}
        remainingSeconds={remaining}
        totalSeconds={quiz.timeLimitMinutes * 60}
        isProctored={!!quiz.antiCheat?.enabled}
        isWarning={isWarning}
        onExit={onExit}
      />
      <div className="mx-auto flex w-full max-w-[1200px] flex-1">
        <main className="flex-1 space-y-6 px-6 pt-6">
          {paginated && (
            <PageControls
              page={state.currentPage}
              totalPages={totalPages}
              onChange={goToPage}
            />
          )}
          {shown.map((question) => (
            <div key={question.id} id={`question-${question.id}`}>
              <QuestionRenderer
                question={question}
                answer={state.answers[question.id]}
                isFlagged={!!state.flagged[question.id]}
                onAnswerChange={(answer) => setAnswer(question.id, answer)}
                onToggleFlag={() => toggleFlag(question.id)}
              />
            </div>
          ))}
          {paginated && (
            <PageControls
              page={state.currentPage}
              totalPages={totalPages}
              onChange={goToPage}
            />
          )}
          <div className="flex items-center gap-8 border-t border-gray-300 pb-10 pt-5">
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className={`rounded px-7 py-3 font-bold ${
                allAnswered
                  ? 'bg-[#006fbf] text-white hover:bg-[#005694]'
                  : 'bg-[#e3e8ee] text-gray-900 hover:bg-[#d5dde6]'
              }`}
            >
              Submit Quiz
            </button>
            <span className="text-lg italic text-gray-800">
              {answeredCount} of {questions.length} questions saved
            </span>
          </div>
        </main>
        <QuestionNavigator
          questions={questions}
          currentPage={state.currentPage}
          answers={state.answers}
          flagged={state.flagged}
          onSelect={(question) => {
            if (paginated) return goToPage(question.page);
            document
              .getElementById(`question-${question.id}`)
              ?.scrollIntoView?.({ behavior: 'smooth' });
          }}
        />
      </div>

      <SubmitModal
        isOpen={isSubmitOpen}
        questions={questions}
        answers={state.answers}
        onConfirm={submit}
        onCancel={() => setSubmitOpen(false)}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-10 left-1/2 z-40 flex min-w-[min(550px,90vw)] -translate-x-1/2 items-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-2xl"
        >
          <div aria-hidden="true" className="w-2.5 self-stretch bg-[#d96c00]" />
          <p className="flex-1 px-7 py-5 text-xl text-gray-900">{toast}</p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setToast(null)}
            className="p-5 text-gray-400 hover:text-gray-800"
          >
            <X aria-hidden="true" className="h-7 w-7" />
          </button>
        </div>
      )}

      {antiCheat.alert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="anticheat-title"
            aria-describedby="anticheat-message"
            className="w-full max-w-lg rounded-xl border-t-[6px] border-amber-500 bg-white p-8 shadow-2xl"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mb-4 h-12 w-12 text-amber-500"
            />
            <h2
              id="anticheat-title"
              className="mb-3 text-2xl font-bold text-gray-900"
            >
              {antiCheat.alert.title}
            </h2>
            <p id="anticheat-message" className="mb-8 text-gray-700">
              {antiCheat.alert.message}
            </p>
            <button
              type="button"
              autoFocus
              onClick={antiCheat.dismissAlert}
              className="w-full rounded-lg bg-gray-100 px-6 py-3 font-bold text-gray-900 hover:bg-gray-200"
            >
              Resume quiz
            </button>
          </div>
        </div>
      )}

      {antiCheat.needsFullscreen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 p-6 text-center">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="fullscreen-title"
            className="w-full max-w-xl rounded-xl border-2 border-red-500 bg-white p-10 shadow-2xl"
          >
            <AlertTriangle
              aria-hidden="true"
              className="mx-auto mb-6 h-16 w-16 text-red-500"
            />
            <h2
              id="fullscreen-title"
              className="mb-4 text-3xl font-extrabold text-gray-900"
            >
              Fullscreen required
            </h2>
            <p className="mb-10 text-lg text-gray-700">
              This quiz runs in fullscreen. Leaving fullscreen is recorded in
              the proctoring log.
            </p>
            <button
              type="button"
              autoFocus
              onClick={antiCheat.requestFullscreen}
              className="rounded-xl bg-red-600 px-10 py-4 text-lg font-bold text-white hover:bg-red-700"
            >
              Return to fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
