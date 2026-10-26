import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  busy?: boolean;
}

const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  ghost: 'text-slate-600 hover:bg-slate-100',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  busy = false,
  disabled,
  className = '',
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || busy}
    className={`inline-flex cursor-pointer items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${variantClasses[variant]} ${className}`}
  >
    {busy ? 'Processando...' : children}
  </button>
);
