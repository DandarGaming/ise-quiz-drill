// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppContainer } from '../../src/components/app/AppContainer';
import { sampleQuiz } from '../../src/data/sampleQuiz';
import { loadHistory, loadSavedQuizzes } from '../../src/utils/attemptStorage';

// These tests drive the whole app (creator, quiz, results, library) with a
// real localStorage, the way a student would, and check what is stored.

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const mainNav = () => screen.getByRole('navigation', { name: 'Main' });
const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText('Quiz JSON'), {
    target: { value: text },
  });

async function startQuiz(user = userEvent.setup(), json = sampleQuiz) {
  await user.type(screen.getByLabelText(/Test Title/), 'Integration quiz');
  paste(JSON.stringify(json));
  await user.click(
    screen.getByRole('button', { name: 'Start Quiz Simulation Now' }),
  );
}

const nextPage = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getAllByRole('button', { name: 'Next Page' })[0]);

async function submit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Submit Quiz' }));
  await user.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Submit Quiz',
    }),
  );
}

async function answerEverythingCorrectly(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole('radio', { name: '3' }));
  await nextPage(user);
  await user.click(screen.getByRole('checkbox', { name: 'Amazon S3' }));
  await user.click(screen.getByRole('checkbox', { name: 'Amazon CloudFront' }));
  await nextPage(user);
  await user.click(screen.getByRole('radio', { name: 'True' }));
  await nextPage(user);
  await user.type(screen.getByLabelText('Answer'), 'S3');
  await nextPage(user);
  await user.type(screen.getByLabelText('Blank 1'), 'Integration');
  await user.type(screen.getByLabelText('Blank 2'), 'Delivery');
}

describe('quiz journey', () => {
  it('takes a quiz of every question type and keeps the result in the history', async () => {
    const user = userEvent.setup();
    render(<AppContainer />);
    await startQuiz(user);

    await answerEverythingCorrectly(user);
    expect(screen.getByText('5 of 5 questions saved')).toBeInTheDocument();
    await submit(user);

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toHaveTextContent('7 / 7 (100%)');
    const [attempt] = loadHistory(localStorage);
    expect(attempt).toMatchObject({
      quizTitle: 'Integration quiz',
      earnedScore: 7,
      totalPoints: 7,
    });

    await user.click(
      screen.getAllByRole('button', { name: 'Back to Creator' })[0],
    );
    await user.click(
      within(mainNav()).getByRole('button', { name: /Saved Library/ }),
    );
    await user.click(
      screen.getByRole('tab', { name: /Attempt History \(1\)/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Review' }));

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toHaveTextContent('7 / 7 (100%)');
  });

  it('retakes a quiz from a reviewed attempt with a fresh start and keeps the old result', async () => {
    const user = userEvent.setup();
    render(<AppContainer />);
    await startQuiz(user);
    await user.click(screen.getByRole('radio', { name: '3' }));
    await submit(user);
    await user.click(
      screen.getAllByRole('button', { name: 'Back to Creator' })[0],
    );
    await user.click(
      within(mainNav()).getByRole('button', { name: /Saved Library/ }),
    );
    await user.click(
      screen.getByRole('tab', { name: /Attempt History \(1\)/ }),
    );
    await user.click(screen.getByRole('button', { name: 'Review' }));

    await user.click(screen.getAllByRole('button', { name: 'Retake Quiz' })[0]);

    expect(screen.getByRole('timer')).toHaveTextContent('0:15:00 remaining');
    expect(screen.getByText('0 of 5 questions saved')).toBeInTheDocument();
    expect(loadHistory(localStorage)).toHaveLength(1);
  });

  it('scores a submission with no answers as zero', async () => {
    const user = userEvent.setup();
    render(<AppContainer />);
    await startQuiz(user);

    await submit(user);

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toHaveTextContent('0 / 7 (0%)');
    expect(loadHistory(localStorage)).toHaveLength(1);
  });

  it('shows every question on one page in single-page mode', async () => {
    const user = userEvent.setup();
    render(<AppContainer />);
    await user.click(
      screen.getByRole('button', { name: 'Scroll Form (All Questions)' }),
    );
    await startQuiz(user);

    expect(
      screen.getAllByRole('heading', { name: /^Question \d$/ }),
    ).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Next Page' })).toBeNull();
  });

  it('submits by itself when the time limit runs out', async () => {
    vi.useFakeTimers();
    render(<AppContainer />);
    fireEvent.change(screen.getByLabelText('Time Limit (Minutes)'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByLabelText(/Test Title/), {
      target: { value: 'Timed quiz' },
    });
    paste(JSON.stringify(sampleQuiz));
    fireEvent.click(
      screen.getByRole('button', { name: 'Start Quiz Simulation Now' }),
    );
    expect(screen.getByRole('timer')).toHaveTextContent('0:01:00 remaining');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(61_000);
    });

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toBeInTheDocument();
    expect(loadHistory(localStorage)).toHaveLength(1);
  });
});

describe('importing quizzes', () => {
  it('explains a broken JSON and starts once it is fixed', async () => {
    const user = userEvent.setup();
    render(<AppContainer />);
    await user.type(screen.getByLabelText(/Test Title/), 'Broken then fixed');

    paste('{"title": "Oops",');
    expect(screen.getByRole('alert')).toHaveTextContent(/not valid JSON/);
    expect(
      screen.queryByRole('button', { name: 'Start Quiz Simulation Now' }),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Copy Error for AI Fix' }),
    ).toBeInTheDocument();

    paste(JSON.stringify(sampleQuiz));
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(
      screen.getByRole('button', { name: 'Start Quiz Simulation Now' }),
    );
    expect(screen.getByRole('timer')).toBeInTheDocument();
  });

  it('rejects a quiz without questions', () => {
    render(<AppContainer />);

    paste(JSON.stringify({ ...sampleQuiz, questions: [] }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});

describe('saved library', () => {
  it('keeps a started quiz after a reload and lets it be deleted', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    const first = render(<AppContainer />);
    await startQuiz(user);
    await user.click(screen.getByRole('button', { name: 'Exit quiz' }));
    expect(loadSavedQuizzes(localStorage)).toHaveLength(1);
    first.unmount();

    render(<AppContainer />);
    expect(
      within(mainNav()).getByRole('button', { name: /Saved Library/ }),
    ).toHaveTextContent('1');
    await user.click(
      within(mainNav()).getByRole('button', { name: /Saved Library/ }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Delete Integration quiz' }),
    );

    expect(loadSavedQuizzes(localStorage)).toHaveLength(0);
    expect(screen.getByText('No Saved Quizzes Found')).toBeInTheDocument();
  });
});
