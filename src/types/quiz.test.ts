import { describe, it, expect, expectTypeOf } from 'vitest';
import { QUESTION_TYPES } from './quiz';
import type { Question, QuestionType, QuizConfig } from './quiz';

describe('quiz types', () => {
  it('lists every supported question type', () => {
    expect(QUESTION_TYPES).toEqual([
      'mcq',
      'multi-select',
      'true-false',
      'short-answer',
      'multi-blank',
    ]);
  });

  it('derives QuestionType from QUESTION_TYPES', () => {
    expectTypeOf<QuestionType>().toEqualTypeOf<
      (typeof QUESTION_TYPES)[number]
    >();
  });

  it('accepts a single answer or a list of answers', () => {
    expectTypeOf<Question['correctAnswer']>().toEqualTypeOf<
      string | string[]
    >();
  });

  it('holds its questions in the quiz config', () => {
    expectTypeOf<QuizConfig['questions']>().toEqualTypeOf<Question[]>();
  });
});
