import React from 'react';

interface AlertProps {
  title: string;
  message?: string;
  tone?: 'info' | 'warning' | 'error';
  action?: React.ReactNode;
}

const dot = {
  info: 'var(--color-ink-2)',
  warning: 'var(--color-warn)',
  error: 'var(--color-hot)',
};

export const Alert: React.FC<AlertProps> = ({ title, message, tone = 'info', action }) => (
  <div
    role={tone === 'error' ? 'alert' : 'status'}
    className="flex items-start gap-3 rounded-xl border border-line bg-panel px-4 py-3"
  >
    <span
      aria-hidden="true"
      className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
      style={{ background: dot[tone] }}
    />
    <div className="min-w-0 flex-1">
      <p className="text-sm text-ink">{title}</p>
      {message && <p className="mt-0.5 text-[13px] text-ink-2">{message}</p>}
    </div>
    {action}
  </div>
);
