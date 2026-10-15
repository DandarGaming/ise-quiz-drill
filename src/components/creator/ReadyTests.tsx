import React from 'react';
import { describeReadyTest, type ReadyTest } from '../../utils/readyTests';

export interface ReadyTestsProps {
  tests: ReadyTest[];
  onStart: (test: ReadyTest) => void;
}

// Built-in tests shown above the creator, so a visitor can start one at once
export const ReadyTests: React.FC<ReadyTestsProps> = ({ tests, onStart }) => {
  if (tests.length === 0) return null;

  return (
    <section aria-labelledby="ready-tests-title" className="space-y-2">
      <h2
        id="ready-tests-title"
        className="text-xs font-bold uppercase tracking-wider text-gray-700"
      >
        Ready tests
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {tests.map((test) => (
          <article
            key={test.id}
            aria-labelledby={`ready-${test.id}-title`}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3"
          >
            <div>
              <h3
                id={`ready-${test.id}-title`}
                className="text-lg font-bold text-gray-900"
              >
                {test.quiz.title}
              </h3>
              <p className="text-sm text-gray-600">{describeReadyTest(test)}</p>
            </div>
            <button
              type="button"
              onClick={() => onStart(test)}
              aria-label={`Start test: ${test.quiz.title}`}
              className="self-start px-5 py-2 rounded-lg font-bold text-sm bg-[#006fbf] hover:bg-[#005694] text-white cursor-pointer"
            >
              Start test
            </button>
          </article>
        ))}
      </div>
    </section>
  );
};
