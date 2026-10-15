import { describe, it, expect } from 'vitest';
import { readyTests } from './readyTests';
import { applyPresetPrompt, presets } from '../utils/presets';

describe('built-in ready tests', () => {
  it('has the DevOps and the ITG Java test', () => {
    expect(readyTests.map((t) => t.id)).toEqual(['devops', 'itg']);
  });

  // The preset is what the test claims to be, so the quiz file must match it
  describe.each(readyTests.map((t) => [t.id, t] as const))('%s', (id, test) => {
    const preset = presets.find((p) => p.id === id)!;
    const { questionCount, types } = applyPresetPrompt(preset);

    it('has as many questions as its preset asks for', () => {
      expect(test.quiz.questions).toHaveLength(questionCount);
    });

    it('only uses the question types of its preset', () => {
      for (const q of test.quiz.questions) {
        expect(types, `Question ${q.number}`).toContain(q.type);
      }
    });

    it('marks only options that exist as correct', () => {
      for (const q of test.quiz.questions) {
        const ids = (q.options ?? []).map((o) => o.id);
        const correct = [q.correctAnswer].flat();
        expect(correct.length, `Question ${q.number}`).toBeGreaterThan(0);
        for (const answer of correct) {
          expect(ids, `Question ${q.number}`).toContain(answer);
        }
      }
    });

    it('explains every answer', () => {
      for (const q of test.quiz.questions) {
        expect(q.explanation, `Question ${q.number}`).toBeTruthy();
      }
    });
  });
});
