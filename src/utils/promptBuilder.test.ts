import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  defaultPromptOptions,
  validatePromptOptions,
  type PromptOptions,
} from './promptBuilder';

const options = (overrides: Partial<PromptOptions> = {}): PromptOptions => ({
  ...defaultPromptOptions,
  ...overrides,
});

describe('buildPrompt', () => {
  it('uses the given title, or asks the AI to pick one', () => {
    expect(
      buildPrompt(options({ title: 'CS4421 Midterm' }), 'quiz-1'),
    ).toContain('Exam Title / Subject: "CS4421 Midterm"');
    expect(buildPrompt(options({ title: '  ' }), 'quiz-1')).toContain(
      'Exam Title: Generate an appropriate course code',
    );
  });

  it('asks for the chosen number of questions and only the chosen types', () => {
    const prompt = buildPrompt(
      options({ questionCount: 12, types: ['mcq', 'multi-blank'] }),
      'quiz-1',
    );
    expect(prompt).toContain('- Total Questions: 12');
    expect(prompt).toContain('"mcq" (single correct answer)');
    expect(prompt).toContain('"multi-blank"');
    expect(prompt).not.toContain('"true-false" (True / False only)');
  });

  it('spells out a custom difficulty mix', () => {
    const prompt = buildPrompt(
      options({
        difficulty: 'custom',
        mix: { easy: 20, medium: 50, hard: 30 },
      }),
      'quiz-1',
    );
    expect(prompt).toContain('20% Easy, 50% Medium, 30% Hard');
  });

  it('includes topics and notes only when given', () => {
    const withExtras = buildPrompt(
      options({ topics: 'IaC, CDK', notes: 'British spelling' }),
      'quiz-1',
    );
    expect(withExtras).toContain('Focus Topics: IaC, CDK');
    expect(withExtras).toContain('Special Instructions: British spelling');
    expect(buildPrompt(options(), 'quiz-1')).not.toContain(
      'Special Instructions',
    );
  });

  it('gives the same text for the same options and id', () => {
    expect(buildPrompt(options(), 'quiz-1')).toBe(
      buildPrompt(options(), 'quiz-1'),
    );
    expect(buildPrompt(options(), 'quiz-1')).toContain('"id": "quiz-1"');
  });
});

describe('validatePromptOptions', () => {
  it('accepts the defaults', () => {
    expect(validatePromptOptions(defaultPromptOptions)).toBeNull();
  });

  it('needs at least one question type', () => {
    expect(validatePromptOptions(options({ types: [] }))).toBe(
      'Select at least one question type.',
    );
  });

  it('needs a custom difficulty mix that adds up to 100%', () => {
    expect(
      validatePromptOptions(
        options({
          difficulty: 'custom',
          mix: { easy: 30, medium: 30, hard: 30 },
        }),
      ),
    ).toBe('The difficulty mix must add up to 100% (now 90%).');
    expect(
      validatePromptOptions(
        options({ difficulty: 'easy', mix: { easy: 0, medium: 0, hard: 0 } }),
      ),
    ).toBeNull();
  });

  it('needs a question count and a time limit', () => {
    expect(validatePromptOptions(options({ questionCount: 0 }))).toBe(
      'Choose between 1 and 50 questions.',
    );
    expect(validatePromptOptions(options({ timeLimitMinutes: 0 }))).toBe(
      'Choose a time limit between 1 and 180 minutes.',
    );
  });
});
