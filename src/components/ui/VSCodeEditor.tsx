import React from 'react';

interface VSCodeEditorProps {
  code: string;
  onChange?: (val: string) => void;
  onPaste?: (e: React.ClipboardEvent) => void;
  fileName?: string;
  readOnly?: boolean;
  minRows?: number;
  language?: string;
}

export const VSCodeEditor: React.FC<VSCodeEditorProps> = ({
  code,
  onChange,
  onPaste,
  fileName = 'solution.ts',
  readOnly = false,
  minRows = 14,
  language = 'typescript'
}) => {
  const lines = code.split('\n');

  return (
    <div className="rounded-none recessed-meter overflow-hidden font-mono text-xs text-theme-ink">
      
      {/* Editor Header Tab Bar */}
      <div className="flex items-center justify-between bg-theme-surface border-b border-theme-ink px-3 py-1.5 select-none">
        <div className="flex items-center">
          <div className="flex items-center gap-2 px-3 py-1 bg-theme-base text-theme-ink border-t-2 border-theme-ink text-xs font-mono font-medium">
            <span className="text-theme-ink/60 font-bold uppercase">TS</span>
            <span>{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-micro uppercase tracking-wider font-medium text-theme-ink/60">
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
          <span className="text-theme-ink">● READY</span>
        </div>
      </div>

      {/* Editor Body with Gutter */}
      <div className="flex relative">
        {/* Line Numbers Gutter */}
        <div className="select-none py-3 px-3 text-right bg-theme-surface text-theme-ink/40 border-r border-theme-ink text-xs leading-relaxed font-mono tabular-nums shrink-0 min-w-[2.75rem]">
          {lines.map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        {/* Textarea Code Input or Readonly Display */}
        {readOnly ? (
          <div className="p-3 leading-relaxed text-theme-ink whitespace-pre font-mono overflow-x-auto flex-1">
            {code}
          </div>
        ) : (
          <textarea
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            onPaste={onPaste}
            rows={Math.max(lines.length + 2, minRows)}
            className="w-full bg-theme-base p-3 text-theme-ink caret-theme-ink focus:outline-none leading-relaxed font-mono resize-y"
            spellCheck={false}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-theme-surface border-t border-theme-ink px-3 py-0.5 text-micro font-mono tabular-nums text-theme-ink font-medium select-none uppercase tracking-wider">
        <div className="flex items-center gap-3">
          <span>● READY</span>
          <span>LN {lines.length}, COL 1</span>
        </div>
        <div className="flex items-center gap-3">
          <span>SPACES: 2</span>
          <span>TYPESCRIPT 5.4</span>
        </div>
      </div>

    </div>
  );
};
