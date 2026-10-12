import { useMemo, useState } from 'react';
import type { QuizConfig } from '../../types/quiz';
import {
  buildPrompt,
  defaultPromptOptions,
  validatePromptOptions,
} from '../../utils/promptBuilder';
import type { ImportSettings } from '../../utils/quizSchema';
import { CompiledPromptBox } from './CompiledPromptBox';
import { JsonImporter } from './JsonImporter';
import { PromptOptionsForm } from './PromptOptionsForm';

export interface MockTestCreatorProps {
  onStart: (quiz: QuizConfig) => void;
}

export function MockTestCreator({ onStart }: MockTestCreatorProps) {
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

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a mock test</h1>
        <p className="text-gray-600">
          Choose the options, copy the prompt into an AI chat with your notes,
          then paste its JSON answer below.
        </p>
      </div>
      <PromptOptionsForm value={options} onChange={setOptions} />
      <CompiledPromptBox
        prompt={prompt}
        error={validatePromptOptions(options)}
      />
      <JsonImporter settings={settings} onStart={onStart} />
    </div>
  );
}
