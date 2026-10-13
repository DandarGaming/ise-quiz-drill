// @vitest-environment jsdom
import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionRenderer } from './QuestionRenderer';
import type { Question } from '../../types/quiz';

const base = { page: 1, points: 1 } as const;

const mcq: Question = {
  ...base,
  id: 'q1',
  number: 1,
  type: 'mcq',
  prompt: 'Which command creates a branch?',
  options: [
    { id: 'a', text: 'git branch' },
    { id: 'b', text: 'git merge' },
  ],
  correctAnswer: 'a',
};

const multiSelect: Question = {
  ...base,
  id: 'q2',
  number: 2,
  points: 2,
  type: 'multi-select',
  prompt: 'Which are AWS services?',
  options: [
    { id: 'a', text: 'S3' },
    { id: 'b', text: 'Vercel' },
    { id: 'c', text: 'CloudFront' },
  ],
  correctAnswer: ['a', 'c'],
};

const trueFalse: Question = {
  ...base,
  id: 'q3',
  number: 3,
  type: 'true-false',
  prompt: 'Git is a distributed VCS.',
  options: [
    { id: 'true', text: 'True' },
    { id: 'false', text: 'False' },
  ],
  correctAnswer: 'true',
};

const shortAnswer: Question = {
  ...base,
  id: 'q4',
  number: 4,
  type: 'short-answer',
  prompt: 'Name the AWS object storage service.',
  correctAnswer: 'S3',
};

const blanks: Question = {
  ...base,
  id: 'q5',
  number: 5,
  type: 'multi-blank',
  prompt: 'CI stands for [BLANK] [BLANK].',
  correctAnswer: ['Continuous', 'Integration'],
};

function Harness({
  question,
  initial,
  flagged = false,
  onChange = () => {},
  onToggleFlag = () => {},
}: {
  question: Question;
  initial?: string | string[];
  flagged?: boolean;
  onChange?: (answer: string | string[]) => void;
  onToggleFlag?: () => void;
}) {
  const [answer, setAnswer] = useState(initial);
  return (
    <QuestionRenderer
      question={question}
      answer={answer}
      isFlagged={flagged}
      onAnswerChange={(next) => {
        setAnswer(next);
        onChange(next);
      }}
      onToggleFlag={onToggleFlag}
    />
  );
}

