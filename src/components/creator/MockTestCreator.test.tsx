// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockTestCreator } from './MockTestCreator';
import { sampleQuiz } from '../../data/sampleQuiz';

describe('MockTestCreator', () => {
  it('lays out the three steps', () => {
    render(<MockTestCreator onStart={() => {}} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mock Test Creator' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('form', { name: 'Configure Test & AI Prompt Options' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Compiled AI System Prompt' }),
    ).toHaveTextContent('Total Questions: 10');
    expect(
      screen.getByRole('region', {
        name: 'Paste JSON Payload or Drag & Drop File',
      }),
    ).toBeInTheDocument();
  });

  it('locks the prompt when every question type is unticked', async () => {
    render(<MockTestCreator onStart={() => {}} />);
    const types = screen.getByRole('group', {
      name: 'Included Question Types',
    });

    for (const box of within(types).getAllByRole('checkbox', {
      checked: true,
    })) {
      await userEvent.click(box);
    }

    expect(
      screen.getByRole('button', { name: 'Prompt Locked' }),
    ).toBeDisabled();
  });

  it('starts the imported quiz with the title and time limit chosen here', async () => {
    const onStart = vi.fn();
    render(<MockTestCreator onStart={onStart} />);

    await userEvent.type(
      screen.getByLabelText('Test Title (Optional)'),
      'My Midterm',
    );
    const time = screen.getByLabelText('Time Limit (Minutes)');
    await userEvent.clear(time);
    await userEvent.type(time, '30');
    fireEvent.change(screen.getByLabelText('Quiz JSON'), {
      target: { value: JSON.stringify(sampleQuiz) },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Start Quiz Simulation Now' }),
    );

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Midterm', timeLimitMinutes: 30 }),
    );
  });
});
