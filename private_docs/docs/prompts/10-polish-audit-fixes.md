# Session 10: Polish — Audit Fixes (Contract + Frontend)

## Rol
Eres un senior Web3 engineer. Aplica los fixes listados abajo SIN cambiar la lógica core ni agregar features nuevos.

## Entorno
- Proyecto: `/home/mapucorp/projects/Alchemy University/Ethereum Bootcamp/alchemy-final/`
- Contrato: `contracts/SurveyPlatform.sol` (Solidity 0.8.20, OpenZeppelin 5.x)
- Tests: `test/SurveyPlatform.test.ts` (25 tests, Hardhat + chai + ethers)
- Frontend: `frontend/` (Next.js 14 App Router, wagmi v2, viem v2, RainbowKit, Tailwind)
- Network: Base Sepolia (chainId 84532)
- Config: `hardhat.config.ts`, `frontend/src/config/wagmi.ts`, `frontend/src/config/contract.ts`

## REGLA IMPORTANTE
- NO re-deployar el contrato todavía. Solo hacer cambios en código.
- Después de TODOS los fixes, correr `npx hardhat test` y confirmar que pasan TODOS los tests.
- Después de los fixes frontend, correr `cd frontend && npm run build` y confirmar que compila sin errores.
- Reportar ✅ por cada fix aplicado.

---

## PARTE A — Smart Contract Fixes

### A1. Proteger fondos de respondentes en `withdrawRemaining`
El creator actualmente puede drenar TODO `s.balance`, robando rewards no reclamados.

**Fix:** Calcular cuántos respondieron pero NO han reclamado, y proteger esos fondos:
```solidity
function withdrawRemaining(uint256 surveyId) external nonReentrant {
    Survey storage s = surveys[surveyId];
    require(msg.sender == s.creator, "Only creator");
    require(!s.active || block.timestamp > s.deadline, "Survey still active");

    // Protect unclaimed rewards
    uint256 claimedCount = 0;
    Response[] storage resps = responses[surveyId];
    for (uint256 i = 0; i < resps.length; i++) {
        if (resps[i].claimed) claimedCount++;
    }
    uint256 unclaimedRewards = (s.responseCount - claimedCount) * s.rewardPerResponse;
    uint256 withdrawable = s.balance - unclaimedRewards;
    require(withdrawable > 0, "Nothing to withdraw");

    s.balance -= withdrawable;

    (bool ok, ) = payable(msg.sender).call{value: withdrawable}("");
    require(ok, "Transfer failed");
}
```

### A2. `withdrawRemaining` debe desactivar la survey
Agregar `s.active = false;` antes del cálculo, para que `getActiveSurveys` no la devuelva.

### A3. Quitar `Ownable`
- Eliminar `import "@openzeppelin/contracts/access/Ownable.sol";`
- Cambiar `contract SurveyPlatform is ReentrancyGuard, Ownable` → `contract SurveyPlatform is ReentrancyGuard`
- Cambiar `constructor() Ownable(msg.sender) {}` → `constructor() {}`

### A4. Quitar campos duplicados del struct
- Quitar `uint256 id` del struct `Survey` (ya es la key del mapping)
- Quitar `uint256 surveyId` del struct `Response` (ya es parámetro)
- Quitar el mapping `hasClaimed` — usar solo `Response.claimed` via `responseIndexOf`
- Actualizar `claimReward` para checkar via `responses[surveyId][idx].claimed` en vez de `hasClaimed`
- Actualizar `createSurvey` para no asignar `id: surveyId`
- Actualizar los getters afectados

### A5. Custom errors en vez de strings
Reemplazar TODOS los `require(..., "string")` con custom errors. Ejemplo:
```solidity
error EmptyTitle();
error EmptyIpfsHash();
error RewardMustBePositive();
error MaxResponsesMustBePositive();
error DeadlineInPast();
error IncorrectDeposit();
error SurveyNotActive();
error SurveyExpired();
error MaxResponsesReached();
error AlreadyResponded();
error DidNotRespond();
error AlreadyClaimed();
error TransferFailed();
error OnlyCreator();
error SurveyStillActive();
error NothingToWithdraw();
error NoResponseFound();
```

### A6. Agregar validación `surveyId < nextSurveyId`
En `submitResponse`, `claimReward`, `closeSurvey`, `withdrawRemaining` y los getters, agregar:
```solidity
error InvalidSurveyId();
// ...
if (surveyId >= nextSurveyId) revert InvalidSurveyId();
```

### A7. Actualizar TODOS los tests
Los tests actuales usan `revertedWith("string")`. Cambiar TODOS a `revertedWithCustomError(contract, "ErrorName")`.
Agregar tests nuevos:
- Test que `withdrawRemaining` solo retira el surplus (no los rewards pendientes)
- Test que un respondent puede `claimReward` DESPUÉS de que el creator hizo `withdrawRemaining`
- Test con `surveyId` inválido revierte con `InvalidSurveyId`

