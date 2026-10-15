import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Lock, RefreshCw } from 'lucide-react';

export interface CompiledPromptBoxProps {
  // null until the user builds the prompt for the first time
  prompt: string | null;
  // The options changed after the prompt was built
  isStale: boolean;
  // Everything that stops the prompt from being built from the current options
  errors: string[];
  onUpdate: () => void;
  // Called after the prompt reached the clipboard
  onCopied?: () => void;
}

export const CompiledPromptBox: React.FC<CompiledPromptBoxProps> = ({
  prompt,
  isStale,
  errors,
  onUpdate,
  onCopied,
}) => {
  const [promptCopied, setPromptCopied] = useState(false);
  const hasErrors = errors.length > 0;
  const isEmpty = prompt === null;
  const isUpToDate = !isEmpty && !isStale;

  useEffect(() => {
    if (!promptCopied) return;
    const id = setTimeout(() => setPromptCopied(false), 2000);
    return () => clearTimeout(id);
  }, [promptCopied]);

  const handleCopyPrompt = async () => {
    if (!isUpToDate) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
      onCopied?.();
    } catch {
      // Clipboard blocked; the prompt stays visible to select by hand
    }
  };

  const status = promptCopied
    ? 'Prompt copied'
    : hasErrors
      ? ''
      : isEmpty
        ? 'No prompt yet. Press Update Prompt to build it.'
        : isStale
          ? 'Options changed since this prompt was built. Press Update Prompt.'
          : '';

  return (
    <section
      aria-labelledby="compiled-prompt-title"
      className="bg-slate-900 rounded-xl p-6 text-white shadow-md space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3
            id="compiled-prompt-title"
            className="text-xl font-bold text-white"
          >
            Compiled AI System Prompt
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Copy this prompt and paste it into ChatGPT/Claude along with your
            lecture notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onUpdate}
            disabled={hasErrors || isUpToDate}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
              hasErrors
                ? 'bg-slate-600 text-slate-300 cursor-not-allowed'
                : isUpToDate
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-900 cursor-pointer'
            }`}
          >
            {isUpToDate ? (
              <>
                <Check aria-hidden="true" className="w-4 h-4 stroke-[3]" />{' '}
                Prompt Up to Date
              </>
            ) : (
              <>
                <RefreshCw aria-hidden="true" className="w-4 h-4" /> Update
                Prompt
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCopyPrompt}
            disabled={!isUpToDate}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
              !isUpToDate
                ? 'bg-slate-600 text-slate-200 cursor-not-allowed'
                : promptCopied
                  ? 'bg-green-600 text-white cursor-pointer'
                  : 'bg-[#006fbf] hover:bg-[#005694] text-white cursor-pointer'
            }`}
          >
            {!isUpToDate ? (
              <>
                <Lock aria-hidden="true" className="w-4 h-4" /> Copy Locked
              </>
            ) : promptCopied ? (
              <>
                <Check aria-hidden="true" className="w-4 h-4 stroke-[3]" />{' '}
                Copied!
              </>
            ) : (
              <>
                <Copy aria-hidden="true" className="w-4 h-4" /> Copy AI Prompt
              </>
            )}
          </button>
        </div>
      </div>

      <p role="status" className="text-xs text-amber-300 min-h-[1rem]">
        {status}
      </p>
      {hasErrors && (
        <div role="alert" className="text-xs font-semibold text-red-300">
          <ul className="space-y-1">
            {errors.map((error) => (
              <li key={error} className="flex items-center gap-2">
                <AlertTriangle
                  aria-hidden="true"
                  className="w-4 h-4 flex-shrink-0"
                />
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-black/60 rounded-lg p-4 font-mono text-xs text-slate-300 border border-slate-800">
        <pre
          className={`whitespace-pre-wrap h-56 overflow-y-auto leading-relaxed custom-scrollbar transition-opacity ${
            isStale ? 'opacity-40' : ''
          }`}
        >
          {prompt ?? ''}
        </pre>
      </div>
    </section>
  );
};
