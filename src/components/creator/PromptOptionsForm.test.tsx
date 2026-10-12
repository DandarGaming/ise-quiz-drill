// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptOptionsForm } from './PromptOptionsForm';
import {
  defaultPromptOptions,
  type PromptOptions,
} from '../../utils/promptBuilder';

function Harness({
  onChange = () => {},
}: {
  onChange?: (o: PromptOptions) => void;
}) {
  const [value, setValue] = useState(defaultPromptOptions);
  return (
    <PromptOptionsForm
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('PromptOptionsForm', () => {
  it('edits the title, question count and time limit through labelled fields', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.type(
      screen.getByLabelText('Test title (optional)'),
      'Midterm',
    );
    const count = screen.getByLabelText('Number of questions');
    await userEvent.clear(count);
    await userEvent.type(count, '20');

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ title: 'Midterm', questionCount: 20 }),
    );
    expect(screen.getByLabelText('Time limit (minutes)')).toHaveValue(15);
  });

  it('picks the difficulty from a radio group and shows the mix for custom', async () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Difficulty' });
    expect(within(group).getByRole('radio', { name: 'Auto' })).toBeChecked();
    expect(screen.queryByLabelText('Easy %')).toBeNull();

    await userEvent.click(
      within(group).getByRole('radio', { name: 'Custom mix' }),
    );

    expect(screen.getByLabelText('Easy %')).toHaveValue(30);
  });

  it('flags a custom mix that does not add up to 100%', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('radio', { name: 'Custom mix' }));

    const hard = screen.getByLabelText('Hard %');
    await userEvent.clear(hard);
    await userEvent.type(hard, '10');

    expect(hard).toHaveAttribute('aria-invalid', 'true');
    expect(hard).toHaveAccessibleDescription(
      'The difficulty mix must add up to 100% (now 90%).',
    );
  });

  it('toggles question types with checkboxes', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const group = screen.getByRole('group', { name: 'Question types' });

    await userEvent.click(
      within(group).getByRole('checkbox', { name: 'True / false' }),
    );

    expect(onChange.mock.lastCall?.[0].types).not.toContain('true-false');
  });

  it('turns on proctoring options', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Enable proctoring' }),
    );

    expect(onChange.mock.lastCall?.[0].antiCheat.enabled).toBe(true);
    expect(
      screen.getByRole('checkbox', { name: 'Lock to this tab' }),
    ).toBeEnabled();
  });
});
