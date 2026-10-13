// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockTestCreator } from './MockTestCreator';
import { sampleQuiz } from '../../data/sampleQuiz';

const promptBox = () =>
  screen.getByRole('region', { name: 'Compiled AI System Prompt' });
const updateButton = () =>
  screen.getByRole('button', { name: 'Update Prompt' });

describe('MockTestCreator', () => {
  it('keeps the test configuration apart from the AI prompt and output', () => {
    render(<MockTestCreator onStart={() => {}} />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Mock Test Creator' }),
    ).toBeInTheDocument();
    const config = screen.getByRole('region', { name: 'Test Configuration' });
    const ai = screen.getByRole('region', { name: 'AI Prompt & Output' });

    expect(within(config).getByLabelText('Test Title')).toBeInTheDocument();
    expect(
      within(config).getByLabelText('Time Limit (Minutes)'),
    ).toBeInTheDocument();
    expect(
      within(config).getByRole('checkbox', { name: 'Enable Anti-Cheat' }),
    ).toBeInTheDocument();
    expect(within(config).queryByLabelText('Number of Questions')).toBeNull();

    expect(
      within(ai).getByLabelText('Number of Questions'),
    ).toBeInTheDocument();
    expect(within(ai).queryByLabelText('Test Title')).toBeNull();
    expect(within(ai).queryByLabelText('Time Limit (Minutes)')).toBeNull();
    expect(
      within(ai).getByRole('region', { name: 'Compiled AI System Prompt' }),
    );
    expect(
      within(ai).getByRole('region', {
        name: 'Paste JSON Payload or Drag & Drop File',
      }),
    ).toBeInTheDocument();
  });

  it('starts with an empty prompt and a highlighted Update Prompt button', () => {
    render(<MockTestCreator onStart={() => {}} />);

    expect(promptBox()).not.toHaveTextContent('Total Questions');
    expect(updateButton()).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy Locked' })).toBeDisabled();
  });

  it('builds the prompt on Update and then allows copying it', async () => {
    render(<MockTestCreator onStart={() => {}} />);

    await userEvent.click(updateButton());

    expect(promptBox()).toHaveTextContent('Total Questions: 10');
    expect(
      screen.getByRole('button', { name: 'Prompt Up to Date' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Copy AI Prompt' }),
    ).toBeEnabled();
  });

  it('marks the prompt out of date when a prompt option changes', async () => {
    render(<MockTestCreator onStart={() => {}} />);
    await userEvent.click(updateButton());

    const count = screen.getByLabelText('Number of Questions');
    await userEvent.clear(count);
    await userEvent.type(count, '12');

    expect(promptBox()).toHaveTextContent('Total Questions: 10');
    expect(updateButton()).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy Locked' })).toBeDisabled();

    await userEvent.click(updateButton());
    expect(promptBox()).toHaveTextContent('Total Questions: 12');
  });

  it('keeps the prompt up to date when only the test configuration changes', async () => {
    render(<MockTestCreator onStart={() => {}} />);
    await userEvent.click(updateButton());

    await userEvent.type(screen.getByLabelText('Test Title'), 'My Midterm');
    await userEvent.click(
      screen.getByRole('button', { name: 'Scroll Form (All Questions)' }),
    );

    expect(
      screen.getByRole('button', { name: 'Prompt Up to Date' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Copy AI Prompt' }),
    ).toBeEnabled();
  });

  it('does not build a prompt while every question type is unticked', async () => {
    render(<MockTestCreator onStart={() => {}} />);
    const types = screen.getByRole('group', {
      name: 'Included Question Types',
    });

    for (const box of within(types).getAllByRole('checkbox', {
      checked: true,
    })) {
      await userEvent.click(box);
    }

    expect(updateButton()).toBeDisabled();
    expect(promptBox()).toHaveTextContent('Select at least one question type.');
    expect(promptBox()).not.toHaveTextContent('Total Questions');
  });

  it('keeps Start locked until a title is entered, then uses the title and time limit chosen here', async () => {
    const onStart = vi.fn();
    render(<MockTestCreator onStart={onStart} />);
    fireEvent.change(screen.getByLabelText('Quiz JSON'), {
      target: { value: JSON.stringify(sampleQuiz) },
    });
    const start = () =>
      screen.getByRole('button', { name: 'Start Quiz Simulation Now' });

    expect(start()).toBeDisabled();
    expect(screen.getByText('Title required')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Test Title'), 'My Midterm');
    const time = screen.getByLabelText('Time Limit (Minutes)');
    await userEvent.clear(time);
    await userEvent.type(time, '30');
    await userEvent.click(start());

    expect(onStart).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Midterm', timeLimitMinutes: 30 }),
    );
  });
});
