import React from 'react';

interface AlertProps {
  title: string;
  message?: string;
  tone?: 'info' | 'success' | 'warning' | 'error';
}

const toneClasses = {
  info: 'bg-indigo-50 border-indigo-200 text-indigo-900',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  warning: 'bg-amber-50 border-amber-200 text-amber-900',
  error: 'bg-rose-50 border-rose-200 text-rose-900',
};

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  tone = 'info',
}) => (
  <div className={`rounded-lg border p-4 ${toneClasses[tone]}`} role="status">
    <p className="text-sm font-semibold">{title}</p>
    {message && <p className="mt-1 text-sm opacity-80">{message}</p>}
  </div>
);
