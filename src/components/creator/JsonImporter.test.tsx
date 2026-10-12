// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonImporter } from './JsonImporter';
import { sampleQuiz } from '../../data/sampleQuiz';
import type { ImportSettings } from '../../utils/quizSchema';

const settings: ImportSettings = {
  fallbackId: 'quiz-1',
  timeLimitMinutes: 25,
  templateMode: 'paginated',
  antiCheat: {
    enabled: false,
    tabLock: true,
    uiRestrictions: true,
    fullscreenLock: true,
  },
};

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText('Quiz JSON'), {
    target: { value: text },
  });

describe('JsonImporter', () => {
  it('waits for input before showing anything', () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    expect(screen.queryByRole('button', { name: /Start Quiz/ })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('summarises a valid quiz and starts it with the creator settings', async () => {
    const onStart = vi.fn();
    render(<JsonImporter settings={settings} onStart={onStart} />);

    paste(JSON.stringify(sampleQuiz));

    expect(screen.getByRole('status')).toHaveTextContent(
      'Total Questions: 5 | Time Limit: 25 minutes | 1 Question / Page',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Start Quiz Simulation Now' }),
    );
    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'DevOps Basics Practice',
        timeLimitMinutes: 25,
      }),
    );
  });

  it('shows what is wrong and blocks starting', () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);

    paste('{"title": "x", "questions": []}');

    expect(screen.getByRole('alert')).toHaveTextContent(
      'questions: Add at least one question.',
    );
    expect(screen.getByLabelText('Quiz JSON')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(screen.queryByRole('button', { name: /Start Quiz/ })).toBeNull();
  });

  it('copies a fix request for the AI', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    paste('{"title": "x", "questions": []}');

    await user.click(
      screen.getByRole('button', { name: 'Copy Error for AI Fix' }),
    );

    expect(writeText.mock.lastCall?.[0]).toContain(
      'questions: Add at least one question.',
    );
    expect(
      screen.getByRole('button', { name: 'Error Copied!' }),
    ).toBeInTheDocument();
  });

  it('reads an uploaded .json file', async () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    const file = new File([JSON.stringify(sampleQuiz)], 'quiz.json', {
      type: 'application/json',
    });

    await userEvent.upload(
      screen.getByLabelText('browse files from computer'),
      file,
    );

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Total Questions: 5',
      ),
    );
  });
});
