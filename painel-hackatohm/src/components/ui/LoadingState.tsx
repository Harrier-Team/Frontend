import React from 'react';

interface LoadingStateProps {
  label?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Carregando...',
}) => (
  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
    <span aria-live="polite">{label}</span>
  </div>
);
