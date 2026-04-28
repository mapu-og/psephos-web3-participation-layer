# Prompt: submitResponse + claimReward

## Contexto
`SurveyPlatform.sol` ya tiene `createSurvey()` funcionando con tests.

## Task
Agregar dos funciones al contrato:

### `submitResponse(uint256 surveyId, string calldata answerHash)`
- Valida: survey activa, no expirada, no alcanzó maxResponses, wallet no ha respondido antes
- Guarda el Response struct
- Marca hasResponded = true
- Emite `AnswerSubmitted`
- NO transfiere ETH aquí (es pull payment)

### `claimReward(uint256 surveyId)`
- Valida: el msg.sender respondió esta survey, no ha hecho claim aún
- Marca claimed = true
- Transfiere rewardPerResponse al respondedor
- Usa `nonReentrant`
- Emite `RewardClaimed`

### Tests requeridos
1. Submit respuesta exitosa → evento emitido
2. Revert si ya respondió
3. Revert si survey expirada
4. Revert si maxResponses alcanzado
5. Claim exitoso → balance correcto
6. Revert si doble claim
7. Revert si no respondió

### Criterio de "done"
- Compila sin warnings
- Los 7 tests pasan
