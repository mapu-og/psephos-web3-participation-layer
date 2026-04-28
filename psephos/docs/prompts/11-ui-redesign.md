# Session 11: UI Redesign — Migrar diseño Figma a frontend Next.js

## Rol
Eres un senior frontend engineer especializado en Next.js 14 + wagmi v2 + Tailwind CSS. Tu tarea es migrar el diseño visual del prototipo Figma al frontend existente, manteniendo TODA la lógica wagmi intacta.

## Entorno
- Proyecto: `/home/mapucorp/projects/Alchemy University/Ethereum Bootcamp/alchemy-final/`
- Frontend: `frontend/` (Next.js 14 App Router, wagmi v2, viem v2, RainbowKit, Tailwind)
- Diseño Figma (referencia visual): `/home/mapucorp/projects/Alchemy University/Ethereum Bootcamp/Figma/`
- Network: Base Sepolia (chainId 84532)
- Nombre del proyecto: **Psephos** (logo: ψ)

## REGLA CRÍTICA
- **NO** modificar la lógica wagmi/viem (hooks, writeContract, useReadContract, etc.)
- **NO** tocar `config/wagmi.ts` ni `config/contract.ts`
- **NO** tocar `providers/Providers.tsx`
- **NO** instalar paquetes nuevos excepto `lucide-react` (para iconos)
- **NO** tocar nada fuera de `frontend/`
- Al final: `cd frontend && npm run build` DEBE compilar sin errores
- Generar reporte en `docs/reports/session-11-ui-redesign.md`

---

## Instrucciones paso a paso

### PASO 0: Instalar lucide-react
```bash
cd frontend && npm install lucide-react
```

### PASO 1: Estilos globales — `globals.css`
Reemplazar el contenido de `frontend/src/app/globals.css` con los estilos del Figma.

Leer el archivo fuente: `/home/mapucorp/projects/Alchemy University/Ethereum Bootcamp/Figma/styles/index.css`

Copiar TODOS los estilos Psephos (las clases `.psephos-card`, `.btn-primary`, `.btn-success`, `.btn-wallet`, `.btn-view`, `.btn-ghost`, `.psephos-input`, `.nav-link`, `.progress-track`, `.progress-fill`, `.mobile-menu`, `.badge-active`, `.badge-closed`, `.badge-expired`) y agregarlos DESPUÉS de las directivas de Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* === Psephos Design System === */
body {
  font-family: 'Inter', sans-serif;
  background-color: #0F1117;
  color: #F5F6FA;
}

/* ... (copiar todas las clases del index.css del Figma) ... */
```

También agregar las clases de badges que faltan:
```css
.badge-active {
  background: rgba(0, 229, 204, 0.12);
  color: #00E5CC;
  border: 1px solid rgba(0, 229, 204, 0.3);
}
.badge-closed {
  background: rgba(139, 143, 163, 0.12);
  color: #8B8FA3;
  border: 1px solid rgba(139, 143, 163, 0.3);
}
.badge-expired {
  background: rgba(229, 77, 77, 0.12);
  color: #E54D4D;
  border: 1px solid rgba(229, 77, 77, 0.3);
}
```

### PASO 2: Crear componentes reutilizables
Crear la carpeta `frontend/src/components/` y estos archivos. Tomar el código visual del Figma pero adaptar los tipos para usar datos on-chain (bigint, hex addresses, etc.).

#### 2.1 `components/MeanderBorder.tsx`
Copiar exactamente de: `Figma/app/components/MeanderBorder.tsx`
Sin cambios (es un componente visual puro).

#### 2.2 `components/StatusBadge.tsx`
```tsx
"use client";

interface Props {
  active: boolean;
  deadline: bigint; // unix timestamp
}

