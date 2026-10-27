import React from 'react';
import { ConexaoSessao } from '../components/ConexaoSessao';

/** Registro de conexão da sessão. */
export const Eventos: React.FC = () => (
  <div className="space-y-8">
    <header>
      <p className="eyebrow">Eventos da sessão</p>
      <h1 className="display mt-2 text-[28px] leading-tight sm:text-[34px]">Conexão</h1>
    </header>
    <ConexaoSessao />
  </div>
);
