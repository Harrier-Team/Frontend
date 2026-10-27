# Hackatohm Frontend

Painel web Harrier para telemetria térmica e manutenção preditiva das escovas
de motores elétricos, desenvolvido para a Hackatohm. O painel acompanha as
temperaturas em tempo real por SignalR e exibe os diagnósticos dos Quality
Gates avaliados pelo backend.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [painel-hackatohm/DESIGN.md](painel-hackatohm/DESIGN.md) | Como o painel deve se comportar: princípios, modelo de estados, regras de dados, tokens e componentes |
| `../Backend/docs/` | Contratos HTTP, SignalR e regras de monitoramento (fonte de verdade) |

Em caso de divergência, os contratos do Backend prevalecem.

## Tecnologias

- React 19
- Vite 8
- TypeScript
- Tailwind CSS 4
- React Router 7
- Axios
- SignalR client
- Vitest

## Requisitos

- Node.js 20.19+ (ou versão compatível com Vite 8)
- npm
- Backend Hackatohm disponível localmente em `http://127.0.0.1:5281`

## Instalação e execução

Na pasta da aplicação:

```powershell
cd painel-hackatohm
npm ci
npm run dev
```

O Vite inicia o painel no endereço exibido no terminal. Durante o
desenvolvimento, as chamadas `/api` e a conexão SignalR são encaminhadas pelo
proxy local para `http://127.0.0.1:5281`. Inicie o backend antes de testar
funcionalidades que dependem da API ou do hub.

## Comandos

