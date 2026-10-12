// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompiledPromptBox } from './CompiledPromptBox';

describe('CompiledPromptBox', () => {
  it('shows the prompt and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CompiledPromptBox prompt="Generate a quiz" error={null} />);

    expect(screen.getByText('Generate a quiz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy prompt' }));

    expect(writeText).toHaveBeenCalledWith('Generate a quiz');
    expect(screen.getByRole('status')).toHaveTextContent('Copied');
  });

  it('locks the prompt and says why when the options are invalid', () => {
    render(
      <CompiledPromptBox
        prompt="Generate a quiz"
        error="Select at least one question type."
      />,
    );

    expect(screen.getByRole('button', { name: 'Copy prompt' })).toBeDisabled();
    expect(
      screen.getByText('Select at least one question type.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Generate a quiz')).toBeNull();
  });
});
