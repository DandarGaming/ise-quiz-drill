import { useEffect, useState } from 'react';
import { Check, Copy, Lock } from 'lucide-react';

export interface CompiledPromptBoxProps {
  prompt: string;
  // Why the prompt cannot be used yet; null when it is ready
  error: string | null;
}

export function CompiledPromptBox({ prompt, error }: CompiledPromptBoxProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
    } catch {
      // Clipboard blocked; the text stays visible to select by hand
    }
  };

  return (
    <section
      aria-labelledby="compiled-prompt-title"
      className="space-y-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="compiled-prompt-title" className="text-xl font-bold">
            AI prompt
          </h2>
          <p className="text-sm text-slate-300">
            Paste it into ChatGPT or Claude, followed by your notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span role="status" className="text-sm font-semibold text-green-300">
            {copied ? 'Copied' : ''}
          </span>
          <button
            type="button"
            onClick={copy}
            disabled={!!error}
            className="flex items-center gap-2 rounded-lg bg-[#006fbf] px-5 py-2.5 text-sm font-bold hover:bg-[#005694] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {error ? (
              <Lock aria-hidden="true" className="h-4 w-4" />
            ) : copied ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            Copy prompt
          </button>
        </div>
      </div>
      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm font-semibold text-amber-200">
          {error}
        </p>
      ) : (
        <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-black/60 p-4 font-mono text-xs leading-relaxed text-slate-300">
          {prompt}
        </pre>
      )}
    </section>
  );
}
