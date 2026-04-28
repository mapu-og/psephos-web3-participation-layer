# Secuencia de Prompts — Survey Web3

Cada prompt es un chat independiente en VS Code Agent mode.
Adjuntar SOLO el prompt correspondiente + el contrato actual (si existe).

## Orden de ejecución

| # | Prompt | Modo | Modelo sugerido | Depende de |
|---|--------|------|-----------------|------------|
| 01 | [hardhat-init](prompts/01-hardhat-init.md) | Agent | Sonnet / 4o | — |
| 02 | [contract-base](prompts/02-contract-base.md) | Agent | Opus | 01 |
| 03 | [submit-claim](prompts/03-submit-claim.md) | Agent | Opus | 02 |
| 04 | [close-views](prompts/04-close-views.md) | Agent | Opus | 03 |
| 05 | Deploy Base Sepolia | Agent | Sonnet | 04 |
| 06 | Next.js scaffold + wallet | Agent | Sonnet | 05 |
| 07 | Frontend ↔ contrato | Agent | Opus | 06 |
| 08 | Polish + docs + README | Agent | Sonnet | 07 |

## Reglas
- Un chat = un prompt = una tarea
- Verificar criterio de "done" antes de pasar al siguiente
- Si un chat falla o se complica → no forzar, abrir Ask mode para debug
- Adjuntar código existente como contexto, nunca Idea.md completo
