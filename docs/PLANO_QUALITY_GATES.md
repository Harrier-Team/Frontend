# Quality Gates — execução do plano

Implementação concluída no frontend em 26/10/2026. O estado térmico continua definido somente pelos resultados do backend. A barra e as faixas fixas de temperatura permanecem removidas.

## Cadastro e edição

O formulário oferece três tipos, declarados em um catálogo central usado também nas listagens, vínculos e resultados:

| Tipo | Nome apresentado | Unidade | Limites aceitos |
|---|---|---|---|
| `temperatura.limiar_estatico` | Limite de temperatura | °C | -55 a 200 |
| `temperatura.gradiente_termico` | Velocidade de aquecimento | °C/min | Não negativos |
| `temperatura.assimetria_escovas` | Diferença entre escovas | °C de diferença | Não negativos |

Os parâmetros continuam sendo `aviso` e `critico`, ambos finitos, com aviso menor que crítico. O backend atual já aceita até 200 °C no cadastro/edição do limiar estático; a divergência anterior foi resolvida no contrato consultado.

- `tipoRegra` é enviado explicitamente na criação, edição, pausa e reativação.
- Abrir uma regra preserva seu tipo e seus parâmetros.
- Trocar o tipo limpa os dois limites, preservando nome e descrição, para não reinterpretar valores de outra grandeza.
- Novas regras começam sem valores de limite sugeridos. Cabe ao usuário configurar os limites do equipamento.
- Erros de campo recebidos em Problem Details são apresentados no formulário. Em falhas HTTP, o modal e os valores digitados permanecem abertos.
- Tipos futuros continuam visíveis por seu identificador. A edição e a alternância do catálogo ficam protegidas para não converter um tipo desconhecido ou destruir seus parâmetros.

## Apresentação e diagnósticos

O catálogo e os vínculos do motor mostram nome do tipo e limites com sua unidade. Os resultados mostram observado, limite, unidade e diagnóstico do backend. Valores ausentes continuam indisponíveis, sem serem substituídos por zero.

Os resultados de gradiente exibem temperatura anterior e intervalo entre amostras quando esses metadados são fornecidos. Os de assimetria exibem temperaturas mínima e máxima. Tipos desconhecidos não recebem unidade inventada.

Os gates em alerta permanecem ordenados do crítico ao aviso, com texto e cor: verde para normal, amarelo para atenção/alerta preditivo e vermelho para crítico. O formato numérico do SignalR e o textual do HTTP são normalizados. Códigos estruturados conhecidos preservam a severidade indicada pelo backend, inclusive em leituras que já estavam na memória da página.

`DADOS_INSUFICIENTES` ou `metadados.avaliacaoConcluida=false` são apresentados como “Dados insuficientes”, em uma seção neutra de avaliação indisponível. Eles não são contados como normais nem como alertas. Sem avaliação válida, a escova e o motor ficam “Sem avaliação”, com indicador e filtro próprios. Não há cálculo de regras no navegador.

## Dependências do backend verificadas

A cópia local do backend já contém as seguintes mudanças, conferidas por leitura do código e por seus testes isolados:

- O GET da última leitura carrega a amostra anterior e as leituras do motor no mesmo instante para reavaliar gradiente e assimetria. O booleano de alerta é recalculado com os resultados atuais.
- O processamento rejeita lotes que misturam motores ou não incluem todos os sensores cadastrados do motor.
- Falta de histórico para gradiente e falta de pelo menos duas escovas para assimetria geram `DADOS_INSUFICIENTES`, com `avaliacaoConcluida=false`.
- O validador de regras estáticas aceita -55 a 200 °C.

Essas mudanças já estavam no backend consultado e não foram reescritas nesta execução do frontend. Nenhuma migration ou alteração de banco foi feita por esta execução.

## Condições de uso e limites preservados

- Gradiente precisa de duas amostras com intervalo positivo. A taxa usa o horário de recebimento no servidor; o ESP não envia um horário independente de aquisição.
- Assimetria precisa de pelo menos duas escovas do mesmo motor enviadas no mesmo lote. Com uma única escova, o resultado esperado é dados insuficientes. Cadastrar a regra não cria medições adicionais.
- O GET reconstrói o contexto usando o instante de recebimento persistido. O protocolo atual não possui identificador persistente de mensagem/lote.
- Não foi criado histórico persistido de resultados de gates, nem gráficos dependentes desse histórico.

## Verificação realizada

- Frontend: **88 testes passaram**; typecheck, lint e build passaram.
- Backend: **34 testes unitários passaram**, usando os projetos atuais e artefatos de compilação isolados na pasta de trabalho.
- Os testes cobrem os três payloads, preservação do tipo ao editar/alternar, mudança de unidade, limites e valores não finitos, erros HTTP/campos, tipos futuros, metadados, dados insuficientes, GET e SignalR.
- No navegador local foram conferidos o seletor com os três tipos, as unidades, a limpeza dos limites ao trocar de tipo e as mensagens de validação local. Não foi salvo cadastro de exemplo nem enviada telemetria sintética.
- Testes do backend incluem reavaliação de gradiente/assimetria ao recarregar, limites estáticos até 200 °C e proteção de lotes. Relatório TRX em `Hackatohm/output/execucao_quality_gates_2026-10-26/results/backend-unit.trx`.

## Arquivos principais

- `helpers/tipoRegraHelper.ts`: catálogo, unidades, limites e metadados.
- `helpers/regraFormHelper.ts` e `helpers/regraPayloadHelper.ts`: inicialização e payloads seguros.
- `helpers/validationHelper.ts`: validação por tipo e mapeamento de erros do servidor.
- `components/QualityRuleForm.tsx`, `QualityRuleList.tsx` e `MotorQualityRulesSection.tsx`: cadastro, catálogo e vínculos.
- `components/QualityGateResult.tsx`, `QualityGateResultList.tsx` e `helpers/qualityGateHelper.ts`: diagnósticos, cores e avaliação indisponível.
