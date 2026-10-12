// @vitest-environment jsdom
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppContainer } from './AppContainer';
import { loadSavedQuizzes } from '../../utils/attemptStorage';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const mainNav = () => screen.getByRole('navigation', { name: 'Main' });

async function finishQuiz() {
  await userEvent.click(screen.getByRole('button', { name: 'Submit Quiz' }));
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Submit Quiz',
    }),
  );
}

describe('AppContainer', () => {
  it('opens on the creator with the main navigation', () => {
    render(<AppContainer />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create a mock test' }),
    ).toBeInTheDocument();
    expect(
      within(mainNav()).getByRole('button', { name: 'Create test' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('saves a quiz started from the creator and runs it without the navigation', async () => {
    render(<AppContainer />);

    await userEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start quiz' }));

    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Main' })).toBeNull();
    expect(loadSavedQuizzes(localStorage).map((q) => q.title)).toEqual([
      'DevOps Basics Practice',
    ]);
  });

  it('returns to the creator after a quiz and reviews the attempt from the library', async () => {
    render(<AppContainer />);
    await userEvent.click(
      within(mainNav()).getByRole('button', { name: 'Try a sample' }),
    );
    await finishQuiz();
    await userEvent.click(
      screen.getAllByRole('button', { name: 'Back to Creator' })[0],
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create a mock test' }),
    ).toBeInTheDocument();
    await userEvent.click(
      within(mainNav()).getByRole('button', { name: 'Library' }),
    );
    await userEvent.click(
      screen.getByRole('tab', { name: /Attempt history \(1\)/ }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Review' }));

    expect(
      screen.getByRole('region', { name: 'Quiz Submission Overview' }),
    ).toBeInTheDocument();
  });

  it('starts a saved test from the library', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AppContainer />);
    await userEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start quiz' }));
    await userEvent.click(screen.getByRole('button', { name: 'Exit quiz' }));
    await userEvent.click(
      within(mainNav()).getByRole('button', { name: 'Library' }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Start' }));

    expect(screen.getByRole('timer')).toBeInTheDocument();
  });
});
