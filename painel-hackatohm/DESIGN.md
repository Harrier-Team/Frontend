# Design e comportamento do painel Harrier

Painel de telemetria térmica e manutenção preditiva das escovas de motores.
Derivado da logo Harrier: grafite frio, aço escovado e um único ponto de luz.

Este documento descreve **como o painel deve ser e se comportar**: princípios,
estados, regras de tratamento dos dados, tokens e componentes. Os contratos do
Backend (`../Backend/docs/`) são a fonte de verdade dos dados; em caso de
divergência, eles prevalecem e este documento deve ser corrigido.

## Princípios

1. **Calmo por padrão.** Operação normal usa grafite e aço. Cor aparece só onde
   há anormalidade, seguindo as interfaces de operação de alto desempenho
   (ISA-101). Se tudo está colorido, nada chama atenção.
2. **Severidade e confiança são eixos diferentes.** "Quão grave" vem do backend
   (`severidade`). "Quão atual é este dado" vem do frescor e da `situacao`.
   A tela mostra os dois, lado a lado, e nunca troca um pelo outro.
3. **Silêncio não é normalidade.** Sem lote recente, o último diagnóstico fica
   na tela marcado como desatualizado. Nunca volta sozinho para "Normal".
4. **Todo alerta explica a si mesmo.** Regra, escova, valor observado e limite,
   na unidade correta (°C, °C/min ou diferença em °C).
5. **Honesto com os dados.** Nada de "vida útil restante" ou "% de desgaste":
   o backend avalia regras, não estima falhas. Rótulos dizem "nesta sessão"
   quando o dado só existe em memória.
6. **Cor nunca sozinha.** Todo estado tem símbolo e texto além da cor.
7. **Um gesto de marca.** O ponto de luz do eclipse é o marcador do valor
   atual: no medidor térmico, no fim das linhas do gráfico e no indicador
   "ao vivo".

## Estados

### Severidade (backend)

| Estado | Token | Símbolo (lucide) | Texto | Uso da cor |
| --- | --- | --- | --- | --- |
| Normal | `sev-normal` | nenhum, ou `Circle` pequeno | "Normal" | Só no ponto; números ficam em `ink` |
| Atenção | `sev-atencao` | `Info` | "Atenção" | Ponto, valor e rótulo |
| Alerta preditivo | `sev-alerta` | `TriangleAlert` | "Alerta preditivo" | Ponto, valor, rótulo e barra lateral |
| Crítico | `sev-critico` | `OctagonAlert` | "Crítico" | Ponto, valor, rótulo, barra lateral e fundo tingido |

### Avaliação (não são severidade)

| Estado | Símbolo | Texto | Cor |
| --- | --- | --- | --- |
| Aguardando amostras | `Hourglass` | "Aguardando amostras" | `ink-3` |
| Sem regras | `CircleDashed` | "Sem regras" | `ink-3`, com link para vincular |
| Sem leitura | — | "—" no valor | `ink-3` |

### Dado (frescor e conexão)

| Estado | Condição | Indicador |
| --- | --- | --- |
| Ao vivo | Último lote há menos de 30 s | Ponto `flare` com respiração lenta e texto "há 4 s" |
| Atrasado | 30 s a 120 s sem lote | Ponto `ink-3`; valores em `ink-2`; texto "há 1 min" |
| Degradado | `situacao: Degradado` | `CircleSlash2` em `data-off`; lista das escovas sem dado |
| Offline | `situacao: Offline` | `WifiOff` em `data-off`; valores em `ink-3` com "desatualizado" |
| Hub desconectado | SignalR fora | Faixa fina no topo da página em `sev-atencao`, com "Reconectando…" |

A cor de severidade de um dado desatualizado é mantida, mas com opacidade
reduzida (60%) e o texto "desatualizado". O usuário vê que **era** crítico e que
não há confirmação recente.

## Regras de dados

Boas práticas obrigatórias para qualquer tela que exiba telemetria ou
diagnóstico.

### Origem da severidade

- A severidade vem **sempre** do backend: `severidade` de cada resultado de
  gate e `severidadeGeral` do status agregado do motor. O cliente nunca
  classifica por temperatura nem usa limites fixos.
