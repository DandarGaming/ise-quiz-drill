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
    fullscreenLock: false,
  },
};

const paste = (text: string) =>
  fireEvent.change(screen.getByLabelText('Quiz JSON'), {
    target: { value: text },
  });

describe('JsonImporter', () => {
  it('waits for input before showing anything', () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    expect(screen.getByRole('button', { name: 'Start quiz' })).toBeDisabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('summarises a valid quiz and starts it with the creator settings', async () => {
    const onStart = vi.fn();
    render(<JsonImporter settings={settings} onStart={onStart} />);

    paste(JSON.stringify(sampleQuiz));

    expect(screen.getByRole('status')).toHaveTextContent(
      'DevOps Basics Practice: 5 questions, 25 minutes',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Start quiz' }));
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
    expect(screen.getByRole('button', { name: 'Start quiz' })).toBeDisabled();
  });

  it('copies a fix request for the AI', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    paste('{"title": "x", "questions": []}');

    await user.click(screen.getByRole('button', { name: 'Copy fix request' }));

    expect(writeText.mock.lastCall?.[0]).toContain(
      'questions: Add at least one question.',
    );
  });

  it('loads the sample quiz', async () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Load sample' }));

    expect(screen.getByRole('status')).toHaveTextContent('5 questions');
  });

  it('reads an uploaded .json file', async () => {
    render(<JsonImporter settings={settings} onStart={() => {}} />);
    const file = new File([JSON.stringify(sampleQuiz)], 'quiz.json', {
      type: 'application/json',
    });

    await userEvent.upload(screen.getByLabelText('Upload a .json file'), file);

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('5 questions'),
    );
  });
});
