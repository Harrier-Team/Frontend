import React from 'react';

export const LoadingState: React.FC<{ label?: string; rows?: number }> = ({
  label = 'Carregando',
  rows = 3,
}) => (
  <div
    role="status"
    aria-live="polite"
    className="divide-y divide-line overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel"
  >
    <span className="sr-only">{label}</span>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex animate-pulse items-center gap-4 px-5 py-5">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <div className="space-y-2">
          <div className="h-3 w-40 rounded bg-line-strong" />
          <div className="h-2.5 w-24 rounded bg-line" />
        </div>
        <div className="ml-auto h-3 w-1/3 rounded bg-line" />
      </div>
    ))}
  </div>
);
