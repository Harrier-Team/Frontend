import React, { useState } from 'react';
import { MotorInput } from '../types/motor';
import { SensorFormList } from './SensorFormList';
import { useMotorForm } from '../hooks/useMotorForm';
import { ErrosCadastro, formatarMacDigitado, normalizarMac, validarMac } from '../helpers/cadastroHelper';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';

interface MotorFormProps {
  salvando: boolean;
  erro: string | null;
  /** Mensagens por campo devolvidas pela API (Problem Details). */
  detalhesErro?: string[];
  onSubmit: (dados: MotorInput) => Promise<void>;
  onCancel: () => void;
}

export const MotorForm: React.FC<MotorFormProps> = ({ salvando, erro, detalhesErro = [], onSubmit, onCancel }) => {
  const form = useMotorForm();
  const [erros, setErros] = useState<ErrosCadastro>({});

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const encontrados = form.validar();
    setErros(encontrados);
    if (form.temErros(encontrados)) return;
    await onSubmit(form.criarPayload());
  };

  const normalizarMacAoSair = () => {
    if (!form.mac.trim()) return;
    const normalizado = normalizarMac(form.mac);
    form.setMac(normalizado);
    setErros((atuais) => ({ ...atuais, mac: validarMac(normalizado) ?? undefined }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 px-6 pb-6 pt-5" noValidate>
      {erro && (
        <div>
          <Alert tone="error" title={erro} />
          {detalhesErro.length > 0 && (
            <ul className="mt-2 list-disc space-y-0.5 pl-9 text-[13px] text-ink-2">
              {detalhesErro.map((mensagem) => (
                <li key={mensagem}>{mensagem}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {erros.escovas && <Alert tone="error" title={erros.escovas} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="motor-nome" className="field-label">
            Nome
          </label>
          <input
            id="motor-nome"
            type="text"
            required
            autoFocus
            placeholder="Motor trastejador 01"
            aria-invalid={Boolean(erros.nome)}
            value={form.nome}
            onChange={(event) => form.setNome(event.target.value)}
            className="field"
          />
          {erros.nome && <p className="field-error">{erros.nome}</p>}
        </div>
        <div>
          <label htmlFor="motor-tipo" className="field-label">
            Tipo
          </label>
          <input
            id="motor-tipo"
            type="text"
            required
            placeholder="Trifásico 220 V"
            aria-invalid={Boolean(erros.tipo)}
            value={form.tipo}
            onChange={(event) => form.setTipo(event.target.value)}
            className="field"
          />
          {erros.tipo && <p className="field-error">{erros.tipo}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="motor-mac" className="field-label">
          MAC do ESP
        </label>
        <input
          id="motor-mac"
          type="text"
          required
          autoComplete="off"
          spellCheck={false}
          placeholder="AA:BB:CC:DD:EE:FF"
          aria-invalid={Boolean(erros.mac)}
          aria-describedby="motor-mac-ajuda"
          value={form.mac}
          onChange={(event) => form.setMac(formatarMacDigitado(event.target.value))}
          onBlur={normalizarMacAoSair}
          className="field font-mono uppercase"
        />
        {erros.mac ? (
          <p className="field-error">{erros.mac}</p>
        ) : (
          <p id="motor-mac-ajuda" className="mt-1.5 text-[13px] text-ink-3">
            Um único ESP envia as leituras de todas as escovas do motor.
          </p>
        )}
      </div>

      <SensorFormList
        escovas={form.escovas}
        onChange={form.atualizarEscova}
        onAdd={form.adicionarEscova}
        onRemove={form.removerEscova}
      />

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={salvando}>
          Cancelar
        </Button>
        <Button type="submit" busy={salvando}>
          {salvando ? 'Salvando' : 'Salvar motor'}
        </Button>
      </div>
    </form>
  );
};
