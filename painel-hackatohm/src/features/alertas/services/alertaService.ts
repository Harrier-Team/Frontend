import { api } from '@/services/api';
import { normalizarPagina } from '../helpers/normalizacao';
import { ConsultaAlertas, montarQuery, TAMANHO_MAXIMO } from '../helpers/filtros';
import { AlertaManutencao, PaginaAlertas } from '../types/alerta';

const LIMITE_DE_PAGINAS = 10;

export const alertaService = {
  /** `GET /api/alertas`. Um 404 (`ApiRequestError.status`) significa backend sem a funcionalidade. */
  async listar(consulta: ConsultaAlertas): Promise<PaginaAlertas> {
    const response = await api.get<unknown>(`/alertas?${montarQuery(consulta)}`);
    return normalizarPagina(response.data);
  },

  /** Todos os alertas em aberto (páginas de 200, no máximo 10 páginas). */
  async listarAbertos(): Promise<AlertaManutencao[]> {
    const todos: AlertaManutencao[] = [];
    for (let pagina = 1; pagina <= LIMITE_DE_PAGINAS; pagina += 1) {
      const resultado = await alertaService.listar({ ativo: true, pagina, tamanho: TAMANHO_MAXIMO });
      todos.push(...resultado.itens);
      if (resultado.itens.length === 0 || todos.length >= resultado.total) break;
    }
    return todos;
  },
};
