# Prompt: Escribir SurveyPlatform.sol — Structs, Events e Interfaz

## Contexto
Proyecto de encuestas pagadas on-chain. Hardhat ya está inicializado en `alchemy-final/`. 
Referencia: Idea.md → Sección 2 (Core MVP) y Sección 5 (Stack).

## Task
Escribe el contrato `contracts/SurveyPlatform.sol` con SOLO la estructura base:

### Implementar
1. **Struct `Survey`:** id, creator, title, ipfsHash (preguntas), rewardPerResponse, maxResponses, responseCount, deadline, balance, active
2. **Struct `Response`:** respondent, surveyId, answerHash (IPFS CID), timestamp, claimed
3. **Mappings:** surveys, responses por survey, hasResponded (survey+wallet → bool)
4. **Events:** `SurveyCreated`, `AnswerSubmitted`, `RewardClaimed`, `SurveyClosed`
5. **Función `createSurvey()`** — payable, valida parámetros, deposita ETH, emite evento
6. **Herencia:** OpenZeppelin `ReentrancyGuard`, `Ownable`
7. **Constructor** mínimo

### No hacer
- NO implementar `submitResponse`, `claimReward`, ni `closeSurvey` todavía
- NO agregar lógica de USDC/ERC20
- NO agregar cooldown ni World ID
- NO agregar Pausable (se añade después si es necesario)

### Criterio de "done"
- `npx hardhat compile` sin errores ni warnings
- El contrato solo tiene `createSurvey()` como función pública
- Test básico: deploy del contrato exitoso + crear una survey con ETH
