import { useState } from 'react';
import { Library, Play, PlusCircle } from 'lucide-react';
import type { QuizAttemptRecord, QuizConfig } from '../../types/quiz';
import { saveQuiz } from '../../utils/attemptStorage';
import { browserStorage, safely } from '../../utils/browserStorage';
import { sampleQuiz } from '../../data/sampleQuiz';
import { MockTestCreator } from '../creator/MockTestCreator';
import { QuizHistory } from '../history/QuizHistory';
import { QuizSimulator } from '../quiz/QuizSimulator';
import { ResultsReview } from '../quiz/ResultsReview';

type View =
  | { name: 'creator' }
  | { name: 'library' }
  | { name: 'quiz'; quiz: QuizConfig }
  | { name: 'review'; record: QuizAttemptRecord };

const navButton = (active: boolean) =>
  `flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-bold ${
    active
      ? 'bg-[#006fbf] text-white'
      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
  }`;

export function AppContainer() {
  const [view, setView] = useState<View>({ name: 'creator' });
  const storage = browserStorage();

  const start = (quiz: QuizConfig) => setView({ name: 'quiz', quiz });
  const startFromCreator = (quiz: QuizConfig) => {
    if (storage) safely(() => saveQuiz(storage, quiz));
    start(quiz);
  };
  const toLibrary = () => setView({ name: 'library' });

  // Taking a quiz uses the whole screen, without the app navigation
  if (view.name === 'quiz') {
    return (
      <QuizSimulator key={view.quiz.id} quiz={view.quiz} onExit={toLibrary} />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f8fafc]">
      <header className="sticky top-0 z-40 bg-[#1e293b] px-6 py-3 text-white">
        <nav aria-label="Main" className="flex flex-wrap items-center gap-6">
          <span className="text-lg font-bold tracking-tight">Quiz Drill</span>
          <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 p-1">
            <button
              type="button"
              aria-current={view.name === 'creator' ? 'page' : undefined}
              onClick={() => setView({ name: 'creator' })}
              className={navButton(view.name === 'creator')}
            >
              <PlusCircle aria-hidden="true" className="h-4 w-4" /> Create test
            </button>
            <button
              type="button"
              aria-current={view.name === 'library' ? 'page' : undefined}
              onClick={toLibrary}
              className={navButton(view.name === 'library')}
            >
              <Library aria-hidden="true" className="h-4 w-4" /> Library
            </button>
            <button
              type="button"
              onClick={() => start(sampleQuiz)}
              className={navButton(false)}
            >
              <Play aria-hidden="true" className="h-4 w-4" /> Try a sample
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {view.name === 'creator' && (
          <MockTestCreator onStart={startFromCreator} />
        )}
        {view.name === 'library' && (
          <QuizHistory
            onStart={start}
            onCreate={() => setView({ name: 'creator' })}
            onReview={(record) => setView({ name: 'review', record })}
          />
        )}
        {view.name === 'review' && (
          <ResultsReview
            quiz={view.record.quizSnapshot}
            answers={view.record.answers}
            timeTakenSeconds={view.record.timeTakenSeconds}
            eventLog={view.record.eventLog}
            onRetake={() => start(view.record.quizSnapshot)}
            onExit={toLibrary}
          />
        )}
      </main>
    </div>
  );
}
