import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Lock, RefreshCw } from 'lucide-react';

export interface CompiledPromptBoxProps {
  // null until the user builds the prompt for the first time
  prompt: string | null;
  // The options changed after the prompt was built
  isStale: boolean;
  // Why the prompt cannot be built from the current options
  error: string | null;
  onUpdate: () => void;
}

export const CompiledPromptBox: React.FC<CompiledPromptBoxProps> = ({
  prompt,
  isStale,
  error,
  onUpdate,
}) => {
  const [promptCopied, setPromptCopied] = useState(false);
  const isEmpty = prompt === null;
  const isUpToDate = !isEmpty && !isStale;
  const needsUpdate = !error && !isUpToDate;

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
    } catch {
      // Clipboard blocked; the prompt stays visible to select by hand
    }
  };

  let status = '';
  if (promptCopied) status = 'Prompt copied';
  else if (error) status = '';
  else if (isEmpty) status = 'No prompt yet. Press Update Prompt to build it.';
  else if (isStale)
    status =
      'Options changed since this prompt was built. Press Update Prompt.';

  return (
    <section
      aria-labelledby="compiled-prompt-title"
      className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-md space-y-4"
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
            disabled={!!error || isUpToDate}
            data-highlight={needsUpdate ? 'true' : undefined}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
              error
                ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                : isUpToDate
                  ? 'bg-slate-700 text-slate-300 cursor-default'
                  : 'bg-amber-600 hover:bg-amber-700 text-white ring-4 ring-amber-500/30 animate-pulse cursor-pointer'
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
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
              !isUpToDate
                ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
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
      {error && (
        <p
          role="alert"
          className="bg-amber-500/15 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-lg flex items-center gap-2.5 text-xs font-semibold"
        >
          <AlertTriangle
            aria-hidden="true"
            className="w-4 h-4 text-amber-400 flex-shrink-0"
          />
          {error}
        </p>
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
