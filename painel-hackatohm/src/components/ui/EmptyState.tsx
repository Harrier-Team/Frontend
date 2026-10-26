import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
}) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
    <h2 className="text-base font-bold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
