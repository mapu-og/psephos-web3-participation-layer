# Prompt: closeSurvey + withdrawRemaining

## Contexto
`SurveyPlatform.sol` tiene createSurvey, submitResponse, claimReward con tests pasando.

## Task
Agregar dos funciones:

### `closeSurvey(uint256 surveyId)`
- Solo el creator puede cerrar
- Marca active = false
- Emite `SurveyClosed`

### `withdrawRemaining(uint256 surveyId)` 
- Solo el creator, solo si survey cerrada o expirada
- Transfiere el balance restante (no reclamado) al creator
- Usa `nonReentrant`

### View functions
- `getSurvey(uint256 id)` → retorna el struct
- `getSurveyCount()` → total de surveys creadas
- `getResponse(uint256 surveyId, address respondent)` → retorna Response
- `getActiveSurveys()` → array de IDs activas (o paginado si es más eficiente en gas)

### Tests requeridos
1. Creator cierra survey → evento
2. Revert si non-creator intenta cerrar
3. Withdraw exitoso después de cerrar
4. Revert si survey aún activa
5. View functions retornan datos correctos

### Criterio de "done"
- Compila sin warnings
- Todos los tests anteriores + nuevos pasan
- El contrato MVP está COMPLETO
