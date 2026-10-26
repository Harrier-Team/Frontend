import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <section className={`rounded-xl border border-slate-200 bg-white shadow-xs ${className}`}>
    {children}
  </section>
);
