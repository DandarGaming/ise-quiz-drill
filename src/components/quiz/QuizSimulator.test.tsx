// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizSimulator } from './QuizSimulator';
import { HISTORY_KEY, loadHistory } from '../../utils/attemptStorage';
import type { Question, QuizConfig } from '../../types/quiz';

const START = Date.parse('2026-10-12T09:00:00.000Z');

const question = (number: number): Question => ({
  id: `q${number}`,
  number,
  page: 1,
  type: 'mcq',
  points: 1,
  prompt: `Prompt ${number}`,
  options: [
    { id: 'a', text: `Right ${number}` },
    { id: 'b', text: `Wrong ${number}` },
  ],
  correctAnswer: 'a',
});

const quiz: QuizConfig = {
  id: 'sim',
  title: 'Simulator Quiz',
  courseCode: 'CS4421',
  description: '',
  templateMode: 'paginated',
  timeLimitMinutes: 10,
  questionsPerPage: 1,
  questions: [question(1), question(2), question(3)],
};

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(START);
});
afterEach(() => vi.useRealTimers());

const user = () =>
  userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });

const pageLabel = () => screen.getAllByText(/^Page \d+ of \d+$/)[0];

async function submitThroughDialog(u: ReturnType<typeof user>) {
  await u.click(screen.getByRole('button', { name: 'Submit Quiz' }));
  await u.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Submit Quiz',
    }),
  );
}

describe('QuizSimulator', () => {
  it('shows one question per page with page controls', async () => {
    const u = user();
    render(<QuizSimulator quiz={quiz} />);

    expect(
      screen.getByRole('heading', { name: /^Question 1/ }),
    ).toBeInTheDocument();
    expect(pageLabel()).toHaveTextContent('Page 1 of 3');
    expect(
      screen.getAllByRole('button', { name: 'Previous Page' })[0],
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Submit Quiz' })).toHaveClass(
      'text-[#1f2937]',
    );
    expect(
      screen.queryByRole('group', { name: 'Appearance' }),
    ).not.toBeInTheDocument();

    await u.click(screen.getAllByRole('button', { name: 'Next Page' })[0]);

    expect(
      screen.getByRole('heading', { name: /^Question 2/ }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Previous Page' })[0],
    ).toHaveClass('text-[#1f2937]');
    expect(pageLabel()).toHaveTextContent('Page 2 of 3');
  });

  it('shows every question on one page in single-page mode', () => {
    render(<QuizSimulator quiz={{ ...quiz, templateMode: 'single-page' }} />);

    expect(
      screen.getAllByRole('heading', { name: /^Question \d/ }),
    ).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Next Page' })).toBeNull();
  });

  it('keeps an attempt in memory only, so a later start is always fresh', async () => {
    const u = user();
    render(<QuizSimulator quiz={quiz} />);

    await u.click(screen.getByRole('radio', { name: 'Right 1' }));
    await u.click(screen.getAllByRole('button', { name: 'Next Page' })[0]);

    expect(localStorage).toHaveLength(0);
  });

  it('records one attempt in history when submitted', async () => {
    const u = user();
    render(<QuizSimulator quiz={quiz} />);
    await u.click(screen.getByRole('radio', { name: 'Right 1' }));
    act(() => vi.advanceTimersByTime(90_000));

    await submitThroughDialog(u);

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toHaveTextContent('1 / 3 (33%)');
    const history = loadHistory(localStorage);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      quizId: 'sim',
      earnedScore: 1,
      totalPoints: 3,
      answers: { q1: 'a' },
    });
    expect(history[0].timestamp).toMatch(/^\d{4}-\d\d-\d\dT.*Z$/);
    expect(history[0].timeTakenSeconds).toBeGreaterThanOrEqual(90);
    expect(Object.keys(localStorage)).toEqual([HISTORY_KEY]);
  });

  it('submits once by itself when time runs out', () => {
    render(<QuizSimulator quiz={quiz} />);

    act(() => vi.advanceTimersByTime(10 * 60_000 + 2000));

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toBeInTheDocument();
    expect(loadHistory(localStorage)).toHaveLength(1);
    expect(loadHistory(localStorage)[0].timeTakenSeconds).toBe(600);
  });

  it('warns five minutes before the end', () => {
    render(<QuizSimulator quiz={quiz} />);

    act(() => vi.advanceTimersByTime(5 * 60_000));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Your work will be submitted in 5 minutes.',
    );
  });

  it('starts a fresh attempt on retake', async () => {
    const u = user();
    render(<QuizSimulator quiz={quiz} />);
    await u.click(screen.getByRole('radio', { name: 'Wrong 1' }));
    await submitThroughDialog(u);

    await u.click(screen.getAllByRole('button', { name: 'Retake Quiz' })[0]);

    expect(screen.getByRole('timer')).toHaveTextContent('0:10:00 remaining');
    expect(screen.getByText('0 of 3 questions saved')).toBeInTheDocument();
    expect(localStorage.getItem(HISTORY_KEY)).not.toBeNull();
  });

  it('logs blocked copying in the attempt when anti-cheat is on', async () => {
    const u = user();
    render(
      <QuizSimulator
        quiz={{
          ...quiz,
          antiCheat: {
            enabled: true,
            tabLock: false,
            uiRestrictions: true,
            fullscreenLock: false,
          },
        }}
      />,
    );

    act(() => {
      document.dispatchEvent(new Event('copy', { cancelable: true }));
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      'Copying text is disabled during this exam.',
    );

    await submitThroughDialog(u);
    expect(loadHistory(localStorage)[0].eventLog).toEqual([
      expect.objectContaining({ type: 'copy_attempt' }),
    ]);
  });
});
