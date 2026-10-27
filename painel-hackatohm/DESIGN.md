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
   na unidade correta (°C, °C/min, diferença em °C ou minutos na previsão).
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
| Sem classificação | `CircleHelp` | "Sem classificação" | `ink-3`; severidade desconhecida nunca vira Normal |

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

| `tipoRegra` | Rótulo | Subtítulo técnico | Unidade | Faixa dos limites |
| --- | --- | --- | --- | --- |
| `temperatura.limiar_estatico` | Limite de temperatura | Limiar estático | °C | -55 a 200 |
| `temperatura.gradiente_termico` | Velocidade de aquecimento | Gradiente térmico | °C/min | ≥ 0 |
| `temperatura.assimetria_escovas` | Diferença entre escovas | Assimetria entre escovas | °C de diferença | ≥ 0 |
| `temperatura.previsao_tendencia` | Tempo até o limite | Previsão por tendência | min | aviso > crítico > 0 (ordem invertida) |

Categorias do backend: **Preditivo** (previsão por tendência), **Aceleração**
(gradiente) e **Condição** (limiar e assimetria). O seletor de tipo e o catálogo
usam esses grupos.

- Tipo desconhecido aparece pelo identificador, sem unidade inventada, e não
  pode ser editado nem alternado pelo painel.
- Trocar o tipo no formulário limpa os limites; regras novas começam sem
  valores sugeridos (limites dependem do equipamento).

- Nos tipos de temperatura, sempre `aviso < critico`; comparação `>=` (igual ao
  limite já dispara). Na previsão a ordem é invertida: `aviso` e `critico` são
  minutos de antecedência, com `aviso > critico > 0`.
- Formatar `valorObservado` e `valorLimite` pela unidade do `tipoRegra`. Não
  acrescentar "°C" indiscriminadamente.
- Previsão por tendência: `temperaturaLimite` (°C, -55 a 200, obrigatório) e
  `janela` (inteiro de 5 a 60, opcional, padrão 12, em campo avançado). Esses
  dois campos **só** vão no corpo do tipo de previsão (nos outros o backend
  responde 400) e trocar de tipo no formulário os descarta. O backend devolve
  uma única mensagem para `parametros`; nesse tipo ela aparece no topo do
  formulário.
- Edição (`PUT`) envia o objeto completo, **incluindo `tipoRegra`**: omitir o
  tipo faz o backend convertê-la em limiar estático.
- A assimetria pertence ao motor: o backend repete o mesmo resultado em cada
  escova, mas a tela mostra uma vez, no escopo do motor. Ela também não entra
  na severidade de uma escova isolada nem nos marcadores da curva dela.

### Previsão por tendência