- `alertaDesgaste` só indica que algum gate disparou; não distingue aviso de
  crítico e não deve ser usado para escolher cor ou rótulo.
- Resultado com `codigoRegra: "DADOS_INSUFICIENTES"` ou
  `metadados.avaliacaoConcluida: false` é "Aguardando amostras", nunca Normal.
- Lista de resultados vazia é "Sem regras", nunca Normal.

### Fontes e sincronização

- Status do motor: `GET /api/motores/{id}/status` e o evento
  `ReceberStatusMotor`. Ao abrir o detalhe, chamar `AssinarMotor(motorId)`;
  ao sair, `DesassinarMotor(motorId)`.
- Amostras: somente `ReceberLoteTelemetria`. `ReceberTelemetria` não conta
  como amostra adicional.
- Filtrar eventos por `motorId` (o hub publica em broadcast global).
- Identificar escovas por `motorId` + `numeroEscova` (ou `espMacAddress` +
  `numeroEscova`). Não extrair dados fazendo parsing do `sensorId`.
- Deduplicar por motor, escova e `dataHora`. Uma leitura só substitui a atual
  se for mais recente; resposta HTTP antiga nunca sobrescreve evento do hub.
- Ao conectar **e ao reconectar**, recarregar o status de todos os motores:
  o hub não reenvia eventos perdidos.
- Após criar, editar, ativar, desativar, vincular ou desvincular regras,
  recarregar o status dos motores afetados: não há push para isso.

### Frescor

- Cadência de referência do ESP: ~10 s.
- Sem lote há mais de 30 s: estado "Atrasado" e consulta ao status do motor
  (no máximo uma vez a cada 30 s por motor). O backend não envia evento quando
  o ESP silencia.
- `Offline` e `Degradado` vêm da `situacao` do backend
  (`Telemetria:OfflineAfterSeconds`, padrão 120 s).
- Toda leitura exibida mostra sua idade. Conexão ativa do hub não significa
  dado recente.

### Unidades e regras

| `tipoRegra` | Rótulo | Unidade | Faixa dos limites |
| --- | --- | --- | --- |
| `temperatura.limiar_estatico` | Limiar estático | °C | -55 a 200 |
| `temperatura.gradiente_termico` | Gradiente térmico | °C/min | ≥ 0 |
| `temperatura.assimetria_escovas` | Assimetria entre escovas | °C de diferença | ≥ 0 |

- Sempre `aviso < critico`; comparação `>=` (igual ao limite já dispara).
- Formatar `valorObservado` e `valorLimite` pela unidade do `tipoRegra`. Não
  acrescentar "°C" indiscriminadamente.
- Edição (`PUT`) envia o objeto completo, **incluindo `tipoRegra`**: omitir o
  tipo faz o backend convertê-la em limiar estático.
- A assimetria pertence ao motor: o backend repete o mesmo resultado em cada
  escova, mas a tela mostra uma vez, no escopo do motor.

### Histórico

- O backend não expõe histórico por período nem persiste resultados de gates.
  Gráficos e eventos usam uma janela em memória (buffer circular por escova,
  ~360 pontos) e devem ser rotulados como "da sessão".
- Redução de pontos só no desenho, preservando picos e pontos de alerta.

### Cadastro

- Um motor tem **um** ESP (um MAC) que envia todas as escovas em cada lote.
  O formulário pede o MAC uma vez e os números de escova (positivos e únicos).
- Validar no cliente com as mesmas regras do backend e exibir os erros do
  Problem Details (`code`, `errors`) em linguagem de usuário.

### Erros

- Falha de rede ou 5xx nunca é exibida como lista vazia ou "não encontrado".
  Mostrar `ApiErrorState` com causa provável e "Tentar de novo".
- 404 só significa "não encontrado" quando a API respondeu.
- Logs de console por lote ficam desligados fora do modo de desenvolvimento.

## Tokens (`src/styles/tokens.css`)

Todos os pares de texto abaixo foram medidos contra `canvas`, `panel` e
`raised` e passam WCAG AA (≥ 4,5:1). `data-off` é usado só em ícones e
pontos (≥ 3:1).

### Tema escuro (padrão)

