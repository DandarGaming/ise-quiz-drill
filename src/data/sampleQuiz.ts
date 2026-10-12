import type { Question, QuizConfig } from '../types/quiz';

// Sample quiz with one question of every type. Used for the preview page and
// as the example JSON in the importer.
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

export const sampleQuiz: QuizConfig = {
  id: 'sample-devops',
  title: 'DevOps Basics Practice',
  courseCode: 'SAMPLE',
  description: 'One question of every type',
  templateMode: 'paginated',
  timeLimitMinutes: 15,
  questionsPerPage: 1,
  questions,
};