- A estimativa **vem do backend**: `valorObservado` são os minutos até o limite
  (0 = a reta já passou dele), `valorLimite` é o horizonte atingido e os
  `metadados` trazem `inclinacaoCelsiusPorMinuto`, `temperaturaLimite` e
  `amostras`. O painel não ajusta reta nem classifica. Com `Normal` o backend não
  manda valores, então o texto calmo fala do horizonte da regra ("Sem tendência
  de atingir 95 °C nos próximos 30 min"), nunca de um número. Menos de 5
  leituras é "Aguardando amostras".
- Formato: "~8 min", "~1 h 20 min", "agora" para 0, e o horário previsto
  "≈ 14:38" = `dataHora` do lote + minutos. Sem contagem regressiva por
  segundo, que fingiria precisão. Valor e horizonte aparecem como "~8 min até
  95 °C" e "horizonte 10 min", nunca com "≥".
- Telas: cartão "Previsão" no detalhe do motor; relógio e minutos na escova do
  anel coletor (a cor continua vindo da severidade); "95 °C em ~8 min" na linha
  do motor; frase grande "Escova 2 → 95 °C em ~8 min" no modo apresentação.

### Alertas de manutenção

- Um alerta é um **evento persistido** no backend: abre quando um gate passa a
  disparar, é atualizado enquanto continua e é encerrado (`resolvidoEm`) quando
  para; se voltar a disparar, abre outro. A chave é regra + sensor; a assimetria
  gera um por motor, com `sensorId` e `numeroEscova` nulos ("Motor inteiro").
  Regra excluída: `regraQualidadeId` nulo e o alerta continua legível ("regra
  excluída").
- `GET /api/alertas` filtra por `motorId`, `ativo`, `categoria`, `tipoRegra` e
  `severidade`, com `pagina` (≥ 1) e `tamanho` (1 a 200, padrão 50), e responde
  `{ itens, pagina, tamanho, total }`.
- O evento `ReceberAlertaManutencao` (mesmo item) só chega quando um alerta abre
  ou **sobe** de severidade; encerramento e queda não geram evento. Por isso a
  lista em aberto é recarregada ao conectar e reconectar o hub, após o status de
  um motor com alerta aberto (espera de 2 s) e ao voltar o foco para a aba. O
  evento insere ou atualiza pelo `id`, sem duplicar.
- O texto principal do alerta é montado pelo painel (vírgula decimal e unidade
  do tipo); a `mensagem` do backend fica como detalhe técnico recolhido.
  `categoria`, `tipoRegra` ou severidade desconhecidos não quebram: aparecem
  pelo identificador, com o número sem unidade; severidade desconhecida é
  "Sem classificação".
- O painel **não** detecta severidade por conta própria: avisos e contador vêm
  dos alertas. Crítico gera toast que fica até ser dispensado e `(N)` no título
  da aba (N = críticos em aberto não reconhecidos); previsão nova gera um toast
  discreto; alerta que continua aberto não avisa de novo. "Reconhecer" é só do
  navegador (`localStorage`, protegido por try/catch), com chave `id` + início.
- Se `/api/alertas` responder 404 (backend sem a funcionalidade), a página mostra
  "Alertas indisponíveis nesta versão da API" e mantém o registro de conexão; nada
  mais quebra.

### Histórico

- O backend não expõe histórico por período nem persiste resultados de gates.
  Gráficos e eventos usam uma janela em memória (buffer circular por escova,
  ~360 pontos) e devem ser rotulados como "da sessão".
- Redução de pontos só no desenho, preservando picos e pontos de alerta.

### Cadastro

- O backend não devolve o MAC no detalhe do motor; ele chega nos lotes
  (`espMacAddress`). Antes do primeiro lote, o painel mostra o MAC informado no
  cadastro, guardado só na aba (`sessionStorage`).
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
| `line` | `#282f36` | Divisores |
| `line-strong` | `#3b4651` | Bordas de campos, eixos do gráfico |
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
| `series-1` … `series-5` | `#2a66b0` `#6d55c4` `#0f737d` `#4b5563` `#4549c9` |

Ativado por `data-theme="light"` no `<html>`; os componentes só usam tokens. O padrão é o tema escuro; a escolha do botão do cabeçalho fica em `localStorage` e é aplicada antes da primeira pintura. `series-1` e `series-3` foram escurecidos em relação à primeira proposta para passar AA sobre `raised`; um teste (`src/styles/contraste.test.ts`) mede todos os pares nos dois temas.

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
| `Tabs` | Abas acessíveis (setas, Home e End) |
| `Segmented` | Seleção única em linha (filtros, janela do gráfico), padrão radiogroup com setas |
| `EscalaLimites` | Prévia normal, aviso e crítico de uma regra, com o valor atual como ponto de luz |
| `EscalaAntecedencia` | Prévia da previsão: régua de tempo da direita para a esquerda (agora, crítico, aviso, sem urgência) e a frase "Avisa 30 min antes de 95 °C; crítico 10 min antes" |
| `PrevisaoMotor` | Cartão "Previsão" do detalhe: escova de menor tempo, as outras em lista, ou a linha calma do horizonte |
| `TabelaAlertas` | Alertas com severidade, categoria, motor e escova, regra, valor, início, duração e "Reconhecer" |
| `Toast` | Aviso não bloqueante, `aria-live="polite"`, some sozinho em 8 s exceto Crítico. O toast Crítico fica fora de região viva: o anúncio assertivo vem só do `AnunciadorSeveridade` global, uma vez por transição |
| `CopyableCode` | Texto mono com botão de copiar |
| `CollectorRing` | Vista esquemática do anel coletor com as escovas ao redor (ver "Anel coletor") |
| `ApiErrorState` | Erro de rede ou de servidor com causa provável e "Tentar de novo" |

Base já existente e mantida: `Button`, `IconButton`, `Dialog`,
`ConfirmDialog`, `Menu`, `Panel`, `Switch`, `Alert`, `EmptyState`,
`LoadingState`.

## Gráfico de tendência

Desenhado em SVG próprio, sem biblioteca de gráficos.

- Eixo Y em °C com margem de 5 °C acima do maior valor ou do limite crítico.
- Eixo X em horário local `HH:mm:ss`; janelas de 5 min, 15 min e sessão.
- Linhas de 1,5 px; o ponto de luz marca o último valor de cada escova.
- Limites de aviso e crítico da regra de limiar estático como linhas
  tracejadas de 1 px nas cores de severidade, com rótulo à direita.
- Marcador com o símbolo da severidade **só na transição**: no primeiro ponto
  em que a escova entra numa severidade anormal ou mais grave. Pontos que
  permanecem no mesmo estado não repetem o marcador; o trecho em alerta é
  desenhado na cor da severidade, com a mesma espessura.
- Lacunas maiores que 3× a cadência quebram a linha (não interpolar).
- Crosshair mostra hora, valor de cada escova e ΔT naquele lote.
- Título indica "Janela da sessão": o backend não fornece histórico.
- Previsão: com o gate de tendência disparando, linha horizontal tracejada na
  temperatura limite, segmento de projeção tracejado do valor da reta no lote
  (`temperaturaLimite − inclinação × minutos`) até (horário previsto, limite),
  numa faixa hachurada rotulada "Estimativa". O eixo X avança até o horário
  previsto, no máximo +30 min; a projeção é cortada nesse teto. Tudo deriva de
  valores do backend e some quando o gate para de disparar.
- Alternativa acessível: tabela com os últimos 20 lotes, acessível por botão.

## Anel coletor

Peça central do detalhe do motor, inspirada no render do anel coletor da
identidade Harrier (`src/assets/collector-reference.jpg`).

- SVG com o anel em traço de aço e os porta-escovas distribuídos igualmente
  pelo número da escova: escova 1 no topo, sentido horário.
- **É esquemático.** As posições não são medidas; a legenda fixa diz
  "Representação esquemática: posições não medidas". O render fotográfico é
  só decorativo (`alt=""`) e nunca indica posição ou estado de sensor.
- Cada porta-escova mostra número, temperatura e símbolo de severidade, com as
  mesmas regras de cor dos estados: neutro em Normal, tracejado quando sem
  leitura ou desatualizado.
- Com o gate de assimetria em alerta, o arco entre a escova mais quente e a
  mais fria recebe realce na cor da severidade e o centro mostra o ΔT. Sem
  alerta, o centro mostra a maior temperatura.
- A seleção de escova é compartilhada na página: foco ou hover no anel destaca
  o cartão e a linha do gráfico, e vice-versa. Setas percorrem as escovas.
- Versão mini (28 px) na linha do motor, só com pontos por escova.

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
- `/motores/:id` detalhe do motor, aba Monitoramento (`/motores/:id/regras` e
  `/motores/:id/dispositivo` abrem as outras abas)
- `/alertas` alertas de manutenção: abas Em aberto, Histórico e Conexão, filtros na URL (`/eventos` redireciona)
- `/regras-qualidade` quality gates
- `/sistema` saúde do pipeline
- `?modo=tv` em qualquer rota: modo apresentação (só a visão geral, sem navegação; Esc sai)