| Token | Valor | Uso |
| --- | --- | --- |
| `canvas` | `#0b0d10` | Fundo da página |
| `panel` | `#111418` | Superfícies (painéis, cartões) |
| `raised` | `#171b21` | Hover, item selecionado, tooltip |
| `line` | `#1f252c` | Divisores |
| `line-strong` | `#2c343e` | Bordas de campos, eixos do gráfico |
| `ink` | `#e6e9ed` | Texto primário, valores |
| `ink-2` | `#a0a9b4` | Texto secundário |
| `ink-3` | `#7f8995` | Rótulos, metadados, dado atrasado |
| `flare` | `#f1ede4` | Acento da marca: ação primária, foco, "ao vivo" |
| `sev-normal` | `#7fb3a0` | Normal |
| `sev-atencao` | `#d9c36a` | Atenção, hub desconectado |
| `sev-alerta` | `#e8964a` | Alerta preditivo |
| `sev-critico` | `#f0644f` | Crítico, ações destrutivas |
| `data-off` | `#6b7581` | Offline, degradado |
| `series-1` … `series-5` | `#7aa7e0` `#a996e6` `#5fbfc9` `#c3c9d1` `#8c8ff0` | Linhas das escovas no gráfico |

Fundos tingidos são derivados, não novos tokens:
`color-mix(in srgb, var(--color-sev-critico) 10%, var(--color-panel))`.

### Tema claro (opcional, para projetor)

| Token | Valor |
| --- | --- |
| `canvas` / `panel` / `raised` | `#f3f4f6` / `#ffffff` / `#e9ecf0` |
| `ink` / `ink-2` / `ink-3` | `#14181d` / `#47505c` / `#5f6874` |
| `sev-normal` / `sev-atencao` / `sev-alerta` / `sev-critico` | `#2b7259` / `#806500` / `#b04a00` / `#c0301c` |
| `series-1` … `series-5` | `#2f6db8` `#6d55c4` `#167f8a` `#4b5563` `#4549c9` |

Ativado por `data-theme="light"` no `<html>`; os componentes só usam tokens.

### Paleta de séries

As linhas das escovas usam tons frios (azul, lilás, ciano, aço, índigo) que
não se confundem com as severidades (verde, amarelo, laranja, vermelho). Cor
de severidade no gráfico aparece **só** em limites tracejados e marcadores de
alerta. Escovas além da quinta repetem a paleta com traço pontilhado. Cada
linha tem rótulo direto no fim ("E2 96,1"), sem depender de legenda.

### Outros tokens

| Token | Valor | Uso |
| --- | --- | --- |
| `font-sans` | Archivo Variable | Interface |
| `font-mono` | JetBrains Mono Variable | MAC, IDs, código |
| `radius-panel` | `14px` | Painéis |
| `radius-control` | `8px` | Botões, campos, chips |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Transições |

## Tipografia

- **Archivo Variable** (self-hosted). Títulos usam largura 118% (`.display`),
  ecoando as letras estendidas da logo.
- **JetBrains Mono Variable** (`@fontsource-variable/jetbrains-mono`) só para
  MAC, `sensorId` e valores copiáveis.
- Números usam `.num` (algarismos tabulares) para não "dançarem" a cada lote.
- Formato brasileiro: vírgula decimal, uma casa (`72,4 °C`), unidade em
  `ink-3` e menor que o número.

| Papel | Tamanho / peso |
| --- | --- |
| Título da página | 28–34 px, `.display` |
| Valor principal (cartão de escova) | 40 px, `.display .num` |
| Título de seção | 16 px, `.display` |
| Corpo | 15 px |
| Metadado / rótulo | 13 px, `ink-2` ou `ink-3` |
| Eixos do gráfico | 12 px, `ink-3`, `.num` |

## Layout

- Largura máxima de conteúdo: **1280 px** (era 1120 px): o detalhe do motor
  precisa de espaço para quatro cartões e o gráfico.
- Grade de 12 colunas, gutter 24 px, margem 20 px no mobile e 32 px no desktop.
- Ritmo vertical: 40 px entre seções, 16 px dentro de seções.
- Cabeçalho fixo de 56 px; a faixa de hub desconectado entra abaixo dele, sem
  empurrar o conteúdo.
