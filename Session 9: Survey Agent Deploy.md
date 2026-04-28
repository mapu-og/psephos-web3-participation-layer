# Session 9: Survey Agent Deploy

## Objetivo
Crear un script `scripts/seed.ts` para poblar la plataforma con encuestas de prueba en Base Sepolia, sin re-deployar el contrato ni modificar el frontend.

## Contrato
- **Address:** `0x5caba1c7e5caB1651FFF75Fc335010b92A75bE9b`
- **Network:** Base Sepolia (chainId 84532)
- **Wallet:** `0xC4569ae9467557c062cdbbFDaDB1C240Caf60D2A`

## Script creado
`alchemy-final/scripts/seed.ts`

### Lógica
1. Se conecta al contrato desplegado via `ethers.getContractAt()` (sin re-deployar)
2. Lee el timestamp del bloque más reciente para calcular deadlines relativos
3. Llama `createSurvey()` enviando exactamente `rewardPerResponse × maxResponses` en ETH
4. Espera confirmación de cada tx antes de enviar la siguiente
5. Extrae el `surveyId` del evento `SurveyCreated` en el receipt
6. Al final llama `getSurveyCount()` para confirmar el total

## Encuestas creadas

| surveyId | Título | Reward | Resp. | Deadline | Tx Hash |
|----------|--------|--------|-------|----------|---------|
| 1 | What's your favorite L2? | 0.001 ETH | 5 | +7 días | `0x120d2fb9...` |
| 2 | DeFi vs CeFi - Your take? | 0.002 ETH | 3 | +3 días | `0x46185795...` |
| 3 | Rate your Web3 experience | 0.0005 ETH | 3 | +14 días | `0xa521ee78...` |

`getSurveyCount()` → **4** (incluye survey id 0 de sesiones previas)

## Incidente y solución
En el primer intento la encuesta 3 falló con `ProviderError: insufficient funds`:
- Balance disponible tras encuestas 1 y 2: **~0.00198 ETH**
- Pool requerido original (0.0005 × 10): **0.005 ETH** — insuficiente

**Fix:** se redujo `maxResponses` de 10 → 3 (pool: 0.0015 ETH) y se reanudó el loop desde el índice 2 para no duplicar las primeras dos encuestas.

## Ejecución
```bash
cd alchemy-final
npx hardhat run scripts/seed.ts --network baseSepolia
```

## Criterio de done ✅
- [x] Script ejecuta sin errores
- [x] 3 encuestas creadas en Base Sepolia
- [x] Las encuestas aparecen en el frontend en localhost:3000
