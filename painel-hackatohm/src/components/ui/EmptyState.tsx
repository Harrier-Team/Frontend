import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="rounded-[var(--radius-panel)] border border-dashed border-line-strong px-6 py-14 text-center">
    <h2 className="display text-base">{title}</h2>
    {description && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-2">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
