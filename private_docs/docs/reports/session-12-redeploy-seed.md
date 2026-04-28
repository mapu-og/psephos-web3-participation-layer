# Session 12: Re-deploy + Seed — Reporte

## Objetivo
Re-deployar el contrato SurveyPlatform actualizado a Base Sepolia, seedear 3 encuestas de prueba y actualizar el frontend con la nueva dirección y ABI.

## Contrato
- Old address: `0x5caba1c7e5caB1651FFF75Fc335010b92A75bE9b`
- New address: `0x0D233F66Bd1fB5D2DB1A104Bd73Ba6fcC5cc8Aa8`
- Network: Base Sepolia (84532)
- Verified: ✅ (Sourcify) / ❌ (Etherscan — sin API key)
- Sourcify: https://repo.sourcify.dev/contracts/full_match/84532/0x0D233F66Bd1fB5D2DB1A104Bd73Ba6fcC5cc8Aa8/

## Encuestas seeded
| surveyId | Título | Reward | Max | Tx Hash |
|----------|--------|--------|-----|---------|
| 0 | What's your favorite L2? | 0.0005 ETH | 3 | `0x3f6d7dacc243b0df4b7673ac4e40fa1a256193431fecaf9a6ec62ed7932bbac0` |
| 1 | DeFi vs CeFi - Your take? | 0.0005 ETH | 3 | `0x6e8a5b6a15fc9c1220715ece0cd09fe1b5b17e02b9831044b06159cd1c3cfa89` |
| 2 | Rate your Web3 experience | 0.0005 ETH | 3 | `0xc3afb964549bb76f05d6ff251194eb9f762f57d4de79a4b73509e7356f3b16bd` |

Total ETH depositado: 0.0045 ETH (3 × 0.0015 ETH)

## Cambios en archivos
- `frontend/src/config/contract.ts`: nueva address + ABI completo con custom errors e `internalType`
- `scripts/seed.ts`: nueva address, loop desde i=0, rewards reducidos a 0.0005 ETH, maxResponses=3

## Comandos ejecutados
- `npx hardhat test` → 28 passing
- `npx hardhat run scripts/deploy.ts --network baseSepolia` → `0x0D233F66Bd1fB5D2DB1A104Bd73Ba6fcC5cc8Aa8`
- `npx hardhat verify --network baseSepolia 0x0D233F66Bd1fB5D2DB1A104Bd73Ba6fcC5cc8Aa8` → Sourcify ✅
- `npx hardhat run scripts/seed.ts --network baseSepolia` → 3 surveys (blocks 40426414–40426416)
- `npm run build` → OK (5 páginas, sin errores)

## Errores encontrados y solución
- Verificación en Etherscan falló por falta de API key — no es blocker. Sourcify verificó correctamente.

## Estado final
- Contract deployed: ✅
- Seed: ✅ (3 surveys, surveyIds 0, 1, 2)
- Frontend build: ✅
