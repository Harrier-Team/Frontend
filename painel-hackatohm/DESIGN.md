# Sistema visual Harrier

A identidade segue as duas referências da pasta [Fontes para o Frontend](https://drive.google.com/drive/folders/1-Dt7jn4NVHQD9gUebfiisPHf0TV7BXV_) do projeto, consultadas em 26/10/2026: a marca Harrier metálica e a ilustração do anel coletor. Os arquivos originais foram incorporados como `src/assets/harrier-identity.jpg` e `src/assets/collector-reference.jpg`.

## Paleta e marca

Grafite frio, superfícies em aço e texto prata. O branco quente do ponto de luz da logo destaca ações primárias e foco. Verde, âmbar e coral identificam os estados com texto sempre presente. Os tokens ficam em `src/styles/tokens.css`; bordas e textos secundários foram clareados para separar melhor as superfícies.

A logo usa o arquivo de maior resolução do Drive, com enquadramento em CSS do símbolo e nome tipográfico ao lado. A proporção original é preservada; o fundo escuro se integra ao cabeçalho por mistura de tela. A ilustração do anel é contextual e decorativa: não representa geometria medida ou estado dos sensores.

## Tipografia e hierarquia

Archivo Variable, hospedada localmente por `@fontsource-variable/archivo`. Títulos usam largura 118% (`.display`); números são tabulares (`.num`). O painel separa o resumo do sistema, os indicadores por estado e a lista de motores. Há um indicador próprio para motores sem avaliação dos Quality Gates. A maior leitura é identificada como registrada, sem prometer atualização ao vivo quando a telemetria está desconectada.

## Interação

- Os indicadores filtram os motores, incluindo estados com zero resultados. Selecionar novamente o indicador ativo volta a todos.
- Busca por nome e tipo ignora acentos e maiúsculas. Busca e filtro de estado podem ser combinados e limpos juntos.
- Erro inicial mostra indicadores indisponíveis em vez de zeros. Falha com dados existentes preserva a lista e exibe o erro.
- Cadastro inicial explica motor, MAC do ESP32 e escovas. O modelo do sensor é preenchido pelo usuário; MLX90614 aparece somente como exemplo, coerente com a bancada descrita no Drive.
- Cabeçalho adapta a navegação em telas menores. Foco visível, link para pular navegação e movimento reduzido permanecem disponíveis.
- Estados de motor e escova têm rótulos; graus Celsius ficam explícitos nas leituras.

## Classificação térmica

O estado térmico segue somente os resultados dos Quality Gates: atenção/alerta preditivo em amarelo e crítico em vermelho. Sem resultados válidos, aparece “Sem avaliação” em tom neutro, com indicador e filtro próprios. Ter uma leitura ou um IP não basta para classificar um motor como estável. O booleano de alerta de desgaste não determina a severidade.

As referências de 60/80 °C eram constantes visuais do frontend, sem justificativa técnica registrada para a máquina do projeto. Foram removidas do classificador junto com a legenda e a barra térmica. A interface preserva a temperatura numérica, o horário, o IP e os resultados das regras. Limites operacionais devem vir das regras configuradas para o equipamento.

Os gates que sinalizam uma ocorrência aparecem sob “Gates em alerta”, com críticos antes de avisos, borda/fundo discretos e rótulo colorido. A lista completa inclui os normais em verde. Cada estado tem texto além da cor; resultados desconhecidos aparecem como “Sem classificação” em tom neutro. Valores numéricos ou textuais de severidade são normalizados antes de classificar ou exibir uma leitura, incluindo dados que já estavam na memória da página.

## Estrutura

- `/`: visão geral; `/motores` e `/inicio` redirecionam para ela.
- `/motores/:id`: escovas e regras do motor.
- `/regras-qualidade`: catálogo de regras de qualidade.
