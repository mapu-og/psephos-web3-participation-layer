# RULES.md — Comportamiento del Agente
# Alchemy University · Ethereum Developer Bootcamp
# Proyecto: Survey Web3 (encuestas pagadas on-chain)

---

## Principio central

Ejecutar y terminar. No confirmar vacío. No hacer loops de preguntas.
Si hay ambigüedad menor → asumir la opción más conservadora, ejecutar, y declarar qué se asumió.
Solo preguntar si la decisión es costosa de revertir (reestructurar contrato, cambiar de framework, borrar algo).
En todo lo demás: elige la mejor opción, hazlo, y di qué hiciste y por qué en 1 línea.

---

## Formato de respuesta

- Headers claros y secciones cortas
- Bloques de código siempre con lenguaje declarado
- Sin explicaciones largas si no fueron pedidas
- Código > prosa — si puedes responder con código, no escribas un párrafo
- Al final de cada respuesta, siempre:

```
✅ COMPLETADO: [qué se hizo en 1 línea]
📌 Siguiente: [qué debe hacer el usuario ahora]
```

Si la tarea no se completó:

```
⏸️ BLOQUEADO: [razón concreta]
📌 Para desbloquear: [acción específica que necesito del usuario]
```

---

## Modo de trabajo

- Siempre ejecución directa — no hay "modos" que elegir
- Una tarea pequeña y clara a la vez
- Siempre correr tests/verificar después de cada cambio
- Si algo se complica → decir qué falló y qué se necesita, sin menú de opciones

---

## Anti-alucinación

1. **No inventar APIs** — solo usar funciones que existan en OpenZeppelin, Hardhat, viem, wagmi
2. **No agregar features fuera del MVP** — si no está en Idea.md sección 2, no lo implementes
3. **No usar patterns innecesarios** — no proxies, no upgradeable, no diamond
4. **Verificar antes de afirmar** — si no estás seguro de que una función/método existe, decirlo
5. **No leer archivos completos sin necesidad** — referenciar por sección
6. **Código > prosa** — si puedes responder con código, no escribas un párrafo

---

## Constraints técnicos del proyecto

| Constraint | Valor |
|-----------|-------|
| Solidity | `^0.8.20` |
| Framework | Hardhat |
| Network | Base Sepolia (dev) → Base Mainnet (prod) |
| Frontend | Next.js + Tailwind + RainbowKit + viem |
| Contratos | OpenZeppelin 5.x (`ReentrancyGuard`, `Ownable`, `Pausable`) |
| Tests | Hardhat + chai/expect |
| Package manager | npm |
| Node.js | 18+ |
| No usar | Foundry, Truffle, ethers.js v5, proxy patterns |

---

## Reglas de completitud

1. Cada tarea tiene criterio de "done" definido antes de empezar
2. No avanzar sin output verificable (test pasando, compilación exitosa, archivo creado)
3. Si una tarea toma más de 1 chat razonable → dividirla primero
4. Al cerrar cada tarea → qué se hizo | qué queda | siguiente paso

---

## Gestión de contexto

- No adjuntar Idea.md completo — solo la sección relevante al task actual
- `au-hardhat-practice/` es referencia de aprendizaje, no del proyecto final
- El proyecto final vive en `alchemy-final/`
- Para subtareas mecánicas (boilerplate, config), sugerir modelo rápido (Sonnet/4o)