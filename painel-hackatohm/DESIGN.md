# Sistema visual

Derivado da logo Harrier: grafite frio, aço escovado e um único ponto de luz.

## Princípios
1. **Calmo por padrão.** O estado estável usa tons neutros. Cor (âmbar, brasa) só aparece onde há atenção.
2. **Mostrar só o que decide.** Lista de motores com temperatura por escova; diagnósticos de quality gates só aparecem quando disparam, o resto fica recolhido.
3. **Um gesto de marca.** O ponto de luz do eclipse vira o marcador do `ThermalGauge`: mostra a leitura e a distância até os limites de 60 °C e 80 °C.
4. **Cor nunca sozinha.** Todo estado tem texto ou `aria-label` além da cor.

## Tokens (`src/styles/tokens.css`)
| Token | Uso |
| --- | --- |
| `canvas` `panel` `raised` | fundo, superfícies, hover |
| `line` `line-strong` | divisores, bordas de campos |
| `ink` `ink-2` `ink-3` | texto primário, secundário, terciário |
| `flare` | acento da marca: ação primária, foco, "ao vivo" |
| `ok` `warn` `hot` `off` | estados (pontos, marcadores, valores) |

## Tipografia
Archivo Variable (self-hosted via `@fontsource-variable/archivo`). Títulos usam largura 118% (`.display`), ecoando as letras estendidas da logo. Números usam `.num` (tabulares).

## Estrutura
- `/` visão geral (substitui `/motores` e `/inicio`, que redirecionam)
- `/motores/:id` detalhe do motor
- `/regras-qualidade` quality gates
