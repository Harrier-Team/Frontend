import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  busy?: boolean;
}

const variantClasses = {
  primary: 'border border-white/15 bg-flare text-canvas shadow-[0_1px_0_0_rgb(255_255_255/0.15)_inset,0_2px_8px_rgb(0_0_0/0.15)] hover:bg-white',
  secondary: 'border border-line-strong text-ink hover:bg-raised hover:border-[#38414c]',
  danger: 'bg-hot text-canvas hover:brightness-110',
  ghost: 'text-ink-2 hover:bg-raised hover:text-ink',
};

const sizeClasses = {
  md: 'min-h-11 px-4 py-2 text-sm',
  sm: 'min-h-9 px-3 py-1.5 text-[13px]',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  busy = false,
  disabled,
  className = '',
  type = 'button',
  ...props
}) => (
  <button
    {...props}
    type={type}
    disabled={disabled || busy}
    aria-busy={busy || undefined}
    className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors disabled:opacity-45 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
  >
    {children}
  </button>
);

export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
> = ({ label, children, className = '', type = 'button', ...props }) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    title={label}
    className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-raised hover:text-ink disabled:opacity-45 ${className}`}
  >
    {children}
  </button>
);