- Pontos de quebra: 375 px (campo), 768 px, 1024 px, 1280 px.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `SeveritySymbol` | Símbolo + cor de uma severidade ou estado de avaliação; sempre com `aria-label` |
| `SeverityBadge` | Símbolo + texto; versão compacta e versão com fundo tingido (só Crítico) |
| `FreshnessIndicator` | Ponto + idade relativa ("há 4 s"), atualizado a cada segundo por um único relógio global |
| `Metric` | Valor + unidade + rótulo + variação opcional (`+6,2 °C/min`) |
| `ThermalGauge` | Linha fina com faixas de aviso e crítico **da regra do motor**; ponto de luz no valor atual; oculto sem regra estática |
| `Sparkline` | SVG de 80 × 24 px, sem eixos, ponto de luz no último valor |
| `TrendChart` | Séries por escova, limites tracejados, marcadores de alerta, crosshair, seletor de janela |
| `GateRow` | Regra, escopo (escova ou motor), severidade, `valor ≥ limite` com unidade |
| `MotorRow` | Linha da visão geral |
| `BrushCard` | Cartão da escova no detalhe |
| `Tabs` | Abas acessíveis (setas do teclado) |
| `Toast` | Aviso não bloqueante, `aria-live="polite"`, some sozinho em 8 s exceto Crítico |
| `CopyableCode` | Texto mono com botão de copiar |
| `ApiErrorState` | Erro de rede ou de servidor com causa provável e "Tentar de novo" |

Base já existente e mantida: `Button`, `IconButton`, `Dialog`,
`ConfirmDialog`, `Menu`, `Panel`, `Switch`, `Alert`, `EmptyState`,
`LoadingState`.

## Gráfico de tendência

- Eixo Y em °C com margem de 5 °C acima do maior valor ou do limite crítico.
- Eixo X em horário local `HH:mm:ss`; janelas de 5 min, 15 min e sessão.
- Linhas de 1,5 px; o ponto de luz marca o último valor de cada escova.
- Limites de aviso e crítico da regra de limiar estático como linhas
  tracejadas de 1 px nas cores de severidade, com rótulo à direita.
- Pontos que dispararam alerta: marcador com o símbolo da severidade.
- Lacunas maiores que 3× a cadência quebram a linha (não interpolar).
- Crosshair mostra hora, valor de cada escova e ΔT naquele lote.
- Título indica "Janela da sessão": o backend não fornece histórico.
- Alternativa acessível: tabela com os últimos 20 lotes, acessível por botão.

## Movimento

- Valores novos: transição de 300 ms no ponto do medidor; sem animar números.
- Mudança de severidade: a linha pisca o fundo tingido uma vez (600 ms).
- "Ao vivo": respiração de 2,4 s no ponto `flare`.
- Tudo desligado com `prefers-reduced-motion: reduce`.

## Texto

- Português, frases curtas, sem jargão de implementação na interface.
- Título da visão geral responde à pergunta principal ("1 motor crítico",
  "Todos os motores normais", "Aguardando o primeiro lote").
- Diagnóstico no formato **o quê, onde, quanto**: "Escova 2 atingiu 96,1 °C
  (limite crítico 95 °C)".
- Erros dizem o que aconteceu e o que fazer: "A API não respondeu. Verifique
  se o backend está rodando e tente de novo." Detalhe técnico fica recolhido.
- "Quality gates" é o nome do produto para as regras; dentro das telas, use
  "regra".

## Acessibilidade

- Contraste AA em todo texto; foco visível com anel `flare` de 2 px.
- Mudança de severidade de um motor anunciada em `aria-live="polite"`;
  Crítico em `assertive`, no máximo uma vez por transição.
- Medidores com `role="meter"` e `aria-valuetext` ("72,4 graus, abaixo do
  aviso de 80").
- Toda ação disponível por teclado; abas e filtros com setas.

## Rotas

- `/` visão geral (`/motores` e `/inicio` redirecionam)
- `/motores/:id` detalhe do motor, com abas Monitoramento, Regras e Dispositivo
- `/eventos` eventos da sessão
- `/regras-qualidade` quality gates
- `/sistema` saúde do pipeline
