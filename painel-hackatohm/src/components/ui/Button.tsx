import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  busy?: boolean;
}

const variantClasses = {
  primary: 'bg-flare text-canvas hover:bg-white',
  secondary: 'border border-line-strong text-ink hover:bg-raised hover:border-[#38414c]',
  danger: 'bg-hot text-canvas hover:brightness-110',
  ghost: 'text-ink-2 hover:bg-raised hover:text-ink',
};

const sizeClasses = {
  md: 'h-10 px-4 text-sm',
  sm: 'h-8 px-3 text-[13px]',
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
