import { Check } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { isAnswered, type Answer } from '../../utils/answers';

export interface QuestionNavigatorProps {
  questions: Question[];
  currentPage: number;
  answers: Record<string, Answer | undefined>;
  flagged: Record<string, boolean>;
  onSelect: (question: Question) => void;
}

function tileLabel(question: Question, answered: boolean, flagged: boolean) {
  return [
    `Question ${question.number}`,
    answered && 'answered',
    flagged && 'flagged',
  ]
    .filter(Boolean)
    .join(', ');
}

export function QuestionNavigator({
  questions,
  currentPage,
  answers,
  flagged,
  onSelect,
}: QuestionNavigatorProps) {
  const pages = [...new Set(questions.map((q) => q.page))].sort(
    (a, b) => a - b,
  );

  return (
    <nav
      aria-label="Questions"
      className="w-56 flex-shrink-0 space-y-5 bg-white px-4 pt-6"
    >
      {pages.map((page) => (
        <section key={page} className="space-y-2">
          <h3 className="text-base font-bold text-gray-900">Page {page}</h3>
          <ul className="flex flex-wrap gap-3">
            {questions
              .filter((q) => q.page === page)
              .map((question) => {
                const answered = isAnswered(answers[question.id]);
                const isFlagged = !!flagged[question.id];
                const isCurrent = question.page === currentPage;
                return (
                  <li key={question.id}>
                    <button
                      type="button"
                      aria-label={tileLabel(question, answered, isFlagged)}
                      aria-current={isCurrent ? 'true' : undefined}
                      onClick={() => onSelect(question)}
                      className={`flex h-16 w-11 flex-col items-center justify-between overflow-hidden rounded-lg border hover:border-[#006fbf] ${
                        isCurrent
                          ? 'border-2 border-gray-900'
                          : 'border-gray-300'
                      } ${answered ? 'bg-[#dbeefe]' : 'bg-white'}`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-9 w-full items-center justify-center pb-1 text-sm font-bold ${
                          isFlagged
                            ? 'bg-[#006fbf] text-white [clip-path:polygon(0_0,100%_0,100%_75%,50%_100%,0_75%)]'
                            : 'text-[#006fbf]'
                        }`}
                      >
                        {question.number}
                      </span>
                      <span
                        aria-hidden="true"
                        className="flex h-6 items-center pb-1.5 text-xs text-gray-700"
                      >
                        {answered ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="font-mono text-gray-500">--</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