export function StatusBadge({ active, deadline }: Props) {
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now > Number(deadline);
  
  const status = !active ? "closed" : isExpired ? "expired" : "active";
  const label = status === "active" ? "Active" : status === "closed" ? "Closed" : "Expired";
  
  return (
    <span
      className={`badge-${status} text-xs font-medium px-2.5 py-1 rounded-full`}
      style={{ letterSpacing: "0.04em", textTransform: "uppercase", fontSize: "0.65rem" }}
    >
      {label}
    </span>
  );
}
```

#### 2.3 `components/SurveyCard.tsx`
Tomar el diseño visual de `Figma/app/pages/Home.tsx` (el componente `SurveyCard`), pero:
- Usar `Link` de `next/link` (no `react-router`)
- Recibir props con tipos on-chain: `{ id: bigint; title: string; ipfsHash: string; rewardPerResponse: bigint; maxResponses: bigint; responseCount: bigint; deadline: bigint; active: boolean }`
- Usar `formatEther()` de `viem` para mostrar rewards
- Usar la `StatusBadge` creada arriba
- Incluir: cyan accent bar, status badge, deadline, title, IPFS hash truncado, reward, progress bar con color rojo cuando está full, "View Survey →" button
- Agregar `"use client"` al inicio

#### 2.4 `components/StatsBar.tsx`
Tomar de `Figma/app/pages/Home.tsx` (la sección stats strip). Recibir:
```tsx
interface Props {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
}
```
Mostrar los 3 stats en una grid de 3 columnas con estilo `psephos-card`.

#### 2.5 `components/DetailRow.tsx`
Copiar de `Figma/app/pages/SurveyDetail.tsx` (el componente `DetailRow`). Incluye la funcionalidad de copy-to-clipboard.

#### 2.6 `components/InputField.tsx`
Copiar de `Figma/app/pages/CreateSurvey.tsx` (el componente `InputField`). Es el wrapper de label + icon + input + hint/error.

#### 2.7 `components/TxHashDisplay.tsx`
Copiar de `Figma/app/pages/SurveyDetail.tsx` (el componente `TxHashDisplay`). Cambiar la URL base a `https://sepolia.basescan.org/tx/` (Base Sepolia, NO mainnet).

### PASO 3: Actualizar `layout.tsx`
Rediseñar `frontend/src/app/layout.tsx` usando el layout del Figma (`Figma/app/components/Layout.tsx`).

Cambios clave:
- **Header**: Logo "ψ Psephos" con glow cyan a la izquierda, nav links "Surveys" y "Create" al centro con active state, `<ConnectButton />` de RainbowKit a la derecha (NO el wallet custom del Figma)
- **Header sticky** con blur backdrop
- **MeanderBorder** decorativo debajo del header
- **Mobile hamburger menu** (copiar la lógica del Figma, pero usar `<ConnectButton />` dentro)
- **Footer**: Logo ψ + "Psephos" + "Decentralized survey infrastructure" | Contract address link a BaseScan (usar `CONTRACT_ADDRESS` de config) | "© 2026 Psephos. Built on Base."
- **MeanderBorder** decorativo encima del footer
- Background `#0F1117`, max-width `7xl`
- Importar `CONTRACT_ADDRESS` desde `@/config/contract`

IMPORTANTE: `layout.tsx` es un **Server Component** por defecto en Next.js. El header con nav active state y mobile menu necesita ser client. Extraer el header a un componente separado `components/Header.tsx` con `"use client"` que reciba nada y use `usePathname()` de `next/navigation` para el active state. El layout importa `<Header />` y el footer puede quedar inline en el server component.

### PASO 4: Actualizar `page.tsx` (Home)
Rediseñar `frontend/src/app/page.tsx` usando el diseño de `Figma/app/pages/Home.tsx`.

**Mantener EXACTAMENTE** estos hooks wagmi existentes:
- `useReadContract` para `getActiveSurveys`
- `useReadContracts` para batch de `getSurvey`
- La lógica de mapping de `surveysData` a `SurveyWithId[]`

**Cambiar solo el JSX**:
- Heading: "Active Surveys" + subtitle "Earn ETH by contributing verified responses on-chain" + botón "Create Survey" con PlusCircle icon
- `<StatsBar>` con datos calculados del array de surveys
- Grid de `<SurveyCard>` (3 columnas en desktop, 1 en mobile)
- Empty state con el ψ glow y botón "Create Survey"
- Loading state con skeleton o texto estilizado
- Error state con mensaje amigable

### PASO 5: Actualizar `create/page.tsx`
Rediseñar usando el diseño de `Figma/app/pages/CreateSurvey.tsx`.

**Mantener EXACTAMENTE** la lógica wagmi:
- `useWriteContract`, `useWaitForTransactionReceipt`, `useAccount`
- `handleSubmit` con `writeContract()`
- `totalEthDisplay` con `parseEther` + `formatEther`

