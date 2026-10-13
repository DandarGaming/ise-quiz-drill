import React, { useMemo, useState } from 'react';
import { MessageSquareText, Settings } from 'lucide-react';
import type { QuizConfig } from '../../types/quiz';
import {
  buildPrompt,
  defaultPromptOptions,
  defaultTestConfig,
  validatePromptOptions,
  validateTestConfig,
} from '../../utils/promptBuilder';
import type { ImportSettings } from '../../utils/quizSchema';
import { CompiledPromptBox } from './CompiledPromptBox';
import { JsonImporter } from './JsonImporter';
import { PromptOptionsForm } from './PromptOptionsForm';
import { TestConfigForm } from './TestConfigForm';

export interface MockTestCreatorProps {
  onStart: (quiz: QuizConfig) => void;
}

const card =
  'bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6';

export const MockTestCreator: React.FC<MockTestCreatorProps> = ({
  onStart,
}) => {
  const [config, setConfig] = useState(defaultTestConfig);
  const [options, setOptions] = useState(defaultPromptOptions);
  // One id per creator session, so the prompt text stays the same
  const [quizId] = useState(() => `quiz-${Date.now()}`);
  // The prompt is only rebuilt on request; `key` tells which options it used
  const [built, setBuilt] = useState<{ key: string; prompt: string } | null>(
    null,
  );

  const optionsKey = JSON.stringify(options);
  const optionsError = validatePromptOptions(options);
  const isStale = built?.key !== optionsKey;

  const handleUpdate = () => {
    if (optionsError) return;
    setBuilt({ key: optionsKey, prompt: buildPrompt(options, quizId) });
  };

  const settings = useMemo<ImportSettings>(
    () => ({
      title: config.title,
      fallbackId: quizId,
      timeLimitMinutes: config.timeLimitMinutes,
      templateMode: config.templateMode,
      antiCheat: config.antiCheat,
    }),
    [config, quizId],
  );

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

      <section aria-labelledby="test-config-title" className={card}>
        <div className="border-b border-gray-100 pb-4">
          <h2
            id="test-config-title"
            className="text-xl font-bold text-gray-900 flex items-center gap-2"
          >
            <Settings
              aria-hidden="true"
              className="w-5 h-5 flex-shrink-0 text-[#006fbf]"
            />
            Test Configuration
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Settings the app applies to the quiz. They are not sent to the AI.
          </p>
        </div>
        <TestConfigForm value={config} onChange={setConfig} />
      </section>

      <section aria-labelledby="ai-section-title" className={card}>
        <div className="border-b border-gray-100 pb-4">
          <h2
            id="ai-section-title"
            className="text-xl font-bold text-gray-900 flex items-center gap-2"
          >
            <MessageSquareText
              aria-hidden="true"
              className="w-5 h-5 flex-shrink-0 text-[#006fbf]"
            />
            AI Prompt & Output
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Describe the questions, build the prompt, then paste what the AI
            returns.
          </p>
        </div>

        <PromptOptionsForm value={options} onChange={setOptions} />

        <CompiledPromptBox
          prompt={built?.prompt ?? null}
          isStale={isStale}
          error={optionsError}
          onUpdate={handleUpdate}
        />

        <div className="border-t border-gray-100 pt-6">
          <JsonImporter
            settings={settings}
            onStart={onStart}
            blockedReason={validateTestConfig(config)}
          />
        </div>
      </section>
    </div>
  );
};
