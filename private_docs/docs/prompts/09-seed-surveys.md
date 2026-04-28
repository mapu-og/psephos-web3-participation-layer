# Session 9: Seed Test Surveys

## Contexto
Contrato deployado en Base Sepolia: `0x5caba1c7e5caB1651FFF75Fc335010b92A75bE9b`
El frontend está funcionando en localhost:3000.
Necesitamos encuestas de prueba para que la plataforma no se vea vacía.

## Task
Crear un script `scripts/seed.ts` que cree 3 encuestas de prueba en Base Sepolia.

### Encuestas a crear

| # | Título | IPFS Hash | Reward/resp | Max resp | Deadline |
|---|--------|-----------|-------------|----------|----------|
| 1 | "What's your favorite L2?" | QmL2SurveyHash001 | 0.001 ETH | 5 | +7 días |
| 2 | "DeFi vs CeFi - Your take?" | QmDeFiCeFiHash002 | 0.002 ETH | 3 | +3 días |
| 3 | "Rate your Web3 experience" | QmWeb3ExpHash003 | 0.0005 ETH | 10 | +14 días |

### Requisitos del script
- Usar ethers.js (de Hardhat)
- Leer el contrato deployado (no re-deployar)
- Llamar `createSurvey()` 3 veces con los datos de arriba
- Enviar el ETH exacto (reward * maxResponses) en cada tx
- Esperar confirmación de cada tx antes de la siguiente
- Imprimir el surveyId y tx hash de cada una
- Al final imprimir el total de surveys con `getSurveyCount()`

### Ejecución
```bash
cd alchemy-final
npx hardhat run scripts/seed.ts --network baseSepolia
```

### Criterio de done
- El script ejecuta sin errores
- 3 encuestas creadas en Base Sepolia
- Las encuestas aparecen en el frontend al refrescar localhost:3000

### No hacer
- No modificar el contrato
- No modificar el frontend
- No crear más de 3 encuestas (conservar ETH de testnet)
