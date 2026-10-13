// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizSimulator } from './QuizSimulator';
import {
  attemptKey,
  HISTORY_KEY,
  loadAttempt,
  loadHistory,
  saveAttempt,
} from '../../utils/attemptStorage';
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

    await u.click(screen.getAllByRole('button', { name: 'Next Page' })[0]);

    expect(
      screen.getByRole('heading', { name: /^Question 2/ }),
    ).toBeInTheDocument();
    expect(pageLabel()).toHaveTextContent('Page 2 of 3');
  });

  it('shows every question on one page in single-page mode', () => {
    render(<QuizSimulator quiz={{ ...quiz, templateMode: 'single-page' }} />);

    expect(
      screen.getAllByRole('heading', { name: /^Question \d/ }),
    ).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Next Page' })).toBeNull();
  });

  it('scrolls the quiz when the wheel is used over the question navigator', () => {
    const scrollBy = vi.fn();
    HTMLElement.prototype.scrollBy = scrollBy;
    render(<QuizSimulator quiz={{ ...quiz, templateMode: 'single-page' }} />);

    fireEvent.wheel(screen.getByRole('navigation', { name: 'Questions' }), {
      deltaY: 150,
    });

    expect(scrollBy).toHaveBeenCalledWith({ top: 150 });
  });

  it('scrolls the quiz when the wheel is used anywhere outside it', () => {
    const scrollBy = vi.fn();
    HTMLElement.prototype.scrollBy = scrollBy;
    const { container } = render(
      <QuizSimulator quiz={{ ...quiz, templateMode: 'single-page' }} />,
    );

    // The white side margins around the quiz column
    fireEvent.wheel(container.firstElementChild!, { deltaY: 90 });
    expect(scrollBy).toHaveBeenCalledWith({ top: 90 });

    // Over the quiz itself the browser scrolls, so nothing is forwarded
    scrollBy.mockClear();
    fireEvent.wheel(screen.getByRole('main'), { deltaY: 90 });
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('saves answers and restores them after a reload', async () => {
    const u = user();
    const { unmount } = render(<QuizSimulator quiz={quiz} />);

    await u.click(screen.getByRole('radio', { name: 'Right 1' }));
    await u.click(screen.getAllByRole('button', { name: 'Next Page' })[0]);
    unmount();

    expect(loadAttempt(localStorage, 'sim')).toMatchObject({
      answers: { q1: 'a' },
      currentPage: 2,
    });

    render(<QuizSimulator quiz={quiz} />);
    expect(pageLabel()).toHaveTextContent('Page 2 of 3');
    expect(screen.getByText('1 of 3 questions saved')).toBeInTheDocument();
  });

  it('counts down from the saved deadline, not from the full time', () => {
    saveAttempt(localStorage, {
      quizId: 'sim',
      startedAt: new Date(START - 540_000).toISOString(),
      deadline: START + 60_000,
      currentPage: 1,
      answers: {},
      flagged: {},
      eventLog: [],
    });

    render(<QuizSimulator quiz={quiz} />);

    expect(screen.getByRole('timer')).toHaveTextContent('0:01:00 remaining');
  });

  it('records one attempt in history when submitted and clears the saved attempt', async () => {
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
    expect(localStorage.getItem(attemptKey('sim'))).toBeNull();
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

  it('logs blocked copying in the attempt when anti-cheat is on', () => {
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

    expect(loadAttempt(localStorage, 'sim')?.eventLog).toEqual([
      expect.objectContaining({ type: 'copy_attempt' }),
    ]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Copying text is disabled during this exam.',
    );
  });
});
