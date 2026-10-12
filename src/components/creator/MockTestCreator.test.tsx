// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockTestCreator } from './MockTestCreator';

describe('MockTestCreator', () => {
  it('lays out the options, the prompt and the importer', () => {
    render(<MockTestCreator onStart={() => {}} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Create a mock test' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('form', { name: 'Test options' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'AI prompt' })).toHaveTextContent(
      'Total Questions: 10',
    );
    expect(
      screen.getByRole('region', { name: "Import the AI's answer" }),
    ).toBeInTheDocument();
  });

  it('updates the prompt as the options change and locks it when invalid', async () => {
    render(<MockTestCreator onStart={() => {}} />);
    const types = screen.getByRole('group', { name: 'Question types' });

    for (const box of within(types).getAllByRole('checkbox')) {
      await userEvent.click(box);
    }

    expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeDisabled();
    expect(
      screen.getByText('Select at least one question type.'),
    ).toBeInTheDocument();
  });

  it('starts the imported quiz with the title and time limit chosen here', async () => {
    const onStart = vi.fn();
    render(<MockTestCreator onStart={onStart} />);

    await userEvent.type(
      screen.getByLabelText('Test title (optional)'),
      'My Midterm',
    );
    const time = screen.getByLabelText('Time limit (minutes)');
    await userEvent.clear(time);
    await userEvent.type(time, '30');
    await userEvent.click(screen.getByRole('button', { name: 'Load sample' }));
    await userEvent.click(screen.getByRole('button', { name: 'Start quiz' }));

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Midterm', timeLimitMinutes: 30 }),
    );
  });
});
