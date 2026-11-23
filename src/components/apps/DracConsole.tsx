import React, { useState, useRef, useEffect } from 'react';

interface DracConsoleProps {
  logs: string[];
  onExecute: (cmd: string) => void;
}

export const DracConsole: React.FC<DracConsoleProps> = ({ logs, onExecute }) => {
  const [input, setInput] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    onExecute(cmd);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col font-mono text-xs text-red-500 bg-black/80 rounded p-3 border border-red-950 overflow-hidden">
      {/* Scrollable logs */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1 mb-2 pr-1 select-text">
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={`${
              log.startsWith('>')
                ? 'text-red-400 font-semibold'
                : log.includes('HACKED') || log.includes('EXPLOIT')
                ? 'text-yellow-400 font-bold glow-text-gold'
                : log.includes('☠️') || log.includes('DEFEAT')
                ? 'text-rose-600 font-bold'
                : log.includes('LEVEL UP') || log.includes('UPGRADE')
                ? 'text-purple-400 glow-text-purple'
                : log.includes('LOOT') || log.includes('RELIC')
                ? 'text-amber-500'
                : 'text-red-500'
            }`}
          >
            {log}
          </div>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-red-950/60 pt-2">
        <span className="text-red-400 font-bold select-none">dracos#</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="type 'help' for spell commands..."
          className="flex-1 bg-transparent border-none outline-none text-red-400 font-mono text-xs placeholder-red-900/60"
          autoFocus
        />
      </form>
    </div>
  );
};
