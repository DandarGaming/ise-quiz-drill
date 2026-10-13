// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizSimulator } from './QuizSimulator';
import type { QuizConfig } from '../../types/quiz';

const renders: Record<string, number> = {};

// A light stand-in that counts how often each question is rendered
vi.mock('./QuestionRenderer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./QuestionRenderer')>()),
  QuestionRenderer: ({
    question,
    onAnswerChange,
  }: {
    question: { id: string };
    onAnswerChange: (answer: string) => void;
  }) => {
    renders[question.id] = (renders[question.id] ?? 0) + 1;
    return (
      <button type="button" onClick={() => onAnswerChange('a')}>
        answer {question.id}
      </button>
    );
  },
}));

const question = (n: number) => ({
  id: `q${n}`,
  number: n,
  page: 1,
  points: 1,
  type: 'mcq' as const,
  prompt: `Question ${n}`,
  options: [{ id: 'a', text: 'A' }],
  correctAnswer: 'a',
});

const quiz: QuizConfig = {
  id: 'render-count',
  title: 'Render count',
  courseCode: 'TEST',
  description: '',
  templateMode: 'single-page',
  timeLimitMinutes: 15,
  questionsPerPage: 1,
  antiCheat: {
    enabled: false,
    tabLock: false,
    uiRestrictions: false,
    fullscreenLock: false,
  },
  questions: [question(1), question(2), question(3)],
};

describe('QuizSimulator in scroll mode', () => {
  beforeEach(() => {
    for (const id of Object.keys(renders)) delete renders[id];
  });

  it('does not render the other questions again when one is answered', async () => {
    render(<QuizSimulator quiz={quiz} storage={undefined} />);
    const before = { ...renders };

    await userEvent.click(screen.getByRole('button', { name: 'answer q1' }));

    expect(renders.q1).toBeGreaterThan(before.q1);
    expect(renders.q2).toBe(before.q2);
    expect(renders.q3).toBe(before.q3);
  });
});
