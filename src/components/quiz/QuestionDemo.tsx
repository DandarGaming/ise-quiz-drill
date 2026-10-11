import { useState } from 'react';
import { HeaderBar } from './HeaderBar';
import { QuestionNavigator } from './QuestionNavigator';
import { QuestionRenderer } from './QuestionRenderer';
import { SubmitModal } from './SubmitModal';
import type { Question } from '../../types/quiz';

// Temporary preview of every question type. Removed when the full quiz
// app moves to the root page.
const questions: Question[] = [
  {
    id: 'demo-mcq',
    number: 1,
    page: 1,
    type: 'mcq',
    points: 1,
    prompt: 'What does this function return for an input of 7?',
    codeSnippet:
      'export function pages(items) {\n  // 3 items fit on one page\n  return Math.ceil(items / 3);\n}',
    options: [
      { id: 'a', text: '2' },
      { id: 'b', text: '3' },
      { id: 'c', text: '7' },
    ],
    correctAnswer: 'b',
  },
  {
    id: 'demo-multi',
    number: 2,
    page: 2,
    type: 'multi-select',
    points: 2,
    prompt: 'Which of these are AWS services? Select all that apply.',
    options: [
      { id: 'a', text: 'Amazon S3' },
      { id: 'b', text: 'Vercel' },
      { id: 'c', text: 'Amazon CloudFront' },
      { id: 'd', text: 'Netlify' },
    ],
    correctAnswer: ['a', 'c'],
  },
  {
    id: 'demo-tf',
    number: 3,
    page: 3,
    type: 'true-false',
    points: 1,
    prompt: 'Git is a distributed version control system.',
    options: [
      { id: 'true', text: 'True' },
      { id: 'false', text: 'False' },
    ],
    correctAnswer: 'true',
  },
  {
    id: 'demo-short',
    number: 4,
    page: 4,
    type: 'short-answer',
    points: 1,
    prompt: 'Which AWS service stores the built site files?',
    correctAnswer: 'S3',
  },
  {
    id: 'demo-blanks',
    number: 5,
    page: 5,
    type: 'multi-blank',
    points: 2,
    prompt: 'CI/CD stands for Continuous [BLANK] and Continuous [BLANK].',
    correctAnswer: ['Integration', 'Delivery'],
  },
];

export function QuestionDemo() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitOpen, setSubmitOpen] = useState(false);
  const [isSubmitted, setSubmitted] = useState(false);

  // The timer is static here; the running countdown comes with the simulator
  return (
    <div className="flex min-h-screen flex-col">
      <HeaderBar
        title="Question types preview"
        remainingSeconds={872}
        totalSeconds={900}
        onExit={() => window.location.assign('/')}
      />
      <div className="flex flex-1">
        <main className="mx-auto max-w-3xl flex-1 space-y-8 px-4 py-8">
          {questions.map((question) => (
            <QuestionRenderer
              key={question.id}
              question={question}
              answer={answers[question.id]}
              isFlagged={!!flagged[question.id]}
              onAnswerChange={(answer) =>
                setAnswers((prev) => ({ ...prev, [question.id]: answer }))
              }
              onToggleFlag={() =>
                setFlagged((prev) => ({
                  ...prev,
                  [question.id]: !prev[question.id],
                }))
              }
            />
          ))}
          {isSubmitted ? (
            <p role="status" className="text-lg font-semibold">
              Submitted. Scoring comes with the results view.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitOpen(true)}
              className="rounded-lg bg-[#006fbf] px-6 py-2.5 font-bold text-white hover:bg-[#005694]"
            >
              Submit Quiz
            </button>
          )}
        </main>
        <QuestionNavigator
          questions={questions}
          currentPage={currentPage}
          answers={answers}
          flagged={flagged}
          onSelect={(question) => {
            setCurrentPage(question.page);
            document
              .getElementById(`${question.id}-heading`)
              ?.scrollIntoView?.({ behavior: 'smooth' });
          }}
        />
      </div>
      <SubmitModal
        isOpen={isSubmitOpen}
        questions={questions}
        answers={answers}
        onConfirm={() => {
          setSubmitOpen(false);
          setSubmitted(true);
        }}
        onCancel={() => setSubmitOpen(false)}
      />
    </div>
  );
}
