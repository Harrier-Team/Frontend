import { CategoriaRegra, ehCategoriaRegra } from '@/features/quality-gates/helpers/tiposRegra';

export const TAMANHO_PAGINA = 50;
export const TAMANHO_MAXIMO = 200;

export type SituacaoAlerta = 'aberto' | 'encerrado' | 'todos';
export type SeveridadeFiltro = 'Atencao' | 'AlertaPreditivo' | 'Critico';
export type AbaAlertas = 'abertos' | 'historico' | 'conexao';

/** Filtros da listagem. Na URL ficam só os que diferem do padrão. */
export interface FiltrosAlertas {
  motorId?: number;
  situacao: SituacaoAlerta;
  categoria?: CategoriaRegra;
  severidade?: SeveridadeFiltro;
  tipoRegra?: string;
  pagina: number;
}

export const FILTROS_PADRAO: FiltrosAlertas = { situacao: 'todos', pagina: 1 };

export const SEVERIDADES_FILTRO: SeveridadeFiltro[] = ['Critico', 'AlertaPreditivo', 'Atencao'];
const SITUACOES: SituacaoAlerta[] = ['aberto', 'encerrado', 'todos'];
const ABAS: AbaAlertas[] = ['abertos', 'historico', 'conexao'];

function inteiroPositivo(valor: string | null): number | undefined {
  if (valor === null || !/^[0-9]+$/.test(valor)) return undefined;
  const n = Number(valor);
  return n >= 1 ? n : undefined;
}

/** Filtros a partir dos parâmetros da URL; valores inválidos são ignorados (o backend responderia 400). */
export function lerFiltros(params: URLSearchParams): FiltrosAlertas {
  const categoria = params.get('categoria');
  const severidade = params.get('severidade') as SeveridadeFiltro | null;
  const situacao = params.get('situacao') as SituacaoAlerta | null;
  const tipoRegra = params.get('tipoRegra')?.trim();
  return {
    motorId: inteiroPositivo(params.get('motorId')),
    situacao: situacao && SITUACOES.includes(situacao) ? situacao : FILTROS_PADRAO.situacao,
    categoria: ehCategoriaRegra(categoria) ? categoria : undefined,
    severidade: severidade && SEVERIDADES_FILTRO.includes(severidade) ? severidade : undefined,
    tipoRegra: tipoRegra ? tipoRegra : undefined,
    pagina: inteiroPositivo(params.get('pagina')) ?? 1,
  };
}

export function lerAba(params: URLSearchParams): AbaAlertas {
  const aba = params.get('aba') as AbaAlertas | null;
  return aba && ABAS.includes(aba) ? aba : 'abertos';
}

/** Parâmetros da URL (sem os valores padrão) para a aba e os filtros. */
export function escreverParametros(aba: AbaAlertas, filtros: FiltrosAlertas): URLSearchParams {
  const params = new URLSearchParams();
  if (aba !== 'abertos') params.set('aba', aba);
  if (filtros.motorId !== undefined) params.set('motorId', String(filtros.motorId));
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.severidade) params.set('severidade', filtros.severidade);
  if (filtros.tipoRegra) params.set('tipoRegra', filtros.tipoRegra);
  if (aba === 'historico') {
    if (filtros.situacao !== FILTROS_PADRAO.situacao) params.set('situacao', filtros.situacao);
    if (filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  }
  return params;
}

export type ConsultaAlertas = Partial<FiltrosAlertas> & { ativo?: boolean; tamanho?: number };

/** Query string de `GET /api/alertas`. `ativo` só vai quando a situação restringe. */
export function montarQuery(filtros: ConsultaAlertas): string {
  const params = new URLSearchParams();
  if (filtros.motorId !== undefined) params.set('motorId', String(filtros.motorId));
  const ativo =
    filtros.ativo ?? (filtros.situacao === 'aberto' ? true : filtros.situacao === 'encerrado' ? false : undefined);
  if (ativo !== undefined) params.set('ativo', String(ativo));
  if (filtros.categoria) params.set('categoria', filtros.categoria);
  if (filtros.tipoRegra) params.set('tipoRegra', filtros.tipoRegra);
  if (filtros.severidade) params.set('severidade', filtros.severidade);
  params.set('pagina', String(Math.max(1, filtros.pagina ?? 1)));
  params.set('tamanho', String(Math.min(TAMANHO_MAXIMO, Math.max(1, filtros.tamanho ?? TAMANHO_PAGINA))));
  return params.toString();
}

export function totalDePaginas(total: number, tamanho: number): number {
  return Math.max(1, Math.ceil(total / Math.max(tamanho, 1)));
}
