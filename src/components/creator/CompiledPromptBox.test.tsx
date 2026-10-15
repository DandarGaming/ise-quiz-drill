// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompiledPromptBox } from './CompiledPromptBox';

const props = {
  prompt: 'Generate a quiz' as string | null,
  isStale: false,
  errors: [] as string[],
  onUpdate: () => {},
};

describe('CompiledPromptBox', () => {
  it('starts empty, with Update Prompt highlighted and Copy locked', () => {
    render(<CompiledPromptBox {...props} prompt={null} isStale />);

    const update = screen.getByRole('button', { name: 'Update Prompt' });
    expect(update).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy Locked' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('No prompt yet');
  });

  it('asks for the update when the prompt is out of date', async () => {
    const onUpdate = vi.fn();
    render(<CompiledPromptBox {...props} isStale onUpdate={onUpdate} />);

    const update = screen.getByRole('button', { name: 'Update Prompt' });
    expect(update).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Copy Locked' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Options changed since this prompt was built',
    );
    expect(screen.getByText('Generate a quiz')).toBeInTheDocument();

    await userEvent.click(update);
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it('shows an up to date prompt and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CompiledPromptBox {...props} />);

    const update = screen.getByRole('button', { name: 'Prompt Up to Date' });
    expect(update).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Copy AI Prompt' }));

    expect(writeText).toHaveBeenCalledWith('Generate a quiz');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Prompt copied');
  });

  it('lists every problem with the options, one per line', () => {
    render(
      <CompiledPromptBox
        {...props}
        prompt={null}
        isStale
        errors={[
          'Choose between 1 and 50 questions.',
          'Select at least one question type.',
        ]}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose between 1 and 50 questions.',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select at least one question type.',
    );
    expect(
      screen.getByRole('button', { name: 'Update Prompt' }),
    ).toBeDisabled();
  });

  it('locks Update Prompt and shows the reason when the options are invalid', () => {
    render(
      <CompiledPromptBox
        {...props}
        prompt={null}
        isStale
        errors={['Select at least one question type.']}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Update Prompt' }),
    ).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Select at least one question type.',
    );
    expect(screen.getByRole('button', { name: 'Copy Locked' })).toBeDisabled();
  });
});
