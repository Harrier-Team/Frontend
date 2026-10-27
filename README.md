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

`npm run preview` serve o build localmente. O proxy configurado para
desenvolvimento não substitui a configuração de encaminhamento de `/api` e
SignalR necessária no ambiente de produção.

## Funcionalidades

- Visão geral dos motores ordenada por urgência, com filtro por estado.
- Severidade sempre vinda do backend (`severidade` dos gates e
  `severidadeGeral` do status do motor); o painel não classifica por
  temperatura.
- Estados de avaliação separados da severidade: "Aguardando amostras"
  (`DADOS_INSUFICIENTES`), "Sem regras" e "Sem leitura".
- Frescor do dado por motor: Ao vivo (menos de 30 s), Atrasado, e Degradado ou
  Offline conforme a `situacao` do backend. Silêncio não é normalidade: o
  último diagnóstico fica visível e marcado como desatualizado.
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
- Catálogo de regras de Quality Gates com os três tipos do backend: limiar
  estático (°C), gradiente térmico (°C/min) e assimetria entre escovas (°C de
  diferença). A edição envia o objeto completo, incluindo `tipoRegra`.
- Associação, ativação, desativação e remoção de Quality Gates por motor; o
  status dos motores afetados é recarregado após cada alteração.
- Exibição de diagnósticos de Quality Gates com valor e limite na unidade do
  tipo da regra.
- O medidor de temperatura mostra faixas de aviso e crítico apenas quando o
  motor tem uma regra de limiar estático ativa.
- Falhas de rede ou de servidor aparecem como erro com opção de tentar de novo,
  nunca como lista vazia ou "motor não encontrado".

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
│   │   ├── motores/          Motores, sensores e vínculos por motor
│   │   ├── quality-gates/    Regras, resultados e contratos de qualidade
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

- validação dos três tipos de regra de Quality Gates e seus limites;
- formatação de valores por `tipoRegra` (°C, °C/min, diferença em °C);
- estados de avaliação, consolidação de severidade e frescor do dado;
- store de telemetria: deduplicação, monotonicidade, recarga ao conectar e
  reconectar, vigia de silêncio e tratamento de erros;
- limites do medidor a partir da regra vinculada;
- validação do MAC do ESP e do cadastro de motor;
- formatação de severidades e temperaturas.

Execute a suíte com:

```powershell
npm test
```

## Configuração do backend

O endereço de desenvolvimento do proxy está definido em
`painel-hackatohm/vite.config.js` e aponta para `http://127.0.0.1:5281`, que
corresponde ao perfil HTTP configurado no backend. Se o backend usar outro
endereço, atualize o destino do proxy antes de iniciar o Vite.

Em produção, configure o servidor web ou gateway para encaminhar as rotas `/api`
ao backend, incluindo a negociação e o transporte WebSocket do SignalR.
