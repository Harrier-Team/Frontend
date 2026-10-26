# Sistema visual Harrier

A identidade segue as duas referências da pasta [Fontes para o Frontend](https://drive.google.com/drive/folders/1-Dt7jn4NVHQD9gUebfiisPHf0TV7BXV_) do projeto, consultadas em 26/10/2026: a marca Harrier metálica e a ilustração do anel coletor. Os arquivos originais foram incorporados como `src/assets/harrier-identity.jpg` e `src/assets/collector-reference.jpg`.

## Paleta e marca

Grafite frio, superfícies em aço e texto prata. O branco quente do ponto de luz da logo destaca ações primárias e foco. Verde, âmbar e coral identificam os estados com texto sempre presente. Os tokens ficam em `src/styles/tokens.css`; bordas e textos secundários foram clareados para separar melhor as superfícies.

A logo usa o arquivo de maior resolução do Drive, com enquadramento em CSS do símbolo e nome tipográfico ao lado. A proporção original é preservada; o fundo escuro se integra ao cabeçalho por mistura de tela. A ilustração do anel é contextual e decorativa: não representa geometria medida ou estado dos sensores.

## Tipografia e hierarquia

Archivo Variable, hospedada localmente por `@fontsource-variable/archivo`. Títulos usam largura 118% (`.display`); números são tabulares (`.num`). O painel separa o resumo do sistema, cinco indicadores por estado e a lista de motores. A maior leitura é identificada como registrada, sem prometer atualização ao vivo quando a telemetria está desconectada.

## Interação

- Os indicadores filtram os motores, incluindo estados com zero resultados. Selecionar novamente o indicador ativo volta a todos.
- Busca por nome e tipo ignora acentos e maiúsculas. Busca e filtro de estado podem ser combinados e limpos juntos.
- Erro inicial mostra indicadores indisponíveis em vez de zeros. Falha com dados existentes preserva a lista e exibe o erro.
- Cadastro inicial explica motor, MAC do ESP32 e escovas. O modelo do sensor é preenchido pelo usuário; MLX90614 aparece somente como exemplo, coerente com a bancada descrita no Drive.
- Cabeçalho adapta a navegação em telas menores. Foco visível, link para pular navegação e movimento reduzido permanecem disponíveis.
- Estados de motor e escova têm rótulos; graus Celsius ficam explícitos nas leituras.

## Classificação térmica

Os limiares existentes do painel foram preservados: atenção a partir de 60 °C, crítico a partir de 80 °C ou alerta de desgaste. A legenda lê as constantes de `statusHelper.ts`. A explicação distingue essas faixas visuais dos limites operacionais, que exigem validação por equipamento, e das regras de qualidade vinculadas a cada motor. O índice de contexto no Drive não valida os relatos de 75–90 °C como limites de alarme.

## Estrutura

- `/`: visão geral; `/motores` e `/inicio` redirecionam para ela.
- `/motores/:id`: escovas e regras do motor.
- `/regras-qualidade`: catálogo de regras de qualidade.
