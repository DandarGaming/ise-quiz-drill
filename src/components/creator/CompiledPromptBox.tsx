import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Copy, Lock } from 'lucide-react';

export interface CompiledPromptBoxProps {
  prompt: string;
  isNoTypeSelected: boolean;
  totalCustomPct: number;
  isPctInvalid: boolean;
}

export const CompiledPromptBox: React.FC<CompiledPromptBoxProps> = ({
  prompt,
  isNoTypeSelected,
  totalCustomPct,
  isPctInvalid,
}) => {
  const [promptCopied, setPromptCopied] = useState(false);
  const isPromptLocked = isNoTypeSelected || isPctInvalid;

  useEffect(() => {
    if (!promptCopied) return;
    const id = setTimeout(() => setPromptCopied(false), 2000);
    return () => clearTimeout(id);
  }, [promptCopied]);

  const handleCopyPrompt = async () => {
    if (isPromptLocked) return;
    try {
      await navigator.clipboard.writeText(prompt);
      setPromptCopied(true);
    } catch {
      // Clipboard blocked; the prompt stays visible to select by hand
    }
  };

  return (
    <section
      aria-labelledby="compiled-prompt-title"
      className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl p-6 text-white shadow-md space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <span className="bg-[#006fbf] text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Step 2
          </span>
          <h2
            id="compiled-prompt-title"
            className="text-xl font-bold text-white mt-1"
          >
            Compiled AI System Prompt
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Copy this dynamically compiled prompt and paste it into
            ChatGPT/Claude along with your lecture notes.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopyPrompt}
          disabled={isPromptLocked}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-sm ${
            isPromptLocked
              ? 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed pointer-events-none'
              : promptCopied
                ? 'bg-green-600 text-white cursor-pointer'
                : 'bg-[#006fbf] hover:bg-[#005694] text-white cursor-pointer'
          }`}
        >
          {isPromptLocked ? (
            <>
              <Lock aria-hidden="true" className="w-4 h-4" /> Prompt Locked
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
      <span role="status" className="sr-only">
        {promptCopied ? 'Prompt copied' : ''}
      </span>

      <div className="relative bg-black/60 rounded-lg p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-hidden">
        <pre
          aria-hidden={isPromptLocked ? true : undefined}
          className={`whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed custom-scrollbar transition-all duration-300 ${
            isPromptLocked
              ? 'filter blur-md opacity-30 select-none pointer-events-none'
              : ''
          }`}
        >
          {prompt}
        </pre>

        {isPromptLocked && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2.5 z-10 animate-in fade-in">
            <div className="bg-amber-500/20 text-amber-400 p-3 rounded-full border border-amber-500/40">
              <AlertTriangle aria-hidden="true" className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white tracking-wide">
              {isNoTypeSelected
                ? 'No Question Types Selected'
                : 'Invalid Percentage Allocation'}
            </h3>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              {isNoTypeSelected ? (
                <>
                  Please select at least one question type (Multiple Choice,
                  Multi-Select, True/False, or Short Answer) to generate the
                  prompt.
                </>
              ) : (
                <>
                  The total custom difficulty percentage must equal exactly 100%
                  (Current total:{' '}
                  <strong className="text-amber-400 font-bold">
                    {totalCustomPct}%
                  </strong>
                  ). Please adjust your Easy, Medium, and Hard percentage inputs
                  to unlock the AI prompt.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
