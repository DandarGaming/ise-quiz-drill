import { useState } from 'react';
import { Award, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import type { QuizConfig, QuizEvent } from '../../types/quiz';
import type { Answer } from '../../utils/answers';
import { gradeQuiz } from '../../utils/grading';
import { formatDuration } from './HeaderBar';
import { QuestionReview } from './QuestionReview';

export interface ResultsReviewProps {
  quiz: QuizConfig;
  answers: Record<string, Answer | undefined>;
  timeTakenSeconds: number;
  eventLog?: QuizEvent[];
  onRetake: () => void;
  onExit?: () => void;
}

type Filter = 'incorrect' | 'correct' | 'all';

const card = 'space-y-4 rounded-xl border border-gray-200 bg-white p-6';
const sectionTitle = 'text-xl font-bold text-gray-900';

export function ResultsReview({
  quiz,
  answers,
  timeTakenSeconds,
  eventLog = [],
  onRetake,
  onExit,
}: ResultsReviewProps) {
  const [filter, setFilter] = useState<Filter>('incorrect');
  const { results, earnedScore, totalPoints, percentage } = gradeQuiz(
    quiz,
    answers,
  );

  const counts: Record<Filter, number> = {
    incorrect: results.filter((r) => !r.isCorrect).length,
    correct: results.filter((r) => r.isCorrect).length,
    all: results.length,
  };
  const shown = quiz.questions
    .map((question, index) => ({ question, result: results[index] }))
    .filter(({ result }) =>
      filter === 'all' ? true : result.isCorrect === (filter === 'correct'),
    );

  const filters: { value: Filter; label: string }[] = [
    { value: 'incorrect', label: 'Incorrect' },
    { value: 'correct', label: 'Correct' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <p className="font-mono text-sm text-gray-500">
            {quiz.courseCode} · Results
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onRetake}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-200"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Retake quiz
          </button>
          {onExit && (
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg bg-[#006fbf] px-4 py-2 text-sm font-bold text-white hover:bg-[#005694]"
            >
              Back to creator
            </button>
          )}
        </div>
      </div>

      <section aria-labelledby="results-summary" className={card}>
        <h2 id="results-summary" className={sectionTitle}>
          Summary
        </h2>
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <Award aria-hidden="true" className="h-8 w-8 text-[#006fbf]" />
            <div>
              <dt className="text-xs font-medium text-gray-500">Score</dt>
              <dd className="text-xl font-bold text-gray-900">
                {earnedScore} / {totalPoints} ({percentage}%)
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <Clock aria-hidden="true" className="h-8 w-8 text-gray-700" />
            <div>
              <dt className="text-xs font-medium text-gray-500">Time taken</dt>
              <dd className="text-xl font-bold text-gray-900">
                {formatDuration(timeTakenSeconds)}
              </dd>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-green-100 bg-green-50 p-4">
            <CheckCircle2
              aria-hidden="true"
              className="h-8 w-8 text-green-700"
            />
            <div>
              <dt className="text-xs font-medium text-gray-500">Status</dt>
              <dd className="text-xl font-bold text-green-800">Submitted</dd>
            </div>
          </div>
        </dl>
      </section>

      {quiz.antiCheat?.enabled && (
        <section aria-labelledby="results-proctoring" className={card}>
          <h2 id="results-proctoring" className={sectionTitle}>
            Proctoring log
          </h2>
          {eventLog.length === 0 ? (
            <p className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
              No violations detected during this attempt.
            </p>
          ) : (
            <ol className="space-y-3">
              {eventLog.map((event, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="rounded bg-amber-200 px-2.5 py-1 font-mono text-xs font-bold uppercase text-amber-900">
                      {event.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-amber-900">
                      {event.details}
                    </span>
                  </span>
                  <time
                    dateTime={event.timestamp}
                    className="font-mono text-xs text-gray-500"
                  >
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <section aria-labelledby="results-questions" className={card}>
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center">
          <h2 id="results-questions" className={sectionTitle}>
            Questions
          </h2>
          <div
            role="group"
            aria-label="Show questions"
            className="flex gap-1.5 rounded-lg border border-gray-200 bg-gray-100 p-1"
          >
            {filters.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded-md px-3 py-1.5 text-sm font-bold ${
                  filter === value
                    ? 'bg-[#006fbf] text-white'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({counts[value]})
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="py-12 text-center text-lg font-bold text-gray-900">
            {filter === 'incorrect'
              ? 'No incorrect questions.'
              : 'No questions match this filter.'}
          </p>
        ) : (
          <div className="space-y-8 divide-y divide-gray-100">
            {shown.map(({ question, result }) => (
              <div key={question.id} className="pt-6 first:pt-0">
                <QuestionReview question={question} result={result} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
