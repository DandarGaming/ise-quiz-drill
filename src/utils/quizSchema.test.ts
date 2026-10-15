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

const errorsOf = (value: unknown) => {
  const result = parse(value);
  if (result.ok) throw new Error('expected an error');
  return result.errors;
};
const errorOf = (value: unknown) => errorsOf(value)[0];

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
    if (!result.ok) throw new Error(result.errors.join('; '));

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
    if (!result.ok) throw new Error(result.errors.join('; '));

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

  it('reports every problem in one pass so the AI can fix them together', () => {
    const errors = errorsOf({
      ...aiQuiz,
      title: '',
      questions: [
        { ...aiQuiz.questions[0], correctAnswer: 'z' },
        { ...aiQuiz.questions[0], id: 'q2', type: 'essay' },
        { ...aiQuiz.questions[0], id: 'q3', options: [] },
      ],
    });

    expect(errors).toEqual([
      'title: Add a quiz title.',
      expect.stringMatching(/^Question 1: .*"z" is not one of the option ids/),
      expect.stringMatching(/^Question 2: type: /),
      expect.stringMatching(/^Question 3: .*at least two options/),
    ]);
  });

  it('gives a single problem for text that is not JSON', () => {
    expect(errorsOf('{ "title": ')).toHaveLength(1);
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

  // AI output often gets the answer shape wrong; each case would leave a
  // question that can never be answered correctly
  it('needs a single option id for MCQ and true/false', () => {
    expect(errorOf(withQuestion({ correctAnswer: ['a'] }))).toBe(
      'Question 1: mcq needs correctAnswer as a single option id.',
    );
  });

  it('needs a non-empty answer for short answer', () => {
    expect(
      errorOf({
        ...aiQuiz,
        questions: [
          { type: 'short-answer', prompt: 'Which?', correctAnswer: '  ' },
        ],
      }),
    ).toBe('Question 1: short-answer needs a non-empty correctAnswer.');
  });

  it('needs [BLANK] markers in a multi-blank prompt', () => {
    expect(
      errorOf({
        ...aiQuiz,
        questions: [
          {
            type: 'multi-blank',
            prompt: 'No gaps here.',
            correctAnswer: ['x'],
          },
        ],
      }),
    ).toBe('Question 1: the prompt has no [BLANK] markers.');
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
