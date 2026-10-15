// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadyTests } from './ReadyTests';
import { buildReadyTest } from '../../utils/readyTests';

const question = {
  type: 'mcq',
  prompt: 'Pick one',
  options: [
    { id: 'a', text: 'One' },
    { id: 'b', text: 'Two' },
  ],
  correctAnswer: 'a',
};
const devops = buildReadyTest('devops', {
  title: 'DevOps',
  questions: [question, question],
});
const itg = buildReadyTest('itg', { title: 'Java', questions: [question] });

describe('ReadyTests', () => {
  it('shows one card per test with its details', () => {
    render(<ReadyTests tests={[devops, itg]} onStart={() => {}} />);

    const section = screen.getByRole('region', { name: 'Ready tests' });
    const cards = within(section).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(
      within(cards[0]).getByRole('heading', { name: 'DevOps Quiz' }),
    ).toBeInTheDocument();
    expect(cards[0]).toHaveTextContent(
      '2 multiple choice · 15 min · paginated · proctored',
    );
    expect(cards[1]).toHaveTextContent(
      '1 multiple choice · 60 min · one page · proctored',
    );
  });

  it('starts the quiz of the card that was clicked', async () => {
    const onStart = vi.fn();
    render(<ReadyTests tests={[devops, itg]} onStart={onStart} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Start test: Java MCQ' }),
    );

    expect(onStart).toHaveBeenCalledWith(itg);
  });

  it('shows nothing when there is no ready test', () => {
    const { container } = render(<ReadyTests tests={[]} onStart={() => {}} />);

    expect(container).toBeEmptyDOMElement();
  });
});
