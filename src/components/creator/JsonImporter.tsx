import { useMemo, useState } from 'react';
import { Copy, Play, Upload } from 'lucide-react';
import type { QuizConfig } from '../../types/quiz';
import { parseQuizJson, type ImportSettings } from '../../utils/quizSchema';
import { sampleQuiz } from '../../data/sampleQuiz';

export interface JsonImporterProps {
  settings: ImportSettings;
  onStart: (quiz: QuizConfig) => void;
}

const fixRequest = (error: string) =>
  `The JSON you generated has a validation error:\n"${error}"\n\nPlease fix it and output the complete, valid JSON again.`;

export function JsonImporter({ settings, onStart }: JsonImporterProps) {
  const [text, setText] = useState('');
  const result = useMemo(
    () => (text.trim() ? parseQuizJson(text, settings) : null),
    [text, settings],
  );
  const error = result && !result.ok ? result.error : null;
  const quiz = result?.ok ? result.quiz : null;

  const upload = async (file: File | undefined) => {
    if (file) setText(await file.text());
  };

  return (
    <section
      aria-labelledby="json-importer-title"
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="json-importer-title"
          className="text-xl font-bold text-gray-900"
        >
          Import the AI's answer
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setText(JSON.stringify(sampleQuiz, null, 2))}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-800 hover:bg-gray-100"
          >
            Load sample
          </button>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-bold text-gray-800 focus-within:ring-2 focus-within:ring-[#006fbf] hover:bg-gray-100">
            <Upload aria-hidden="true" className="h-4 w-4" />
            Upload a .json file
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => upload(e.target.files?.[0])}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="quiz-json"
          className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700"
        >
          Quiz JSON
        </label>
        <textarea
          id="quiz-json"
          rows={10}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'quiz-json-error' : undefined}
          spellCheck={false}
          placeholder='Paste the JSON the AI returned, starting with {"title": ...'
          className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs outline-none focus:ring-2 focus:ring-[#006fbf] aria-[invalid=true]:border-red-500"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
        >
          <p
            id="quiz-json-error"
            className="text-sm font-semibold text-red-800"
          >
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(fixRequest(error))}
            className="flex items-center gap-2 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-bold text-white hover:bg-red-800"
          >
            <Copy aria-hidden="true" className="h-4 w-4" />
            Copy fix request
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-sm font-semibold text-green-800">
          {quiz &&
            `${quiz.title}: ${quiz.questions.length} questions, ${quiz.timeLimitMinutes} minutes`}
        </p>
        <button
          type="button"
          disabled={!quiz}
          onClick={() => quiz && onStart(quiz)}
          className="flex items-center gap-2 rounded-lg bg-[#006fbf] px-6 py-2.5 font-bold text-white hover:bg-[#005694] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
        >
          <Play aria-hidden="true" className="h-4 w-4" />
          Start quiz
        </button>
      </div>
    </section>
  );
}
