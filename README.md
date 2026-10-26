# Hackatohm Frontend

Painel web para monitoramento de motores, sensores e telemetria do projeto
Hackatohm. A aplicação recebe atualizações em tempo real do backend por
SignalR.

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

- Dashboard com indicadores do estado dos motores.
- Cadastro, listagem, detalhamento e exclusão protegida de motores.
- Cadastro e consulta de sensores, incluindo ping de sensor.
- Atualizações de temperatura e conexão em tempo real.
- Primeira leitura persistida carregada pela API quando disponível.
- Reconexão automática do cliente SignalR.
- Catálogo de regras de Quality Gates.
- Associação, ativação, desativação e remoção de Quality Gates por motor.
- Exibição de diagnósticos de Quality Gates nas leituras realtime.

## Contratos de API utilizados

O cliente HTTP usa o prefixo `/api`, configurado em
`src/services/api.ts`. As rotas utilizadas atualmente são:

```text
GET    /api/motores
GET    /api/motores/{id}
POST   /api/motores
DELETE /api/motores/{id}
POST   /api/motores/sensores/{sensorId}/ping

POST   /api/sensores
GET    /api/sensores/{sensorId}

GET    /api/leituras?espMacAddress={mac}&numeroEscova={numero}

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

O hub SignalR é conectado por `/api/telemetriaHub` e recebe os eventos
`ReceberTelemetria` e `ReceberLoteTelemetria`. Os resultados de Quality Gates
são normalizados pelo frontend como uma lista, inclusive quando não houver
resultados.

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
│   │   └── telemetria/       SignalR, leituras e status de sensores
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

- validação de regras de Quality Gates;
- limites de temperatura;
- classificação e consolidação do status dos motores;
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
