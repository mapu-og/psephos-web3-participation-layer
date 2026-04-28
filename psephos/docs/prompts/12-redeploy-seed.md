# Session 12: Re-deploy + Seed + Update Frontend

## Rol
Eres un senior Web3 engineer. Deployea el contrato actualizado, actualiza el frontend, y seedea encuestas de prueba.

## Entorno
- Proyecto: `/home/mapucorp/projects/Alchemy University/Ethereum Bootcamp/alchemy-final/`
- Contrato: `contracts/SurveyPlatform.sol` (Solidity 0.8.20, ya actualizado en Session 10)
- Deploy script: `scripts/deploy.ts`
- Seed script: `scripts/seed.ts` (necesita actualización)
- Frontend config: `frontend/src/config/contract.ts`
- Network: Base Sepolia (chainId 84532)
- RPC: definido en `.env` como `BASE_SEPOLIA_RPC_URL`
- Private key: definida en `.env` como `PRIVATE_KEY`
- Wallet: `0xC4569ae9467557c062cdbbFDaDB1C240Caf60D2A`

## REGLA CRÍTICA
- NO modificar `SurveyPlatform.sol` ni los tests
- NO modificar la UI/componentes del frontend (solo `config/contract.ts`)
- Generar reporte en `docs/reports/session-12-redeploy-seed.md`

---

## PASO 1: Verificar que los tests pasan
```bash
cd /home/mapucorp/projects/Alchemy\ University/Ethereum\ Bootcamp/alchemy-final
npx hardhat test
```
Debe dar 28 passing. Si falla, PARAR y reportar.

## PASO 2: Deploy a Base Sepolia
```bash
npx hardhat run scripts/deploy.ts --network baseSepolia
```
Anotar la nueva dirección del contrato. El script ya imprime el address y hace sanity check.

## PASO 3: Verificar contrato en Sourcify/BaseScan
```bash
npx hardhat verify --network baseSepolia <NEW_CONTRACT_ADDRESS>
```
Si falla la verificación, intentar con Sourcify (ya está configurado en hardhat.config.ts). No es blocker si falla.

## PASO 4: Actualizar `frontend/src/config/contract.ts`

### 4.1 Actualizar CONTRACT_ADDRESS
Cambiar la dirección vieja por la nueva:
```ts
export const CONTRACT_ADDRESS = "<NEW_CONTRACT_ADDRESS>" as const;
```

### 4.2 Actualizar el ABI
El ABI cambió en Session 10 (custom errors, structs sin `id`/`surveyId`, sin `hasClaimed` mapping). Regenerar el ABI correcto:

```bash
cd /home/mapucorp/projects/Alchemy\ University/Ethereum\ Bootcamp/alchemy-final
npx hardhat compile
```

Leer el ABI del artifact:
```bash
cat artifacts/contracts/SurveyPlatform.sol/SurveyPlatform.json | python3 -c "import sys,json; print(json.dumps(json.load(sys.stdin)['abi'], indent=2))"
```

Reemplazar COMPLETO el array `SURVEY_PLATFORM_ABI` en `frontend/src/config/contract.ts` con el ABI del artifact.

### 4.3 Verificar tipos
Los tipos `SurveyStruct` y `ResponseStruct` ya fueron actualizados en Session 10 (sin `id` ni `surveyId`). Verificar que coinciden con los structs del contrato actual:

```ts
export type SurveyStruct = {
  creator: `0x${string}`;
  title: string;
  ipfsHash: string;
  rewardPerResponse: bigint;
  maxResponses: bigint;
  responseCount: bigint;
  deadline: bigint;
  balance: bigint;
  active: boolean;
};

export type ResponseStruct = {
  respondent: `0x${string}`;
  answerHash: string;
  timestamp: bigint;
  claimed: boolean;
};
```

## PASO 5: Actualizar seed script
Editar `scripts/seed.ts`:
1. Cambiar `CONTRACT_ADDRESS` a la nueva dirección
2. Quitar el comment "Resume from index 2" y cambiar `for (let i = 2;` a `for (let i = 0;`
3. Reducir rewards para no gastar mucho testnet ETH:

```ts
const SURVEYS: SurveyData[] = [
  {
    title: "What's your favorite L2?",
    ipfsHash: "QmL2SurveyHash001",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 7 * 24 * 60 * 60,
  },
  {
    title: "DeFi vs CeFi - Your take?",
    ipfsHash: "QmDeFiCeFiHash002",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 3 * 24 * 60 * 60,
  },
  {
    title: "Rate your Web3 experience",
    ipfsHash: "QmWeb3ExpHash003",
    rewardPerResponse: ethers.parseEther("0.0005"),
    maxResponses: 3n,
    deadlineOffset: 14 * 24 * 60 * 60,
  },
];
```
Total: 3 × (0.0005 × 3) = 0.0045 ETH

## PASO 6: Ejecutar seed
```bash
npx hardhat run scripts/seed.ts --network baseSepolia
```
Debe crear 3 surveys. Anotar los surveyIds y tx hashes.

## PASO 7: Verificar frontend compila
```bash
cd frontend && npm run build
```
Debe compilar sin errores con el nuevo ABI y address.

## PASO 8: Test rápido
```bash
cd frontend && npm run dev
```
Abrir http://localhost:3000 y verificar que:
- Las 3 surveys seeded aparecen en la lista
- Se puede navegar a una survey
- La UI Psephos se ve correctamente

---

## Criterio de done
- [ ] 28 tests passing
- [ ] Contrato deployed a Base Sepolia (nueva address)
- [ ] `CONTRACT_ADDRESS` actualizado en frontend
- [ ] ABI actualizado en frontend desde artifact
- [ ] Seed script actualizado y ejecutado (3 surveys)
- [ ] `npm run build` sin errores
- [ ] Generar reporte

## Reporte
Al finalizar, crear `docs/reports/session-12-redeploy-seed.md`:
```markdown
# Session 12: Re-deploy + Seed — Reporte

## Objetivo
(1 línea)

## Contrato
- Old address: `0x5caba1c7e5caB1651FFF75Fc335010b92A75bE9b`
- New address: `<NEW_ADDRESS>`
- Network: Base Sepolia (84532)
- Verified: ✅/❌

## Encuestas seeded
| surveyId | Título | Reward | Max | Tx Hash |
|----------|--------|--------|-----|---------|
| 0 | ... | ... | ... | ... |

## Comandos ejecutados
- `npx hardhat test` → 28 passing
- `npx hardhat run scripts/deploy.ts --network baseSepolia` → address
- `npx hardhat run scripts/seed.ts --network baseSepolia` → 3 surveys
- `npm run build` → OK

## Errores encontrados y solución
(si hubo)

## Estado final
- Contract deployed: ✅/❌
- Seed: ✅/❌
- Frontend build: ✅/❌
```

## NO hacer
- NO modificar `SurveyPlatform.sol` ni tests
- NO modificar componentes UI del frontend
- NO modificar `wagmi.ts` ni `Providers.tsx`
- NO instalar paquetes nuevos
