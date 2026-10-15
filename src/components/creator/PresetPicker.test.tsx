// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PresetPicker } from './PresetPicker';
import type { Preset } from '../../utils/presets';

// The picker works on any value; a small one keeps these tests readable
interface Value {
  count: number;
}

const base = {
  title: null,
  timeLimitMinutes: null,
  templateMode: null,
  antiCheat: {
    enabled: null,
    tabLock: null,
    uiRestrictions: null,
    fullscreenLock: null,
  },
};
const promptBase = {
  questionCount: null,
  difficulty: null,
  mix: null,
  types: null,
  topics: null,
  notes: null,
};
const presets: Preset[] = [
  { id: 'one', name: 'One', prompt: promptBase, config: base },
  { id: 'two', name: 'Two', prompt: promptBase, config: base },
];
const counts: Record<string, number> = { one: 10, two: 20 };

const noop = () => {};
function Harness({ initial = { count: 0 } as Value, onChange = noop }) {
  const [value, setValue] = useState<Value>(initial);
  return (
    <div>
      <PresetPicker<Value>
        scope="the prompt options"
        presets={presets}
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange();
        }}
        applyPreset={(preset) => ({ count: counts[preset.id] })}
        reset={() => ({ count: 0 })}
        describe={(preset) => `${preset.name} has ${counts[preset.id]}`}
      />
      <button
        type="button"
        onClick={() => setValue({ count: value.count + 1 })}
      >
        Edit by hand
      </button>
      <span role="note" aria-label="count">
        {value.count}
      </span>
    </div>
  );
}

const select = () => screen.getByLabelText('Exam preset (optional)');
const apply = () => screen.getByRole('button', { name: 'Apply preset' });
const count = () => screen.getByLabelText('count');

describe('PresetPicker', () => {
  it('keeps Apply locked until a preset is chosen, then previews it', async () => {
    render(<Harness />);
    expect(apply()).toBeDisabled();

    await userEvent.selectOptions(select(), 'one');

    expect(apply()).toBeEnabled();
    expect(screen.getByText('One has 10')).toBeInTheDocument();
    expect(count()).toHaveTextContent('0');
  });

  it('changes nothing until Apply is pressed', async () => {
    render(<Harness />);
    await userEvent.selectOptions(select(), 'two');
    expect(count()).toHaveTextContent('0');
  });

  it('applies at once when nothing was edited and says so', async () => {
    render(<Harness />);
    await userEvent.selectOptions(select(), 'one');
    await userEvent.click(apply());

    expect(count()).toHaveTextContent('10');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Applied One to the prompt options.',
    );
    expect(screen.queryByRole('button', { name: 'Replace' })).toBeNull();
  });

  it('applies another preset at once while the values are still a preset', async () => {
    render(<Harness />);
    await userEvent.selectOptions(select(), 'one');
    await userEvent.click(apply());
    await userEvent.selectOptions(select(), 'two');
    await userEvent.click(apply());

    expect(count()).toHaveTextContent('20');
    expect(screen.queryByRole('button', { name: 'Replace' })).toBeNull();
  });

  it('asks before replacing a hand edit, and Cancel keeps it', async () => {
    render(<Harness />);
    await userEvent.selectOptions(select(), 'one');
    await userEvent.click(apply());
    await userEvent.click(screen.getByRole('button', { name: 'Edit by hand' }));

    await userEvent.selectOptions(select(), 'two');
    await userEvent.click(apply());

    expect(screen.getByText('Replace your changes with Two?')).toBeVisible();
    expect(count()).toHaveTextContent('11');

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(count()).toHaveTextContent('11');
    expect(screen.queryByText('Replace your changes with Two?')).toBeNull();
  });

  it('replaces the hand edit after Replace', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit by hand' }));
    await userEvent.selectOptions(select(), 'two');
    await userEvent.click(apply());
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));

    expect(count()).toHaveTextContent('20');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Applied Two to the prompt options.',
    );
  });

  it('resets at once when nothing was edited', async () => {
    render(<Harness />);
    await userEvent.selectOptions(select(), 'one');
    await userEvent.click(apply());
    await userEvent.click(
      screen.getByRole('button', { name: 'Reset to defaults' }),
    );

    expect(count()).toHaveTextContent('0');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Reset the prompt options to the app defaults.',
    );
  });

  it('asks before resetting a hand edit', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit by hand' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Reset to defaults' }),
    );

    expect(
      screen.getByText('Reset the prompt options and lose your changes?'),
    ).toBeVisible();
    expect(count()).toHaveTextContent('1');

    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(count()).toHaveTextContent('0');
  });

  it('puts the keyboard focus on the confirm button when it opens', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit by hand' }));
    await userEvent.selectOptions(select(), 'two');
    await userEvent.click(apply());

    expect(screen.getByRole('button', { name: 'Replace' })).toHaveFocus();
  });
});
