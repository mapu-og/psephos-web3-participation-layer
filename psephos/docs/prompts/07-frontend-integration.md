# Session 7: Frontend Integration Test + Polish

## Contexto
El frontend en `alchemy-final/frontend/` ya tiene scaffold completo con RainbowKit + wagmi + viem.
Contrato deployado en Base Sepolia: `0x5caba1c7e5caB1651FFF75Fc335010b92A75bE9b`
El contrato está verificado en Sourcify.

## Task
Levantar el frontend, conectarlo al contrato real en Base Sepolia, y probar el flujo completo. Arreglar cualquier bug que aparezca.

### Pre-requisitos
1. Crear `.env.local` a partir de `.env.local.example` con un WalletConnect Project ID real (obtenlo de https://cloud.walletconnect.com — es gratis)
2. Levantar con `npm run dev`

### Flujo a verificar (end-to-end)
1. Abrir localhost:3000 — debe cargar sin errores
2. Conectar wallet con MetaMask (en Base Sepolia)
3. Ir a `/create` — crear una encuesta de prueba:
   - Título: "Test Survey 1"
   - IPFS Hash: "QmTestHash123"
   - Reward: 0.001 ETH
   - Max responses: 3
   - Deadline: +24 horas
   - Confirmar tx en MetaMask
4. Volver al Home — la encuesta debe aparecer en la lista
5. Ir al detalle de la encuesta — botón de responder debe estar visible
6. Responder la encuesta con un hash cualquiera → confirmar tx
7. Hacer claim del reward → confirmar tx → debe mostrar "Reward claimed ✅"

### Cosas a arreglar si fallan
- Si la página no refresca después de una tx → agregar `queryClient.invalidateQueries()` o `refetch()` al onSuccess del write
- Si hay errores de hidratación → verificar que las páginas con hooks de wagmi sean `"use client"`
- Si MetaMask no conecta → verificar que la chain Base Sepolia esté configurada en MetaMask
- Si el formulario de create calcula mal el ETH → verificar que multiplique `rewardPerResponse * maxResponses`

### Mejoras de UX mínimas (si el flujo funciona)
- Mostrar loading spinner o "Sending tx..." mientras la tx está pendiente
- Mostrar toast o mensaje de éxito cuando la tx se confirma
- Mostrar la dirección del contrato en el footer (link a BaseScan)
- Botón "Back to surveys" en la página de detalle

### Criterio de done
- El flujo completo (crear → listar → responder → claim) funciona sin errores
- Las páginas se actualizan después de cada transacción
- No hay errores en la consola del browser (excepto warnings de dependencias)

### No hacer
- No cambiar el contrato
- No agregar nuevas páginas
- No integrar IPFS real
- No agregar features que no estén en el MVP
- No cambiar la estructura de carpetas


## Output

All done. Here's the summary:

**Bug fixed:**
- page.tsx — Replaced `select`-based side effects in `useWaitForTransactionReceipt` with proper `useEffect` hooks. The `select` callback is meant for data transformation, not side effects like `refetch()`. This was causing unreliable state updates after submit/claim transactions.

**UX added:**
- layout.tsx — Added footer with contract address linking to BaseScan Sepolia.

**Already working (no changes needed):**
- Loading states in buttons ("Confirm in wallet…", "Confirming…") 
- Success messages after tx confirmation
- "← All surveys" back link in detail page
- Create page shows success screen + "Back to surveys" button after tx

**Dev server:** Running at `http://localhost:3000` — all 3 pages render without errors. The footer with the BaseScan link is visible on every page. Connect your MetaMask to Base Sepolia to test the full flow (create → list → respond → claim).