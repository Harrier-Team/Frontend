# Hackatohm Frontend

Painel web para monitoramento de motores, sensores e telemetria do projeto
Hackatohm. A aplicação recebe atualizações em tempo real do backend por
SignalR.

## Tecnologias

- React 19
- Vite 8
- TypeScript e JavaScript
- Tailwind CSS 4
- React Router
- Axios
- SignalR

## Requisitos

- Node.js 24 ou versão compatível com Vite 8
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
npm run build
npm run preview
```

`npm run preview` serve o build localmente. O proxy configurado para
desenvolvimento não substitui a configuração de encaminhamento de `/api` e
SignalR necessária no ambiente de produção.

## Funcionalidades

- Dashboard com indicadores do estado dos motores.
- Cadastro, listagem e detalhamento de motores e sensores.
- Atualizações de temperatura e conexão em tempo real.
- Reconexão automática do cliente SignalR.

O gerenciamento de regras de qualidade e a apresentação detalhada dos
resultados estão especificados em
[`painel-hackatohm/docs/specs/quality-gates-frontend.spec.md`](painel-hackatohm/docs/specs/quality-gates-frontend.spec.md)
e serão implementados em etapa própria.

## Estrutura

```text
painel-hackatohm/
├── public/       Arquivos estáticos
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── utils/
├── docs/specs/   Especificações funcionais
├── package.json
└── vite.config.js
```

## Configuração do backend

O endereço de desenvolvimento do proxy está definido em
`painel-hackatohm/vite.config.js` e aponta para `http://127.0.0.1:5281`, que
corresponde ao perfil HTTP configurado no backend. Se o backend usar outro
endereço, atualize o destino do proxy antes de iniciar o Vite.

Em produção, configure o servidor web ou gateway para encaminhar as rotas `/api`
ao backend, incluindo a negociação e o transporte WebSocket do SignalR.
