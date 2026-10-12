import { describe, it, expect } from 'vitest';
import { paginate } from './pagination';
import type { Question, QuizConfig } from '../types/quiz';

const question = (id: string, number: number): Question => ({
  id,
  number,
  page: 7,
  type: 'mcq',
  points: 1,
  prompt: id,
  correctAnswer: 'a',
});

const quiz = (templateMode: QuizConfig['templateMode']): QuizConfig => ({
  id: 'quiz',
  title: 'Quiz',
  courseCode: 'CS0000',
  description: '',
  templateMode,
  timeLimitMinutes: 10,
  questionsPerPage: 1,
  questions: [question('a', 0), question('b', 5), question('c', 0)],
});

describe('paginate', () => {
  it('puts one question on each page in paginated mode', () => {
    const { questions, totalPages } = paginate(quiz('paginated'));
    expect(questions.map((q) => q.page)).toEqual([1, 2, 3]);
    expect(totalPages).toBe(3);
  });

  it('puts every question on one page in single-page mode', () => {
    const { questions, totalPages } = paginate(quiz('single-page'));
    expect(questions.map((q) => q.page)).toEqual([1, 1, 1]);
    expect(totalPages).toBe(1);
  });

  it('numbers questions by position when no number is given', () => {
    const { questions } = paginate(quiz('paginated'));
    expect(questions.map((q) => q.number)).toEqual([1, 5, 3]);
  });
});