---

## PARTE B — Frontend Fixes

### B1. Agregar `chainId` a TODOS los `writeContract` calls
En `create/page.tsx` y `survey/[id]/page.tsx`, agregar `chainId: 84532` (importar `baseSepolia` de `wagmi/chains`):
```ts
writeContract({
  address: CONTRACT_ADDRESS,
  abi: SURVEY_PLATFORM_ABI,
  functionName: "createSurvey",
  chainId: baseSepolia.id,  // ← agregar esto
  args: [...],
  value: ...,
});
```

### B2. Agregar polling a los reads
En `page.tsx` (home) y `survey/[id]/page.tsx`, agregar refetch cada 15 segundos:
```ts
useReadContract({
  ...
  query: { refetchInterval: 15_000 },
});
```

### B3. Agregar estados de error en home y survey detail
Destructurar `isError, error` de los hooks de lectura y mostrar un mensaje amigable:
```tsx
{isError && (
  <p className="text-red-500 text-center">
    Error loading data. Check your connection and try again.
  </p>
)}
```

### B4. Fix floating-point math en create page
Reemplazar `parseFloat(rewardEth) * parseInt(maxResponses)` con:
```ts
import { parseEther, formatEther } from "viem";
// ...
const totalWei = parseEther(rewardEth) * BigInt(maxResponses);
const totalEthDisplay = formatEther(totalWei);
```

### B5. Labels accesibles en formularios
En `create/page.tsx`, agregar `id` a cada input y `htmlFor` a cada label:
```tsx
<label htmlFor="title" ...>Title</label>
<input id="title" ... />
```
Hacer lo mismo para todos los campos (ipfsHash, rewardEth, maxResponses, deadline).
En `survey/[id]/page.tsx`, lo mismo para el input de answerHash.

### B6. Input limits
Agregar `maxLength` a los inputs de texto:
- title: `maxLength={100}`
- ipfsHash: `maxLength={100}`
- answerHash: `maxLength={100}`
Agregar `min="0.0001"` y `step="0.0001"` al input de reward.
Agregar `min="1"` y `max="1000"` al input de maxResponses.

### B7. Meta tags y favicon
En `layout.tsx`, actualizar metadata:
```ts
export const metadata: Metadata = {
  title: "SurveyPlatform — Decentralized Paid Surveys",
  description: "Create and answer paid surveys on Base. Earn ETH for your opinions.",
  openGraph: {
    title: "SurveyPlatform",
    description: "Decentralized paid surveys on Base",
    type: "website",
  },
};
```
Crear un favicon simple: `frontend/public/favicon.ico` — usa un emoji 📋 convertido a .ico, o simplemente crea un `frontend/public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>
```
Y en layout.tsx agregar el link:
```tsx
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
```

### B8. Importar CONTRACT_ADDRESS en el footer
En `layout.tsx`, el address está hardcodeado. Importarlo desde config:
```tsx
import { CONTRACT_ADDRESS } from "@/config/contract";
```
Y usarlo en el href y el texto del footer.
NOTA: layout.tsx es Server Component. Si `contract.ts` no tiene nada client-only, el import funciona directo. Si tiene `"use client"`, extraer la constante a un archivo separado `contract-address.ts` sin directiva.

---

## Criterio de done
- [ ] Contract compila sin warnings
- [ ] `npx hardhat test` — TODOS pasan (los 25 originales adaptados + los 3 nuevos)
- [ ] `cd frontend && npm run build` — sin errores
- [ ] Listar cada fix con ✅
- [ ] Generar reporte en `docs/reports/session-10-audit-fixes.md`

## Reporte
Al finalizar, crear el archivo `docs/reports/session-10-audit-fixes.md` con este formato:
```markdown
# Session 10: Audit Fixes — Reporte

## Objetivo
(1 línea)

## Fixes aplicados
| ID | Fix | Estado |
|----|-----|--------|
| A1 | ... | ✅/❌ |
| ... | ... | ... |

## Comandos ejecutados
- `npx hardhat test` → X tests passing
- `cd frontend && npm run build` → OK/ERROR

## Errores encontrados y solución
(Si hubo alguno, describir qué pasó y cómo se resolvió)

## Estado final
- Contract: compila ✅/❌
- Tests: XX passing ✅/❌
- Frontend build: OK ✅/❌
```

## NO hacer
- NO re-deployar el contrato
- NO modificar la lógica de `createSurvey`, `submitResponse`, o `claimReward` (excepto cambiar strings por custom errors y quitar campos duplicados)
- NO agregar features nuevos
- NO instalar paquetes nuevos
- NO tocar `scripts/seed.ts` ni `scripts/deploy.ts`