Execute os comandos abaixo dentro de `painel-hackatohm`:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run preview
```

`npm run lint` executa o Oxlint, `npm run typecheck` valida o TypeScript sem
gerar arquivos, `npm test` executa os testes unitários com Vitest e
`npm run build` gera a versão de produção.

As rotas são `/` (visão geral), `/motores/:id`, `/alertas` (`/eventos`
redireciona para ela), `/regras-qualidade` e `/sistema`.

`npm run preview` serve o build localmente. O proxy configurado para
desenvolvimento não substitui a configuração de encaminhamento de `/api` e
SignalR necessária no ambiente de produção.

## Funcionalidades

- Visão geral com a faixa "Estado do sistema" (render ilustrativo do anel
  coletor, só em telas largas), indicadores de estado clicáveis como filtro
  (inclusive com zero), busca por nome e tipo sem acentos, "Limpar filtros",
  contagem de resultados, botão de atualizar e passos do primeiro acesso. Lista
  ordenada por urgência, com mini anel por motor, título que responde "algum motor precisa de ação?", o motivo do
  motor mais grave, temperaturas por escova, sparkline da sessão, ΔT e idade do
  último lote.
- Severidade sempre vinda do backend (`severidade` dos gates e
  `severidadeGeral` do status do motor); o painel não classifica por
  temperatura.
- Estados de avaliação separados da severidade: "Aguardando amostras"
  (`DADOS_INSUFICIENTES`), "Sem regras" e "Sem leitura".
- Frescor do dado por motor: Ao vivo (menos de 30 s), Atrasado, e Degradado ou
  Offline conforme a `situacao` do backend. Silêncio não é normalidade: o
  último diagnóstico fica visível e marcado como desatualizado.
- Detalhe do motor com abas Monitoramento, Regras e Dispositivo
  (`/motores/:id`, `/motores/:id/regras`, `/motores/:id/dispositivo`): cartões
  por escova, cartão do motor com a assimetria (mostrada uma vez, no escopo do
  motor), anel coletor esquemático (posições não medidas) com seleção
  compartilhada entre anel, cartões e gráfico (hover, foco e setas), gráfico de
  tendência da sessão (5 min, 15 min e sessão, limites tracejados da regra do
  motor, marcador só na transição de severidade, trecho em alerta na cor da
  severidade, lacunas, crosshair e tabela acessível) e diagnósticos agrupados
  por regra, com metadados (temperatura anterior e intervalo no gradiente;
  mínima e máxima na assimetria). A aba Regras mostra a contagem de vínculos.
- Cadastro, detalhamento e exclusão protegida de motores e suas escovas. Cada
  motor tem um único MAC de ESP (`AA:BB:CC:DD:EE:FF`) e escovas com números
  positivos e únicos.
- Atualizações de temperatura em tempo real e indicador de conexão do hub.
- Status e diagnósticos do último lote carregados de
  `GET /api/motores/{id}/status` ao abrir o painel, ao conectar e ao
  reconectar o hub, e após 30 s sem lote de um motor.
- Janela da sessão em memória: até 360 pontos por escova, sem duplicar
  leituras repetidas e sem deixar uma resposta HTTP antiga sobrescrever o
  dado mais recente do hub.
- Reconexão automática do cliente SignalR.
- Catálogo de regras de Quality Gates com os quatro tipos do backend, com nome
  amigável e o técnico como subtítulo, agrupados pela categoria: Tempo até o
  limite (previsão por tendência, minutos; Preditivo), Velocidade de aquecimento
  (gradiente térmico, °C/min; Aceleração), Limite de temperatura (limiar
  estático, °C) e Diferença entre escovas (assimetria, °C de diferença;
  Condição). Tipo desconhecido aparece pelo
  identificador, sem unidade e somente leitura. Regras novas começam sem
  limites sugeridos; erros de campo do Problem Details aparecem no campo e o
  modal permanece aberto. A edição envia o objeto completo, incluindo `tipoRegra`.
- Severidade desconhecida vira "Sem classificação" (neutra), nunca Normal.
- Cadastro de motor com máscara de MAC, mensagens do Problem Details em
  linguagem de usuário e, ao salvar, abertura do motor com "Aguardando primeiro
  lote" e o MAC copiável.
- Quality gates com três cartões de tipo, campos com unidade e faixa, prévia da
  escala e catálogo agrupado por tipo com a quantidade de motores que usam cada
  regra.
- Associação, ativação, desativação e remoção de Quality Gates por motor; o
  status dos motores afetados é recarregado após cada alteração.
- Exibição de diagnósticos de Quality Gates com valor e limite na unidade do
  tipo da regra.
- O medidor de temperatura mostra faixas de aviso e crítico apenas quando o
  motor tem uma regra de limiar estático ativa.
- Falhas de rede ou de servidor aparecem como erro com opção de tentar de novo,
  nunca como lista vazia ou "motor não encontrado".
- Previsão por tendência: a regra "Tempo até o limite" usa aviso e crítico em
  minutos de antecedência (aviso maior que crítico), a temperatura a antecipar
  (-55 a 200 °C) e, em campo avançado, a janela de leituras (5 a 60, padrão 12).
  `temperaturaLimite` e `janela` só vão no corpo desse tipo. A estimativa vem
  sempre do backend: o painel mostra "~8 min", "~1 h 20 min" ou "agora" e o
  horário previsto ("≈ 14:38", horário do lote mais os minutos), sem contagem
  regressiva. Aparece no cartão "Previsão" do detalhe do motor, nos
  diagnósticos, no relógio do anel coletor, na linha do motor ("95 °C em
  ~8 min") e como frase grande no modo apresentação. No gráfico, a projeção é
  tracejada, rotulada "Estimativa", só existe enquanto o gate dispara e o eixo
  avança no máximo 30 min.
- Alertas de manutenção (`/alertas`), persistidos pelo backend: abas "Em
  aberto" (lista viva, mais graves primeiro), "Histórico" (paginado, 50 por
  página, com filtros de motor, situação, categoria, severidade e tipo de regra
  na URL) e "Conexão" (situação Online, Degradado e Offline do motor e quedas do
  hub, só desta sessão). O evento `ReceberAlertaManutencao` insere ou atualiza
  pelo `id`; como o encerramento não gera evento, a lista é recarregada ao
  conectar e reconectar o hub, após o status de um motor com alerta aberto (com
  espera de 2 s) e ao voltar o foco para a aba. O detalhe do motor tem a seção
  "Alertas" (abertos e os 10 últimos encerrados). Se `/api/alertas` responder
  404, a página mostra "Alertas indisponíveis nesta versão da API" e mantém o
  registro de conexão.
- Um alerta Crítico novo gera um aviso (toast) que fica até ser dispensado, e
  uma previsão nova gera um aviso discreto. O título da aba passa a `(N) …`
  enquanto houver críticos em aberto não reconhecidos. "Reconhecer" vale só
  neste navegador (`localStorage`). A mudança de severidade é anunciada a
  leitores de tela uma vez por transição (Crítico em `assertive`).
- Sistema (`/sistema`): `/health/live` e `/health/ready` (texto ou JSON),
  estado do hub, idade do último lote, lotes da sessão, cadência medida
  (mediana) e o caminho ESP, API, Fila, Banco, Hub e Painel com o estado de cada
  etapa (símbolo e texto, não só cor). Etapa que o painel não enxerga aparece
  como "Não verificado".
- Modo apresentação (`?modo=tv`, por exemplo `/?modo=tv`): só a visão geral,
  fonte grande, sem navegação e com as idades atualizadas sozinhas. Com um único
  motor, mostra o anel coletor grande e o gráfico abaixo. Esc ou o botão "Sair"
  voltam ao painel normal.
- Tema claro opcional (botão sol/lua no cabeçalho), pensado para projetor. O
  padrão é o escuro; a escolha fica em `localStorage`.
- Telas carregadas sob demanda (`React.lazy`); layout verificado em 375 px.

## Simulador de telemetria (somente desenvolvimento)

Para ver as telas sem o backend, inicie o Vite com a variável
`VITE_SIMULADOR=true`:

```powershell
cd painel-hackatohm
$env:VITE_SIMULADOR = "true"; npm run dev
```

```bash
VITE_SIMULADOR=true npm run dev
```

O simulador troca o transporte HTTP do axios e a fonte de eventos do store, sem
tocar nos componentes. Ele cria sete motores fictícios (aquecimento com subida
de gradiente e assimetria, crítico estável, normal, um que silencia 90 s depois
de abrir o painel, um que nunca envia lote, um sem regras e o Motor G, em
aquecimento lento, onde a previsão por tendência dispara minutos antes do limite
estático), quatro regras e
lotes a cada ~3 s (ruído suave: só a escova que aquece dispara gradiente;
`VITE_SIMULADOR_CADENCIA_S` muda o intervalo), com um histórico recente para o gráfico ter curva. Motores
cadastrados na tela começam a enviar lotes após ~9 s. `VITE_SIMULADOR_MOTORES=1`
mantém só o Motor A (útil para o modo apresentação com um único motor). O
simulador implementa a regra de tendência (mínimos quadrados, como o backend),
`GET /api/alertas` com filtros e paginação, o ciclo de vida dos alertas e o
evento `ReceberAlertaManutencao`; também responde a `/health/live` e
`/health/ready`. Enquanto ativo, o
cabeçalho mostra o selo "Simulação".

A condição é `import.meta.env.DEV && VITE_SIMULADOR === "true"`: o código do
simulador (`src/dev/`) não entra no build de produção.

## Contratos de API utilizados

O cliente HTTP usa o prefixo `/api`, configurado em
`src/services/api.ts`. As rotas utilizadas atualmente são:

```text
GET    /api/motores
GET    /api/motores/{id}
GET    /api/motores/{id}/status
POST   /api/motores
DELETE /api/motores/{id}
POST   /api/motores/sensores/{sensorId}/ping

