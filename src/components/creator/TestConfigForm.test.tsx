// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestConfigForm } from './TestConfigForm';
import { defaultTestConfig, type TestConfig } from '../../utils/promptBuilder';

function Harness({
  onChange = () => {},
}: {
  onChange?: (c: TestConfig) => void;
}) {
  const [value, setValue] = useState(defaultTestConfig);
  return (
    <TestConfigForm
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

const last = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.lastCall?.[0] as TestConfig;

describe('TestConfigForm', () => {
  it('lets the title be edited and says it can stay empty', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const title = screen.getByLabelText('Test Title');

    expect(title).not.toBeRequired();
    expect(
      screen.getByText('Leave empty to use the title from the JSON.'),
    ).toBeInTheDocument();

    await userEvent.type(title, 'Midterm');
    expect(last(onChange).title).toBe('Midterm');
  });

  it('shows the title found in the JSON as the default', () => {
    render(
      <TestConfigForm
        value={defaultTestConfig}
        onChange={() => {}}
        titleFallback="DevOps Basics Practice"
      />,
    );

    expect(screen.getByLabelText('Test Title')).toHaveAttribute(
      'placeholder',
      'DevOps Basics Practice',
    );
  });

  it('edits the time limit', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const time = screen.getByLabelText('Time Limit (Minutes)');
    expect(time).toHaveValue(15);

    await userEvent.clear(time);
    await userEvent.type(time, '30');

    expect(last(onChange).timeLimitMinutes).toBe(30);
  });

  it('switches the layout mode', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(
      screen.getByRole('button', { name: 'Paginated (1 Q / Page)' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(
      screen.getByRole('button', { name: 'Scroll Form (All Questions)' }),
    );

    expect(last(onChange).templateMode).toBe('single-page');
  });

  it('shows the proctoring options once anti-cheat is enabled', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    expect(
      screen.queryByRole('checkbox', { name: 'Tab & Focus Lock' }),
    ).toBeNull();

    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Enable Anti-Cheat' }),
    );

    expect(last(onChange).antiCheat.enabled).toBe(true);
    expect(
      screen.getByRole('checkbox', { name: 'Require Fullscreen' }),
    ).toBeChecked();
  });
});
