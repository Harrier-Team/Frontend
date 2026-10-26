import React from 'react';
import { Radio } from 'lucide-react';

export const LiveDataNotice: React.FC = () => (
  <div className="flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-sky-900">
    <Radio className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <p className="text-xs leading-relaxed">
      Os diagnósticos exibidos são recebidos em tempo real. Eles não representam
      histórico persistido e não poderão ser recuperados após desconexão ou recarga.
    </p>
  </div>
);
