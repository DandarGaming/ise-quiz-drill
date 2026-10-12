import React, { useMemo, useState } from 'react';
import type { QuizConfig } from '../../types/quiz';
import { buildPrompt, defaultPromptOptions } from '../../utils/promptBuilder';
import type { ImportSettings } from '../../utils/quizSchema';
import { CompiledPromptBox } from './CompiledPromptBox';
import { JsonImporter } from './JsonImporter';
import { PromptOptionsForm } from './PromptOptionsForm';

export interface MockTestCreatorProps {
  onStart: (quiz: QuizConfig) => void;
}

export const MockTestCreator: React.FC<MockTestCreatorProps> = ({
  onStart,
}) => {
  const [options, setOptions] = useState(defaultPromptOptions);
  // One id per creator session, so the prompt text stays the same
  const [quizId] = useState(() => `quiz-${Date.now()}`);

  const prompt = useMemo(() => buildPrompt(options, quizId), [options, quizId]);
  const settings = useMemo<ImportSettings>(
    () => ({
      title: options.title,
      fallbackId: quizId,
      timeLimitMinutes: options.timeLimitMinutes,
      templateMode: options.templateMode,
      antiCheat: options.antiCheat,
    }),
    [options, quizId],
  );

  const { easy, medium, hard } = options.mix;
  const totalCustomPct = easy + medium + hard;

  return (
    <div className="w-full max-w-[1150px] mx-auto p-6 space-y-8 font-sans">
      <div className="border-b border-gray-200 pb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Mock Test Creator
            </h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Customize test options, compile a tailored AI Prompt, or import JSON
            questions directly.
          </p>
        </div>
      </div>

      <PromptOptionsForm value={options} onChange={setOptions} />

      <CompiledPromptBox
        prompt={prompt}
        isNoTypeSelected={options.types.length === 0}
        totalCustomPct={totalCustomPct}
        isPctInvalid={options.difficulty === 'custom' && totalCustomPct !== 100}
      />

      <JsonImporter settings={settings} onStart={onStart} />
    </div>
  );
};
