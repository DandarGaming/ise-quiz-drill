import { useState } from 'react';
import { QuestionRenderer } from './QuestionRenderer';
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
    page: 1,
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
    page: 1,
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
    page: 1,
    type: 'short-answer',
    points: 1,
    prompt: 'Which AWS service stores the built site files?',
    correctAnswer: 'S3',
  },
  {
    id: 'demo-blanks',
    number: 5,
    page: 1,
    type: 'multi-blank',
    points: 2,
    prompt: 'CI/CD stands for Continuous [BLANK] and Continuous [BLANK].',
    correctAnswer: ['Integration', 'Delivery'],
  },
];

export function QuestionDemo() {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8">
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
    </main>
  );
}
