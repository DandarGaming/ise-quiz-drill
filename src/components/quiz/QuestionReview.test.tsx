// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QuestionReview } from './QuestionReview';
import { gradeQuestion } from '../../utils/grading';
import type { Question } from '../../types/quiz';

const multi: Question = {
  id: 'q2',
  number: 2,
  page: 1,
  type: 'multi-select',
  points: 2,
  prompt: 'Which are AWS services?',
  options: [
    { id: 'a', text: 'S3' },
    { id: 'b', text: 'Vercel' },
    { id: 'c', text: 'CloudFront' },
  ],
  correctAnswer: ['a', 'c'],
  explanation: 'Vercel is a separate hosting company.',
};

const short: Question = {
  id: 'q4',
  number: 4,
  page: 1,
  type: 'short-answer',
  points: 1,
  prompt: 'Which service stores the files?',
  correctAnswer: ['S3', 'Amazon S3'],
};

const blanks: Question = {
  id: 'q5',
  number: 5,
  page: 1,
  type: 'multi-blank',
  points: 1,
  prompt: 'CI stands for [BLANK] [BLANK].',
  correctAnswer: ['Continuous', 'Integration'],
};

const review = (question: Question, answer?: string | string[]) =>
  render(
    <QuestionReview
      question={question}
      result={gradeQuestion(question, answer)}
    />,
  );

describe('QuestionReview', () => {
  it('shows the points earned in the heading', () => {
    review(multi, ['a']);
    expect(
      screen.getByRole('heading', { name: 'Question 2: 0 / 2 points' }),
    ).toBeInTheDocument();
  });

  it('marks the correct options and the wrong choices', () => {
    review(multi, ['a', 'b']);
    const options = screen.getAllByRole('listitem');

    expect(options[0]).toHaveTextContent('S3 Your answer, correct');
    expect(options[1]).toHaveTextContent('Vercel Your answer, incorrect');
    expect(options[2]).toHaveTextContent('CloudFront Correct answer');
  });

  it('shows the given and accepted text answers', () => {
    review(short, 'EBS');
    const answer = screen.getByRole('group', { name: 'Answer' });

    expect(answer).toHaveTextContent('Your answer: EBS');
    expect(answer).toHaveTextContent('Correct answer: S3 or Amazon S3');
  });

  it('says when a question was not answered', () => {
    review(short, undefined);
    expect(screen.getByRole('group', { name: 'Answer' })).toHaveTextContent(
      'Your answer: (no answer)',
    );
  });

  it('compares each blank', () => {
    review(blanks, ['continuous', 'Delivery']);
    const rows = within(screen.getByRole('table')).getAllByRole('row');

    expect(rows[1]).toHaveTextContent('1continuousContinuous');
    expect(rows[2]).toHaveTextContent('2DeliveryIntegration');
  });

  it('shows the explanation', () => {
    review(multi, ['a', 'c']);
    expect(
      screen.getByText(/Vercel is a separate hosting company/),
    ).toBeInTheDocument();
  });
});
