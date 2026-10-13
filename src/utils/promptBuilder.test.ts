import { describe, it, expect } from 'vitest';
import {
  buildPrompt,
  defaultPromptOptions,
  defaultTestConfig,
  validatePromptOptions,
  validateTestConfig,
  type PromptOptions,
  type TestConfig,
} from './promptBuilder';

const options = (overrides: Partial<PromptOptions> = {}): PromptOptions => ({
  ...defaultPromptOptions,
  ...overrides,
});

const config = (overrides: Partial<TestConfig> = {}): TestConfig => ({
  ...defaultTestConfig,
  title: 'Midterm',
  ...overrides,
});

describe('buildPrompt', () => {
  it('leaves the title to the app and keeps only a placeholder for the AI', () => {
    const prompt = buildPrompt(options(), 'quiz-1');
    expect(prompt).not.toContain('Exam Title');
    expect(prompt).toContain('"title": "[COURSE CODE] — [EXAM TITLE]"');
  });

  it('does not mention settings that the app applies itself', () => {
    const prompt = buildPrompt(options(), 'quiz-1');
    expect(prompt).not.toMatch(/time limit|anti-cheat|proctor|fullscreen/i);
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

  it('needs a question count between 1 and 50', () => {
    expect(validatePromptOptions(options({ questionCount: 0 }))).toBe(
      'Choose between 1 and 50 questions.',
    );
  });
});

describe('validateTestConfig', () => {
  it('accepts a title with the default settings', () => {
    expect(validateTestConfig(config())).toBeNull();
  });

  it('needs a title', () => {
    expect(validateTestConfig(config({ title: '' }))).toBe(
      'Enter a test title.',
    );
    expect(validateTestConfig(config({ title: '   ' }))).toBe(
      'Enter a test title.',
    );
  });

  it('needs a time limit between 1 and 180 minutes', () => {
    expect(validateTestConfig(config({ timeLimitMinutes: 0 }))).toBe(
      'Choose a time limit between 1 and 180 minutes.',
    );
    expect(validateTestConfig(config({ timeLimitMinutes: 181 }))).toBe(
      'Choose a time limit between 1 and 180 minutes.',
    );
  });
});
