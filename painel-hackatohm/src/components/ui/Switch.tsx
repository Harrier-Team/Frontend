import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:opacity-45 ${
      checked ? 'border-ink-2 bg-ink-2/30' : 'border-line-strong bg-canvas'
    }`}
  >
    <span
      aria-hidden="true"
      className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-200 ${
        checked ? 'left-[19px] bg-flare' : 'left-[3px] bg-ink-3'
      }`}
    />
  </button>
);
