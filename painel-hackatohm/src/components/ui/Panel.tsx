import React from 'react';

/** Superfície única do sistema: uma moldura, divisores internos, sem sombra. */
export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`divide-y divide-line overflow-hidden rounded-[var(--radius-panel)] border border-line bg-panel ${className}`}
  >
    {children}
  </div>
);