**Cambiar solo el JSX**:
- Heading "Create Survey" + subtitle
- Wallet warning banner (si no conectado) — pero usar `<ConnectButton />` de RainbowKit
- Form con `<InputField>` components (title con FileText icon, ipfsHash con Hash icon, reward con Coins icon + "ETH" suffix, maxResponses con Users icon, deadline con Calendar icon)
- Total deposit callout con glow cyan
- Submit button con spinner animado y ψ icon
- Success screen con green check, tx hash link a BaseScan, "View Survey" + "Create Another" buttons

### PASO 6: Actualizar `survey/[id]/page.tsx`
Rediseñar usando el diseño de `Figma/app/pages/SurveyDetail.tsx`.

**Mantener EXACTAMENTE** toda la lógica wagmi:
- Todos los `useReadContract` hooks (survey, responded, responseData)
- Ambos `useWriteContract` hooks (doSubmit, doClaim)
- Ambos `useWaitForTransactionReceipt` hooks
- Los `useEffect` de refetch
- `handleSubmitResponse` y `handleClaimReward`

**Cambiar solo el JSX**:
- Layout 2 columnas (3+2 en desktop): detalles a la izquierda, acciones a la derecha
- Back link con ArrowLeft icon
- StatusBadge + título
- Detail card con MeanderBorder, DetailRows (IPFS hash copyable, Creator copyable, Reward en cyan, Deadline, Balance, Responses con progress bar)
- Action card "Participate":
  - No conectado → prompt con ConnectButton de RainbowKit
  - Survey cerrada/full → mensaje informativo
  - No respondido → form con answer hash input + Submit button con spinner
  - Respondido, no claimed → "Response Submitted" banner + Claim button verde con reward amount
  - Claimed → green celebration card con checkmark
- Mostrar `<TxHashDisplay>` después de submit y claim exitosos
- Not found state con ψ icon

### PASO 7: Favicon y meta tags
- Crear `frontend/public/favicon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">ψ</text></svg>
```
- Actualizar metadata en `layout.tsx`:
```ts
export const metadata: Metadata = {
  title: "Psephos — Decentralized Survey Infrastructure",
  description: "Create and answer paid surveys on Base. Votes as immutable as stone.",
  openGraph: {
    title: "Psephos",
    description: "Decentralized survey infrastructure on Base",
    type: "website",
  },
  icons: { icon: "/favicon.svg" },
};
```

### PASO 8: Tailwind config
Actualizar `frontend/tailwind.config.ts` para incluir la carpeta de componentes:
```ts
content: [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
],
```

### PASO 9: Verificar y compilar
```bash
cd frontend && npm run build
```
Debe compilar sin errores. Si hay errores de tipo, corregirlos.

---

## Criterio de done
- [ ] `npm install lucide-react` exitoso
- [ ] Estilos globales Psephos en `globals.css`
- [ ] 7 componentes creados en `components/`
- [ ] `layout.tsx` con header ψ Psephos + mobile menu + footer
- [ ] `page.tsx` con StatsBar + SurveyCard grid + empty state
- [ ] `create/page.tsx` con form rediseñado + success screen
- [ ] `survey/[id]/page.tsx` con layout 2 columnas + acciones
- [ ] Favicon ψ + meta tags actualizados
- [ ] `cd frontend && npm run build` — sin errores
- [ ] Generar reporte en `docs/reports/session-11-ui-redesign.md`

## Reporte
Al finalizar, crear `docs/reports/session-11-ui-redesign.md`:
```markdown
# Session 11: UI Redesign — Reporte

## Objetivo
(1 línea)

## Cambios aplicados
| # | Cambio | Estado |
|---|--------|--------|
| 1 | ... | ✅/❌ |

## Componentes creados
(lista con ruta)

## Comandos ejecutados
- `npm install lucide-react` → OK
- `npm run build` → OK/ERROR

## Errores encontrados y solución
(si hubo)

## Estado final
- Frontend build: OK ✅/❌
- Componentes: X creados
```

## NO hacer
- NO tocar `config/wagmi.ts`, `config/contract.ts`, `providers/Providers.tsx`
- NO modificar hooks wagmi ni lógica de transacciones
- NO agregar features nuevos (solo migrar diseño)
- NO tocar archivos fuera de `frontend/`
- NO instalar paquetes adicionales excepto `lucide-react`
- NO copiar mock data del Figma — usar datos on-chain existentes
- NO reemplazar `<ConnectButton />` de RainbowKit con wallet custom
