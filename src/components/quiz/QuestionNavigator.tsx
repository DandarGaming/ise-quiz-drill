import React, { useEffect, useRef } from 'react';
import type { Question } from '../../types/quiz';
import { isAnswered, type Answer } from '../../utils/answers';
import { StraightCheck } from './QuestionRenderer';

export interface QuestionNavigatorProps {
  questions: Question[];
  currentPage: number;
  answers: Record<string, Answer | undefined>;
  flagged: Record<string, boolean>;
  onSelect: (question: Question) => void;
  // Called with the wheel movement when the list has nothing left to scroll,
  // so the quiz next to it keeps scrolling while the pointer is over this list
  onWheelOverflow?: (deltaY: number) => void;
}

const tileLabel = (question: Question, answered: boolean, flagged: boolean) =>
  [`Question ${question.number}`, answered && 'answered', flagged && 'flagged']
    .filter(Boolean)
    .join(', ');

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  currentPage,
  answers,
  flagged,
  onSelect,
  onWheelOverflow,
}) => {
  const navRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef(onWheelOverflow);
  useEffect(() => {
    wheelRef.current = onWheelOverflow;
  });

  // The list takes the part of the wheel movement it can scroll; the rest
  // goes to the quiz. A native listener is needed to cancel the default
  // scroll, which React's passive wheel handler cannot do.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const onWheel = (e: WheelEvent) => {
      const list = listRef.current;
      if (!list || !wheelRef.current) return;
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      const max = list.scrollHeight - list.clientHeight;
      const next = Math.min(max, Math.max(0, list.scrollTop + delta));
      const used = next - list.scrollTop;
      list.scrollTop = next;
      if (delta !== used) wheelRef.current(delta - used);
    };
    nav.addEventListener('wheel', onWheel, { passive: false });
    return () => nav.removeEventListener('wheel', onWheel);
  }, []);

  const pages = Array.from(new Set(questions.map((q) => q.page))).sort(
    (a, b) => a - b,
  );

  return (
    <nav
      aria-label="Questions"
      ref={navRef}
      className="w-56 bg-white pt-6 px-4 pb-20 flex flex-col h-full overflow-hidden select-none flex-shrink-0 border-r border-gray-200"
    >
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto space-y-5 pr-2 custom-scrollbar"
      >
        {pages.map((pageNo) => (
          <div key={pageNo} className="space-y-2">
            <h3 className="text-base font-bold text-gray-900">
              Page {pageNo}:
            </h3>

            <div className="flex flex-wrap gap-3">
              {questions
                .filter((q) => q.page === pageNo)
                .map((q) => {
                  const answered = isAnswered(answers[q.id]);
                  const isFlagged = !!flagged[q.id];

                  return (
                    <button
                      type="button"
                      key={q.id}
                      onClick={() => onSelect(q)}
                      aria-label={tileLabel(q, answered, isFlagged)}
                      aria-current={q.page === currentPage ? 'true' : undefined}
                      className="relative w-11 h-16 bg-white border border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-[#006fbf] transition-all flex flex-col justify-between items-center shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006fbf]"
                    >
                      {/* Top box, fixed size so flagging causes no layout shift */}
                      <div className="w-full h-9 relative flex items-center justify-center font-bold text-sm leading-none">
                        {isFlagged && (
                          <div
                            className="absolute inset-0 bg-[#006fbf]"
                            style={{
                              clipPath:
                                'polygon(0 0, 100% 0, 100% 75%, 50% 100%, 0 75%)',
                            }}
                          />
                        )}
                        <span
                          className={`relative z-10 pb-1 ${
                            isFlagged
                              ? 'text-white font-bold'
                              : 'text-[#006fbf] font-bold'
                          }`}
                        >
                          {q.number}
                        </span>
                      </div>

                      {/* Bottom box: check when answered, dashes otherwise */}
                      <div className="w-full h-6 pb-1.5 flex items-center justify-center text-xs text-gray-700 leading-none">
                        {answered ? (
                          <StraightCheck className="w-3.5 h-3.5 text-gray-700" />
                        ) : (
                          <span className="font-mono text-gray-500">--</span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};
