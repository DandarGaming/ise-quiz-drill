// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompiledPromptBox } from './CompiledPromptBox';

const props = {
  prompt: 'Generate a quiz',
  isNoTypeSelected: false,
  totalCustomPct: 100,
  isPctInvalid: false,
};

describe('CompiledPromptBox', () => {
  it('shows the prompt and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    render(<CompiledPromptBox {...props} />);

    expect(screen.getByText('Generate a quiz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy AI Prompt' }));

    expect(writeText).toHaveBeenCalledWith('Generate a quiz');
    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Prompt copied');
  });

  it('locks the prompt when no question type is selected', () => {
    render(<CompiledPromptBox {...props} isNoTypeSelected />);

    expect(
      screen.getByRole('button', { name: 'Prompt Locked' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('heading', { name: 'No Question Types Selected' }),
    ).toBeInTheDocument();
  });

  it('locks the prompt and shows the total when the mix is not 100%', () => {
    render(<CompiledPromptBox {...props} isPctInvalid totalCustomPct={90} />);

    expect(
      screen.getByRole('heading', { name: 'Invalid Percentage Allocation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });
});
