import { ArrowRight, Check, X } from 'lucide-react';
import type { Question, QuestionResult } from '../../types/quiz';
import { CodeSnippet } from './QuestionRenderer';

export interface QuestionReviewProps {
  question: Question;
  result: QuestionResult;
}

const asList = (value: string | string[]) =>
  Array.isArray(value) ? value : value === '' ? [] : [value];

const plural = (points: number) => (points === 1 ? 'point' : 'points');

export function QuestionReview({ question, result }: QuestionReviewProps) {
  const given = asList(result.userAnswer);
  const correct = asList(result.correctAnswer);
  const headingId = `${question.id}-review`;

  return (
    <article aria-labelledby={headingId} className="space-y-4">
      <h3
        id={headingId}
        className="flex items-center gap-3 text-lg font-bold text-gray-900"
      >
        <span>Question {question.number}:</span>{' '}
        <span
          className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
            result.isCorrect
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {result.earnedPoints} / {result.maxPoints} {plural(result.maxPoints)}
        </span>
      </h3>

      <p className="whitespace-pre-wrap pl-3 text-lg leading-relaxed text-gray-900">
        {question.type === 'multi-blank'
          ? question.prompt
              .split('[BLANK]')
              .map((part, index, parts) =>
                index < parts.length - 1 ? `${part}(${index + 1})` : part,
              )
              .join('')
          : question.prompt}
      </p>

      {question.codeSnippet && <CodeSnippet code={question.codeSnippet} />}

      {question.options && question.options.length > 0 && (
        <ul className="pl-3">
          {question.options.map((option) => {
            const chosen = given.includes(option.id);
            const isCorrect = correct.includes(option.id);
            const note = chosen
              ? `Your answer, ${isCorrect ? 'correct' : 'incorrect'}`
              : isCorrect
                ? 'Correct answer'
                : '';
            return (
              <li
                key={option.id}
                className={`flex items-center gap-3 px-2.5 py-2.5 ${
                  isCorrect ? 'bg-blue-50' : chosen ? 'bg-red-50' : ''
                }`}
              >
                <span aria-hidden="true" className="flex w-12 justify-end">
                  {isCorrect && (
                    <>
                      <ArrowRight className="h-5 w-5 text-[#006fbf]" />
                      <Check className="h-5 w-5 text-[#006fbf]" />
                    </>
                  )}
                  {chosen && !isCorrect && (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                </span>
                <span className="text-lg text-gray-900">{option.text}</span>{' '}
                {note && (
                  <span className="text-sm font-semibold text-gray-600">
                    {note}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {question.type === 'short-answer' && (
        <div
          role="group"
          aria-label="Answer"
          className="space-y-1 pl-3 text-lg"
        >
          <p>
            <span className="font-semibold text-gray-700">Your answer: </span>
            {given[0] ?? '(no answer)'}
          </p>
          <p>
            <span className="font-semibold text-gray-700">
              Correct answer:{' '}
            </span>
            <span className="font-mono text-blue-700">
              {correct.join(' or ')}
            </span>
          </p>
        </div>
      )}

      {question.type === 'multi-blank' && (
        <table className="ml-3 text-left text-base">
          <thead>
            <tr className="text-gray-600">
              <th className="pr-6 font-semibold">Blank</th>
              <th className="pr-6 font-semibold">Your answer</th>
              <th className="font-semibold">Correct answer</th>
            </tr>
          </thead>
          <tbody>
            {correct.map((expected, index) => (
              <tr key={index}>
                <td className="pr-6">{index + 1}</td>
                <td className="pr-6">{given[index] || '(no answer)'}</td>
                <td className="font-mono text-blue-700">{expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {question.explanation && (
        <p className="ml-3 rounded-md border border-gray-200 bg-gray-50 p-4 text-base text-gray-700">
          <span className="font-bold text-gray-900">Explanation: </span>
          {question.explanation}
        </p>
      )}
    </article>
  );
}