describe('QuestionRenderer', () => {
  it('shows the question number in the header', () => {
    render(<Harness question={multiSelect} />);
    expect(
      screen.getByRole('heading', { name: 'Question 2' }),
    ).toBeInTheDocument();
  });

  it('renders MCQ options as labelled radio buttons in one group', async () => {
    const onChange = vi.fn();
    render(<Harness question={mcq} onChange={onChange} />);

    const group = screen.getByRole('group', { name: /Question 1/ });
    expect(within(group).getAllByRole('radio')).toHaveLength(2);

    await userEvent.click(screen.getByRole('radio', { name: 'git branch' }));

    expect(onChange).toHaveBeenLastCalledWith('a');
    expect(screen.getByRole('radio', { name: 'git branch' })).toBeChecked();
  });

  // The input is visually hidden (absolute). Without a positioned label around
  // it, its box sits wherever the long scroll-mode page puts it, and focusing
  // it scrolls the fixed, overflow-hidden quiz frame out of view (blank page).
  it('keeps the hidden input inside its label so focusing it cannot scroll the page', () => {
    render(<Harness question={mcq} />);
    const input = screen.getAllByRole('radio')[0];
    expect(input.closest('label')?.className).toContain('relative');
  });

  it('renders true/false as radio buttons', () => {
    render(<Harness question={trueFalse} />);
    expect(screen.getByRole('radio', { name: 'True' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'False' })).toBeInTheDocument();
  });

  it('toggles multiple select answers with checkboxes', async () => {
    const onChange = vi.fn();
    render(<Harness question={multiSelect} onChange={onChange} />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'S3' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'CloudFront' }));
    expect(onChange).toHaveBeenLastCalledWith(['a', 'c']);

    await userEvent.click(screen.getByRole('checkbox', { name: 'S3' }));
    expect(onChange).toHaveBeenLastCalledWith(['c']);
  });

  it('can be answered with the keyboard', async () => {
    const onChange = vi.fn();
    render(<Harness question={multiSelect} onChange={onChange} />);

    await userEvent.tab(); // flag button
    await userEvent.tab(); // first option
    await userEvent.keyboard(' ');

    expect(onChange).toHaveBeenLastCalledWith(['a']);
  });

  it('saves short answers as plain text', async () => {
    const onChange = vi.fn();
    render(<Harness question={shortAnswer} onChange={onChange} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Answer' }), 'S3');

    expect(onChange).toHaveBeenLastCalledWith('S3');
  });

  it('renders one input per blank and keeps the answer order', async () => {
    const onChange = vi.fn();
    render(<Harness question={blanks} onChange={onChange} />);

    expect(screen.getAllByRole('textbox')).toHaveLength(2);
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Blank 2' }),
      'Integration',
    );

    expect(onChange).toHaveBeenLastCalledWith(['', 'Integration']);
  });

  it('shows Saved only once the question is answered', async () => {
    render(<Harness question={mcq} />);
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'git merge' }));

    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('exposes the flag state and reports toggles', async () => {
    const onToggleFlag = vi.fn();
    render(<Harness question={mcq} flagged onToggleFlag={onToggleFlag} />);

    const flag = screen.getByRole('button', { name: 'Flag question' });
    expect(flag).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(flag);
    expect(onToggleFlag).toHaveBeenCalledOnce();
  });

  it('clears a selected option when it is struck out', async () => {
    const onChange = vi.fn();
    render(<Harness question={mcq} initial="a" onChange={onChange} />);

    const strike = screen.getByRole('button', {
      name: 'Strike out git branch',
    });
    await userEvent.click(strike);

    expect(onChange).toHaveBeenLastCalledWith('');
    expect(strike).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('radio', { name: 'git branch' })).not.toBeChecked();
  });

  it('removes the strike when a struck option is selected again', async () => {
    render(<Harness question={mcq} />);

    const strike = screen.getByRole('button', {
      name: 'Strike out git merge',
    });
    await userEvent.click(strike);
    await userEvent.click(screen.getByRole('radio', { name: 'git merge' }));

    expect(strike).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows a code snippet with line numbers', () => {
    render(
      <Harness
        question={{ ...mcq, codeSnippet: 'const a = 1;\nconst b = 2;' }}
      />,
    );
    const code = screen.getByRole('figure', { name: 'Code snippet' });
    expect(code).toHaveTextContent('const b = 2;');
    expect(within(code).getByText('2')).toBeInTheDocument();
  });

  it('shows the code in one white colour, without syntax highlighting', () => {
    render(
      <Harness
        question={{
          ...mcq,
          codeSnippet: 'public class Test {\n  String s = "x"; // note\n}',
        }}
      />,
    );
    const code = screen.getByRole('figure', { name: 'Code snippet' });

    expect(code).toHaveTextContent('String s = "x"; // note');
    expect(code.querySelector('span')).toBeNull();
    expect(code.querySelector('.text-white')).not.toBeNull();
  });

  describe('review mode', () => {
    // The check mark only appears next to some options. Every option
    // reserves the same space for them, so the radios and texts line up.
    it('marks the correct answer with a check mark and no arrow', () => {
      const { container } = render(
        <QuestionRenderer
          question={mcq}
          answer="b"
          isFlagged={false}
          onAnswerChange={() => {}}
          onToggleFlag={() => {}}
          reviewMode
        />,
      );

      expect(
        container.querySelector('[title="Correct Answer"]'),
      ).not.toBeNull();
      expect(container.querySelector('.lucide-arrow-right')).toBeNull();
    });

    it('reserves the same marker width on every option in review mode', () => {
      const { container } = render(
        <QuestionRenderer
          question={mcq}
          answer="b"
          isFlagged={false}
          onAnswerChange={() => {}}
          onToggleFlag={() => {}}
          reviewMode
        />,
      );

      const slots = container.querySelectorAll('[data-review-marker]');
      expect(slots).toHaveLength(mcq.options!.length);
      for (const slot of slots) expect(slot).toHaveClass('w-5');
    });

    const review = (question: Question, answer?: string | string[]) =>
      render(
        <QuestionRenderer
          question={question}
          answer={answer}
          isFlagged={false}
          onAnswerChange={() => {}}
          onToggleFlag={() => {}}
          reviewMode
        />,
      );

    it('shows the points earned and hides the flag and strike buttons', () => {
      review(multiSelect, ['a']);
      expect(screen.getByText('0 / 2 point')).toBeInTheDocument();
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('marks the correct options and the wrong choices for screen readers too', () => {
      review(multiSelect, ['a', 'b']);
      expect(
        screen.getByRole('checkbox', { name: /S3 Your answer, correct/ }),
      ).toBeDisabled();
      expect(
        screen.getByRole('checkbox', { name: /Vercel Your answer, incorrect/ }),
      ).toBeChecked();
      expect(
        screen.getByRole('checkbox', { name: /CloudFront Correct answer/ }),
      ).not.toBeChecked();
    });

    it('shows the accepted answers for text questions', () => {
      review({ ...shortAnswer, correctAnswer: ['S3', 'Amazon S3'] }, 'EBS');
      expect(screen.getByText('S3 or Amazon S3')).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: 'Answer' })).toHaveValue(
        'EBS',
      );
    });

    it('lists the correct answer for each blank', () => {
      review(blanks, ['Continuous', 'Delivery']);
      expect(screen.getByText('Integration')).toBeInTheDocument();
    });

    it('shows the explanation', () => {
      review({ ...mcq, explanation: 'git branch creates a branch.' }, 'a');
      expect(
        screen.getByText('git branch creates a branch.'),
      ).toBeInTheDocument();
    });
  });
});