POST   /api/sensores
GET    /api/sensores/{sensorId}

GET    /api/regras-qualidade
GET    /api/regras-qualidade/{id}
POST   /api/regras-qualidade
PUT    /api/regras-qualidade/{id}
DELETE /api/regras-qualidade/{id}

GET    /api/motores/{motorId}/regras-qualidade
GET    /api/motores/{motorId}/regras-qualidade/{regraId}
POST   /api/motores/{motorId}/regras-qualidade/{regraId}
PUT    /api/motores/{motorId}/regras-qualidade/{regraId}
DELETE /api/motores/{motorId}/regras-qualidade/{regraId}
```

O hub SignalR é conectado por `/api/telemetriaHub`. O painel usa
`ReceberLoteTelemetria` como única fonte de amostras (`ReceberTelemetria` é
ignorado para não contar a mesma leitura duas vezes) e `ReceberStatusMotor`
para o status agregado. Na página do motor, chama `AssinarMotor` ao entrar e
`DesassinarMotor` ao sair. Os resultados de Quality Gates são normalizados pelo
frontend como uma lista, inclusive quando não houver resultados.

### Limitações atuais do contrato

O backend atual não expõe rotas para editar motores ou atualizar/remover
sensores. Por isso, o frontend não apresenta uma ação de edição que faria uma
requisição inexistente. Para habilitar esse fluxo, o backend precisa fornecer
contratos explícitos para:

- atualizar nome e tipo do motor;
- adicionar um sensor a um motor existente;
- atualizar MAC, modelo ou número da escova;
- remover um sensor.

## Estrutura

```text
painel-hackatohm/
├── public/       Arquivos estáticos
├── src/
│   ├── app/                  Rotas e composição da aplicação
│   ├── components/           Componentes compartilhados e UI
│   ├── features/
│   │   ├── alertas/          Alertas de manutenção: serviço, store, página
│   │   ├── eventos/          Registro de conexão da sessão
│   │   ├── motores/          Motores, sensores e vínculos por motor
│   │   ├── quality-gates/    Regras, resultados e contratos de qualidade
│   │   ├── sistema/          Saúde da API e pipeline
│   │   ├── tema/             Tema claro e escuro
│   │   └── telemetria/       SignalR, store por motor e estados de dados
│   ├── hooks/                Provider e hooks de estado global
│   ├── services/             Cliente HTTP compartilhado
│   ├── styles/               Tokens visuais
│   └── utils/                Helpers compartilhados
├── package.json
├── tsconfig.json
├── vite.config.js
└── vitest.config.ts
```

Os imports internos usam o alias `@/`, por exemplo:

```ts
import { api } from '@/services/api';
```

## Testes

Os testes unitários atuais cobrem:

- validação dos quatro tipos de regra de Quality Gates e seus limites (na
  previsão, ordem invertida, temperatura limite e janela);
- formatação de valores por `tipoRegra` (°C, °C/min, diferença em °C);
- estados de avaliação, consolidação de severidade e frescor do dado;
- store de telemetria: deduplicação, monotonicidade, recarga ao conectar e
  reconectar, vigia de silêncio e tratamento de erros;
- limites do medidor a partir da regra vinculada;
- validação do MAC do ESP e do cadastro de motor;
- formatação de severidades e temperaturas, valores de gate (uma casa);
- previsão por tendência: leitura do gate, formatação em minutos e horário
  previsto, projeção do gráfico limitada a +30 min;
- alertas: normalização, filtros na URL, store (evento por `id`, recargas,
  404), reconhecimento no `localStorage` e avisos sem duplicar;
- registro de conexão da sessão e título da aba;
- mapeamento de saúde, cadência, pipeline do sistema e persistência do tema;
- contraste WCAG AA dos tokens nos dois temas.

Execute a suíte com:

```powershell
npm test
```

## Configuração do backend

O endereço de desenvolvimento do proxy está definido em
`painel-hackatohm/vite.config.js` e aponta para `http://127.0.0.1:5281`, que
corresponde ao perfil HTTP configurado no backend. Se o backend usar outro
endereço, atualize o destino do proxy antes de iniciar o Vite.

O proxy também encaminha `/health` (usado pela página Sistema).

Em produção, configure o servidor web ou gateway para encaminhar as rotas `/api`
e `/health` ao backend, incluindo a negociação e o transporte WebSocket do SignalR.
