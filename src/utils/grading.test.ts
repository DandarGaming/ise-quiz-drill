import { describe, it, expect } from 'vitest';
import { gradeQuestion, gradeQuiz } from './grading';
import type { Question, QuizConfig } from '../types/quiz';

const question = (overrides: Partial<Question>): Question => ({
  id: 'q',
  number: 1,
  page: 1,
  type: 'mcq',
  points: 2,
  prompt: 'Prompt',
  correctAnswer: 'a',
  ...overrides,
});

const mcq = question({ id: 'mcq', type: 'mcq', correctAnswer: 'b' });
const trueFalse = question({
  id: 'tf',
  type: 'true-false',
  correctAnswer: 'true',
});
const multi = question({
  id: 'multi',
  type: 'multi-select',
  correctAnswer: ['a', 'c'],
});
const short = question({
  id: 'short',
  type: 'short-answer',
  correctAnswer: 'Amazon S3',
});
const blanks = question({
  id: 'blanks',
  type: 'multi-blank',
  correctAnswer: ['Continuous', 'Integration'],
});

const earned = (q: Question, answer?: string | string[]) =>
  gradeQuestion(q, answer).earnedPoints;

describe('gradeQuestion', () => {
  it('gives full points for the right MCQ option and none otherwise', () => {
    expect(earned(mcq, 'b')).toBe(2);
    expect(earned(mcq, 'a')).toBe(0);
  });

  it('grades true/false like MCQ', () => {
    expect(earned(trueFalse, 'true')).toBe(2);
    expect(earned(trueFalse, 'false')).toBe(0);
  });

  it('gives no points to an unanswered question', () => {
    for (const q of [mcq, trueFalse, multi, short, blanks]) {
      expect(earned(q, undefined), q.id).toBe(0);
    }
  });

  it('needs exactly the correct set for multiple select, in any order', () => {
    expect(earned(multi, ['c', 'a'])).toBe(2);
    expect(earned(multi, ['a'])).toBe(0);
    expect(earned(multi, ['a', 'b', 'c'])).toBe(0);
    expect(earned(multi, [])).toBe(0);
  });

  it('ignores a repeated option in multiple select', () => {
    expect(earned(multi, ['a', 'a', 'c'])).toBe(2);
  });

  it('ignores case and surrounding spaces in short answers', () => {
    expect(earned(short, '  amazon s3 ')).toBe(2);
    expect(earned(short, 'Amazon  S3')).toBe(0);
    expect(earned(short, 'S3')).toBe(0);
  });

  it('accepts any listed alternative for a short answer', () => {
    const alternatives = question({
      type: 'short-answer',
      correctAnswer: ['S3', 'Amazon S3'],
    });
    expect(earned(alternatives, 's3')).toBe(2);
    expect(earned(alternatives, 'amazon s3')).toBe(2);
    expect(earned(alternatives, 'EBS')).toBe(0);
  });

  it('needs every blank right, ignoring case and surrounding spaces', () => {
    expect(earned(blanks, [' continuous', 'INTEGRATION '])).toBe(2);
    expect(earned(blanks, ['Continuous', 'Delivery'])).toBe(0);
    expect(earned(blanks, ['Continuous'])).toBe(0);
  });

  it('reports the answer, the correct answer and whether it was right', () => {
    expect(gradeQuestion(multi, ['a', 'c'])).toEqual({
      questionId: 'multi',
      earnedPoints: 2,
      maxPoints: 2,
      isCorrect: true,
      userAnswer: ['a', 'c'],
      correctAnswer: ['a', 'c'],
    });
    expect(gradeQuestion(mcq, undefined)).toMatchObject({
      isCorrect: false,
      userAnswer: '',
    });
  });
});

describe('gradeQuiz', () => {
  const quiz: QuizConfig = {
    id: 'quiz',
    title: 'Quiz',
    courseCode: 'CS0000',
    description: '',
    templateMode: 'paginated',
    timeLimitMinutes: 10,
    questionsPerPage: 1,
    questions: [mcq, multi, question({ id: 'one', points: 1 })],
  };

  it('adds up earned and total points and works out the percentage', () => {
    const result = gradeQuiz(quiz, { mcq: 'b', multi: ['a'], one: 'a' });

    expect(result.results.map((r) => r.earnedPoints)).toEqual([2, 0, 1]);
    expect(result.earnedScore).toBe(3);
    expect(result.totalPoints).toBe(5);
    expect(result.percentage).toBe(60);
  });

  it('rounds the percentage to two decimals', () => {
    const thirds = {
      ...quiz,
      questions: [mcq, question({ id: 'x' }), question({ id: 'y' })],
    };
    expect(gradeQuiz(thirds, { mcq: 'b' }).percentage).toBe(33.33);
  });

  it('returns zero percent for a quiz without points', () => {
    const empty = { ...quiz, questions: [] };
    expect(gradeQuiz(empty, {})).toMatchObject({
      earnedScore: 0,
      totalPoints: 0,
      percentage: 0,
    });
  });
});
