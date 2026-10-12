import { describe, it, expect } from 'vitest';
import { parseQuizJson, type ImportSettings } from './quizSchema';
import { sampleQuiz } from '../data/sampleQuiz';

const settings: ImportSettings = {
  fallbackId: 'quiz-fallback',
  timeLimitMinutes: 20,
  templateMode: 'single-page',
  antiCheat: {
    enabled: true,
    tabLock: true,
    uiRestrictions: false,
    fullscreenLock: false,
  },
};

const aiQuiz = {
  title: 'Cloud Basics',
  courseCode: 'CS4421',
  description: 'S3 and CloudFront',
  questions: [
    {
      type: 'mcq',
      prompt: 'Which service stores files?',
      codeSnippet: null,
      codeLanguage: null,
      options: [
        { id: 'a', text: 'S3' },
        { id: 'b', text: 'EC2' },
      ],
      correctAnswer: 'a',
      explanation: 'S3 is object storage.',
    },
    {
      type: 'multi-blank',
      prompt: 'CI stands for [BLANK] [BLANK].',
      correctAnswer: ['Continuous', 'Integration'],
    },
  ],
};

const parse = (value: unknown, overrides: Partial<ImportSettings> = {}) =>
  parseQuizJson(typeof value === 'string' ? value : JSON.stringify(value), {
    ...settings,
    ...overrides,
  });

const errorOf = (value: unknown) => {
  const result = parse(value);
  if (result.ok) throw new Error('expected an error');
  return result.error;
};

const withQuestion = (patch: Record<string, unknown>) => ({
  ...aiQuiz,
  questions: [{ ...aiQuiz.questions[0], ...patch }],
});

describe('parseQuizJson', () => {
  it('accepts the sample quiz', () => {
    expect(parse(sampleQuiz).ok).toBe(true);
  });

  it('accepts JSON wrapped in a markdown code fence', () => {
    expect(parse('```json\n' + JSON.stringify(aiQuiz) + '\n```').ok).toBe(true);
  });

  it('fills in ids, numbers, pages and points, and drops null code fields', () => {
    const result = parse(aiQuiz);
    if (!result.ok) throw new Error(result.error);

    expect(result.quiz.id).toBe('quiz-fallback');
    expect(
      result.quiz.questions.map((q) => [q.id, q.number, q.page, q.points]),
    ).toEqual([
      ['q1', 1, 1, 1],
      ['q2', 2, 2, 1],
    ]);
    expect(result.quiz.questions[0]).not.toHaveProperty('codeSnippet');
  });

  it('applies the time limit, layout and proctoring chosen in the creator', () => {
    const result = parse(aiQuiz);
    if (!result.ok) throw new Error(result.error);

    expect(result.quiz).toMatchObject({
      timeLimitMinutes: 20,
      templateMode: 'single-page',
      antiCheat: { enabled: true },
    });
  });

  it('lets a title typed in the creator win over the AI title', () => {
    const result = parse(aiQuiz, { title: 'My Midterm' });
    expect(result.ok && result.quiz.title).toBe('My Midterm');
  });

  it('explains invalid JSON', () => {
    expect(errorOf('{ "title": ')).toMatch(/^The text is not valid JSON/);
  });

  it('needs a title and at least one question', () => {
    expect(errorOf({ ...aiQuiz, title: '' })).toBe('title: Add a quiz title.');
    expect(errorOf({ ...aiQuiz, questions: [] })).toBe(
      'questions: Add at least one question.',
    );
  });

  it('rejects an unknown question type', () => {
    expect(errorOf(withQuestion({ type: 'essay' }))).toMatch(
      /^Question 1: type/,
    );
  });

  it('needs options for choice questions', () => {
    expect(errorOf(withQuestion({ options: [] }))).toBe(
      'Question 1: mcq questions need at least two options.',
    );
  });

  it('needs the correct answer to be one of the options', () => {
    expect(errorOf(withQuestion({ correctAnswer: 'z' }))).toBe(
      'Question 1: correctAnswer "z" is not one of the option ids (a, b).',
    );
  });

  it('needs an array of answers for multiple select', () => {
    expect(
      errorOf(withQuestion({ type: 'multi-select', correctAnswer: 'a' })),
    ).toBe(
      'Question 1: multi-select needs correctAnswer as a list of option ids.',
    );
  });

  it('needs one answer per blank', () => {
    expect(
      errorOf({
        ...aiQuiz,
        questions: [
          {
            type: 'multi-blank',
            prompt: 'A [BLANK] and [BLANK].',
            correctAnswer: ['x'],
          },
        ],
      }),
    ).toBe(
      'Question 1: the prompt has 2 [BLANK] markers but correctAnswer has 1 answer.',
    );
  });

  it('rejects two questions with the same id', () => {
    expect(
      errorOf({
        ...aiQuiz,
        questions: [
          { ...aiQuiz.questions[0], id: 'same' },
          { ...aiQuiz.questions[1], id: 'same' },
        ],
      }),
    ).toBe('Question 2: id "same" is already used by another question.');
  });
});
